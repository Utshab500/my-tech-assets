import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/prisma'

const FACTS_MODEL = 'claude-haiku-4-5-20251001'

const EXTRACTION_PROMPT = `Extract fitness-relevant personal facts explicitly stated by the user. Return a flat JSON object — keys like "injuries", "schedule", "equipment", "diet", "age", "weight", "height". Only include keys where the user explicitly mentioned something specific. If no personal facts are mentioned, return null.

Examples of facts worth capturing:
- "I have a bad knee" → { "injuries": "bad knee" }
- "I can only train 3 days a week" → { "schedule": "3 days per week" }
- "I only have dumbbells at home" → { "equipment": "dumbbells at home" }
- "I'm vegetarian" → { "diet": "vegetarian" }

Return ONLY raw JSON or the word null. No explanation, no markdown.`

export async function extractAndUpdateFacts(
  anthropic: Anthropic,
  userId: string,
  userMessage: string,
  assistantResponse: string,
): Promise<void> {
  try {
    const response = await anthropic.messages.create({
      model: FACTS_MODEL,
      max_tokens: 256,
      system: EXTRACTION_PROMPT,
      messages: [
        {
          role: 'user',
          content: `User message: "${userMessage}"\n\nCoach response: "${assistantResponse.slice(0, 500)}"`,
        },
      ],
    })

    const text = response.content[0]?.type === 'text' ? response.content[0].text.trim() : null
    if (!text || text === 'null') return

    let extracted: Record<string, string>
    try {
      extracted = JSON.parse(text)
    } catch {
      return
    }
    if (!extracted || typeof extracted !== 'object' || Object.keys(extracted).length === 0) return

    // Merge extracted facts into profile.constraints
    const existing = await prisma.profile.findUnique({ where: { userId }, select: { constraints: true } })
    const currentConstraints =
      existing?.constraints && typeof existing.constraints === 'object'
        ? (existing.constraints as Record<string, unknown>)
        : {}

    const merged = { ...currentConstraints, ...extracted } as Record<string, string>
    await prisma.profile.upsert({
      where: { userId },
      create: { userId, constraints: extracted },
      update: { constraints: merged },
    })
  } catch (err) {
    console.error('[facts] extraction error:', err)
  }
}
