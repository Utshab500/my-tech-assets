import type { MessageRole } from '@/generated/prisma/client'

// Max tokens budgeted for conversation history (leaves room for system prompt + response).
const MAX_HISTORY_TOKENS = 60_000

export interface HistoryMessage {
  role: MessageRole
  content: string
}

export interface AnthropicMessage {
  role: 'user' | 'assistant'
  content: string
}

// Rough token estimate: ~4 characters per token.
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

/**
 * Trim the conversation history to fit within MAX_HISTORY_TOKENS.
 * Always keeps the most recent messages; drops oldest first.
 */
export function trimHistory(messages: HistoryMessage[]): AnthropicMessage[] {
  const mapped: AnthropicMessage[] = messages.map((m) => ({
    role: m.role === 'user' ? 'user' : 'assistant',
    content: m.content,
  }))

  let budget = MAX_HISTORY_TOKENS
  const kept: AnthropicMessage[] = []

  for (let i = mapped.length - 1; i >= 0; i--) {
    const tokens = estimateTokens(mapped[i].content)
    if (budget - tokens < 0) break
    kept.unshift(mapped[i])
    budget -= tokens
  }

  // Anthropic requires the first message to be from the user.
  while (kept.length > 0 && kept[0].role === 'assistant') {
    kept.shift()
  }

  return kept
}
