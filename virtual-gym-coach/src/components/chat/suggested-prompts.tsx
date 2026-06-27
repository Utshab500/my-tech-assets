const PROMPTS = [
  'Build me a 3-day training plan',
  'Fix my squat form',
  'Post-workout nutrition guide',
]

export function SuggestedPrompts({ onSelect }: { onSelect: (prompt: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 py-16">
      <div className="text-center">
        <h2
          className="text-2xl font-semibold tracking-tight mb-2"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}
        >
          How can I help you today?
        </h2>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Ask me anything about training, nutrition, or recovery.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => onSelect(prompt)}
            className="rounded-full border px-4 py-2 text-sm transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
            style={{
              borderColor: 'var(--border)',
              color: 'var(--ink)',
              background: 'var(--surface)',
            }}
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  )
}
