import { describe, it, expect } from 'vitest'
import { buildSystemPrompt } from '@/coach/prompt'
import { trimHistory } from '@/coach/context'
import type { HistoryMessage } from '@/coach/context'

// ── System prompt guardrails ───────────────────────────────────────────────

describe('buildSystemPrompt — guardrails', () => {
  const prompt = buildSystemPrompt()

  it('asserts AI identity — never claims to be a real person', () => {
    expect(prompt).toContain('You are an AI coach')
    expect(prompt).toContain('do NOT claim to be any specific real person')
  })

  it('bans invention of real athlete data', () => {
    expect(prompt).toContain('Never invent')
    expect(prompt).toContain('named real person')
  })

  it('requires medical disclaimer', () => {
    expect(prompt).toContain("I'm not a doctor")
    expect(prompt).toContain('medical professional')
  })

  it('refuses unsafe recommendations', () => {
    expect(prompt).toContain('crash diets')
    expect(prompt).toContain('training through acute injury')
  })

  it('instructs to hold guardrails under user pushback', () => {
    expect(prompt).toContain('presses you to cross a guardrail, hold it')
  })
})

describe('buildSystemPrompt — persona voice', () => {
  const prompt = buildSystemPrompt()

  it('names the coaching domains', () => {
    expect(prompt).toContain('Strength & conditioning')
    expect(prompt).toContain('Nutrition')
    expect(prompt).toContain('Recovery & mobility')
    expect(prompt).toContain('Mindset')
  })

  it('instructs to ask before prescribing', () => {
    expect(prompt).toContain('Ask before you prescribe')
  })
})

describe('buildSystemPrompt — profile injection', () => {
  it('injects goal when profile has one', () => {
    const prompt = buildSystemPrompt({ goal: 'Run a sub-4-minute mile' })
    expect(prompt).toContain('Run a sub-4-minute mile')
    expect(prompt).toContain('User profile')
  })

  it('injects experience level', () => {
    const prompt = buildSystemPrompt({ experienceLevel: 'intermediate' })
    expect(prompt).toContain('intermediate')
  })

  it('omits profile section when profile is null', () => {
    const prompt = buildSystemPrompt(null)
    expect(prompt).not.toContain('User profile')
  })

  it('omits profile section when all fields are null', () => {
    const prompt = buildSystemPrompt({ goal: null, experienceLevel: null })
    expect(prompt).not.toContain('User profile')
  })
})

// ── Context trimming ──────────────────────────────────────────────────────

describe('trimHistory', () => {
  const makeMsg = (role: 'user' | 'assistant', chars: number): HistoryMessage => ({
    role,
    content: 'x'.repeat(chars),
  })

  it('returns messages unchanged when under budget', () => {
    const msgs: HistoryMessage[] = [makeMsg('user', 10), makeMsg('assistant', 10)]
    const result = trimHistory(msgs)
    expect(result).toHaveLength(2)
    expect(result[0].role).toBe('user')
  })

  it('drops oldest messages when over budget', () => {
    // Budget = 60_000 tokens ≈ 240_000 chars.
    // Two messages of 200_000 chars each = ~100_000 tokens total — exceeds budget.
    const old1 = makeMsg('user', 200_000)
    const old2 = makeMsg('assistant', 200_000)
    const recent = makeMsg('user', 100)
    const result = trimHistory([old1, old2, recent])
    expect(result.some((m) => m.content === recent.content)).toBe(true)
    expect(result.some((m) => m.content === old1.content)).toBe(false)
  })

  it('ensures first message is always from the user', () => {
    const msgs: HistoryMessage[] = [
      makeMsg('user', 10),
      makeMsg('assistant', 10),
      makeMsg('user', 10),
    ]
    const result = trimHistory(msgs)
    expect(result[0].role).toBe('user')
  })

  it('maps MessageRole assistant → "assistant"', () => {
    const msgs: HistoryMessage[] = [makeMsg('user', 5), makeMsg('assistant', 5)]
    const result = trimHistory(msgs)
    expect(result[1].role).toBe('assistant')
  })
})
