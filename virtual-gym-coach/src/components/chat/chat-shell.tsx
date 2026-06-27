'use client'

import { useState } from 'react'
import { PanelLeft, LogIn, LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { MessageList } from './message-list'
import { InputBar } from './input-bar'
import { SuggestedPrompts } from './suggested-prompts'
import { OnboardingModal } from '@/components/onboarding/onboarding-modal'
import type { ChatMessage } from './message-item'

interface ChatUser {
  id: string
  email: string
  name?: string | null
}

interface ChatShellProps {
  user: ChatUser | null
  showOnboarding?: boolean
}

export function ChatShell({ user, showOnboarding = false }: ChatShellProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [railOpen, setRailOpen] = useState(false)
  const [onboardingVisible, setOnboardingVisible] = useState(showOnboarding)

  async function sendMessage(text: string) {
    if (!text.trim() || isLoading) return

    const userMsgId = crypto.randomUUID()
    const assistantMsgId = crypto.randomUUID()

    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: 'user', content: text.trim(), isStreaming: false },
      { id: assistantMsgId, role: 'assistant', content: '', isStreaming: true },
    ])
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim(), conversationId }),
      })

      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6)) as {
              type: string
              conversationId?: string
              text?: string
              message?: string
            }

            if (data.type === 'meta' && data.conversationId) {
              setConversationId(data.conversationId)
            }
            if (data.type === 'delta' && data.text) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId
                    ? { ...m, content: m.content + data.text }
                    : m,
                ),
              )
            }
            if (data.type === 'done' || data.type === 'error') {
              const errorContent = data.type === 'error' ? (data.message ?? 'Something went wrong.') : undefined
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId
                    ? { ...m, isStreaming: false, ...(errorContent ? { content: errorContent } : {}) }
                    : m,
                ),
              )
            }
          } catch {
            // skip malformed SSE lines
          }
        }
      }
    } catch (err) {
      console.error('[chat]', err)
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? { ...m, content: 'Sorry, I couldn\'t connect. Please try again.', isStreaming: false }
            : m,
        ),
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* ── Left Rail ────────────────────────────────────────────────────── */}
      <aside
        className={cn(
          'flex-shrink-0 flex flex-col border-r overflow-hidden transition-all duration-200',
          railOpen ? 'w-60' : 'w-0',
        )}
        style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
        aria-label="Sidebar"
      >
        {railOpen && (
          <div className="flex flex-col h-full px-3 py-4 gap-1">
            <p
              className="px-2 pb-2 text-xs font-semibold uppercase tracking-widest"
              style={{ color: 'var(--muted)' }}
            >
              History
            </p>
            <p className="px-2 text-xs" style={{ color: 'var(--muted)' }}>
              No conversations yet.
            </p>
          </div>
        )}
      </aside>

      {/* ── Main area ─────────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col min-w-0">

        {/* Header */}
        <header
          className="flex-shrink-0 flex items-center justify-between px-4 h-14 border-b"
          style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setRailOpen((o) => !o)}
              aria-label={railOpen ? 'Close sidebar' : 'Open sidebar'}
              className="p-1.5 rounded-lg transition-colors hover:bg-black/5"
              style={{ color: 'var(--muted)' }}
            >
              <PanelLeft size={18} />
            </button>
            <span
              className="text-base font-semibold tracking-tight"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}
            >
              Virtual Gym Coach
            </span>
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                <span className="text-xs hidden sm:block" style={{ color: 'var(--muted)' }}>
                  {user.name ?? user.email}
                </span>
                <button
                  onClick={() => signOut({ callbackUrl: '/sign-in' })}
                  aria-label="Sign out"
                  className="p-1.5 rounded-lg transition-colors hover:bg-black/5"
                  style={{ color: 'var(--muted)' }}
                >
                  <LogOut size={16} />
                </button>
              </>
            ) : (
              <Link
                href="/sign-in"
                className="flex items-center gap-1.5 text-sm rounded-lg px-3 py-1.5 transition-colors hover:bg-black/5"
                style={{ color: 'var(--ink)' }}
              >
                <LogIn size={15} />
                <span>Sign in</span>
              </Link>
            )}
          </div>
        </header>

        {/* Message area — scrollable */}
        {messages.length > 0 ? (
          <MessageList messages={messages} />
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-[720px] px-4">
              <SuggestedPrompts onSelect={sendMessage} />
            </div>
          </div>
        )}

        {/* Input bar — pinned bottom */}
        <div
          className="flex-shrink-0 px-4 pb-4 pt-2"
          style={{ background: 'var(--bg)' }}
        >
          <div className="mx-auto max-w-[720px]">
            <InputBar
              value={input}
              onChange={setInput}
              onSend={sendMessage}
              disabled={isLoading}
            />
            <p className="text-center text-xs mt-2" style={{ color: 'var(--muted)' }}>
              The Coach provides general fitness guidance, not medical advice.
            </p>
          </div>
        </div>
      </div>

      {/* Mobile rail overlay backdrop */}
      {railOpen && (
        <div
          className="fixed inset-0 z-10 sm:hidden"
          onClick={() => setRailOpen(false)}
          style={{ background: 'rgba(0,0,0,0.3)' }}
          aria-hidden
        />
      )}

      {/* Onboarding modal — shown once for new authenticated users */}
      {onboardingVisible && (
        <OnboardingModal onComplete={() => setOnboardingVisible(false)} />
      )}
    </div>
  )
}
