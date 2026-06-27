import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { buildSystemPrompt } from '@/coach/prompt'
import { trimHistory } from '@/coach/context'
import { streamWithRetry } from '@/coach/retry'
import { extractAndUpdateFacts } from '@/coach/facts'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const MODEL = 'claude-sonnet-4-6'
const MAX_TOKENS = 2048

export async function POST(request: NextRequest) {
  const session = await auth()
  const guestId = request.cookies.get('guest-id')?.value

  // Must have either an authenticated user or a guest cookie
  if (!session?.user?.id && !guestId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { message: string; conversationId?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { message, conversationId } = body
  if (!message?.trim()) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 })
  }

  const userId = session?.user?.id ?? null

  // ── Find or create conversation ──────────────────────────────────────────
  const conversation = conversationId
    ? await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          ...(userId ? { userId } : { guestId }),
        },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      })
    : null

  const conv = conversation ?? (await prisma.conversation.create({
    data: { userId, guestId: userId ? null : guestId },
    include: { messages: true },
  }))

  // ── Save the incoming user message ───────────────────────────────────────
  await prisma.message.create({
    data: { conversationId: conv.id, role: 'user', content: message.trim() },
  })

  // ── Load profile for authenticated users ─────────────────────────────────
  const profile = userId
    ? await prisma.profile.findUnique({ where: { userId } })
    : null

  // ── Assemble context ─────────────────────────────────────────────────────
  const allMessages = [...conv.messages, { role: 'user' as const, content: message.trim() }]
  const history = trimHistory(allMessages)
  const systemPrompt = buildSystemPrompt(profile)

  // ── Stream from Anthropic ─────────────────────────────────────────────────
  let stream: ReturnType<Anthropic['messages']['stream']>
  try {
    stream = await streamWithRetry(anthropic, {
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: history,
    })
  } catch (err) {
    console.error('[chat] Anthropic error:', err)
    return NextResponse.json({ error: 'Coach is unavailable. Please try again.' }, { status: 503 })
  }

  // ── Build SSE response ────────────────────────────────────────────────────
  const encoder = new TextEncoder()
  let fullText = ''
  const convId = conv.id

  const readable = new ReadableStream({
    async start(controller) {
      const send = (data: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))

      try {
        // Send conversation ID upfront so the client can track it
        send({ type: 'meta', conversationId: convId })

        for await (const event of stream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            fullText += event.delta.text
            send({ type: 'delta', text: event.delta.text })
          }
        }

        send({ type: 'done' })
      } catch (err) {
        send({ type: 'error', message: 'Stream interrupted' })
        console.error('[chat] stream error:', err)
      } finally {
        controller.close()

        // Persist the complete assistant reply (fire-and-forget)
        if (fullText) {
          prisma.message
            .create({
              data: { conversationId: convId, role: 'assistant', content: fullText },
            })
            .catch((e) => console.error('[chat] failed to save assistant message:', e))

          // Extract and persist personal facts from this turn (fire-and-forget)
          if (userId) {
            extractAndUpdateFacts(anthropic, userId, message, fullText)
              .catch((e) => console.error('[chat] fact extraction failed:', e))
          }
        }
      }
    },
  })

  return new NextResponse(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Conversation-Id': convId,
    },
  })
}
