import type Anthropic from '@anthropic-ai/sdk'

const TIMEOUT_MS = 30_000
const MAX_RETRIES = 2

function isRetryable(err: unknown): boolean {
  if (!(err instanceof Error)) return false
  const msg = err.message.toLowerCase()
  // Retry on rate-limit or server overload
  return (
    msg.includes('rate limit') ||
    msg.includes('overloaded') ||
    msg.includes('529') ||
    msg.includes('timeout')
  )
}

/**
 * Wraps an Anthropic streaming call with a timeout and exponential-backoff retry.
 * Returns the stream on success; throws on final failure.
 */
export async function streamWithRetry(
  anthropic: Anthropic,
  params: Parameters<Anthropic['messages']['stream']>[0],
): Promise<ReturnType<Anthropic['messages']['stream']>> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      const stream = anthropic.messages.stream(
        { ...params },
        { signal: controller.signal },
      )
      clearTimeout(timer)
      return stream
    } catch (err) {
      clearTimeout(timer)
      if (attempt === MAX_RETRIES || !isRetryable(err)) throw err
      await new Promise((r) => setTimeout(r, 1_000 * (attempt + 1)))
    }
  }

  // TypeScript unreachable
  throw new Error('Exhausted retries')
}
