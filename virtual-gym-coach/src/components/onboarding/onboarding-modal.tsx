'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface OnboardingModalProps {
  onComplete: () => void
}

const STEPS = [
  {
    key: 'goal' as const,
    heading: "What's your main fitness goal?",
    options: [
      { value: 'Lose fat and get leaner', label: 'Lose fat & get leaner' },
      { value: 'Build muscle and strength', label: 'Build muscle & strength' },
      { value: 'Improve athletic performance', label: 'Athletic performance' },
      { value: 'General fitness and health', label: 'General fitness' },
    ],
  },
  {
    key: 'experienceLevel' as const,
    heading: 'How long have you been training?',
    options: [
      { value: 'New to training (under 6 months)', label: 'New to training' },
      { value: 'Some experience (6 months to 2 years)', label: 'Some experience' },
      { value: 'Experienced (2+ years)', label: 'Experienced (2+ years)' },
      { value: 'Competitive athlete', label: 'Competitive athlete' },
    ],
  },
  {
    key: 'environment' as const,
    heading: 'Where do you usually train?',
    options: [
      { value: 'Commercial gym with full equipment', label: 'Gym (full equipment)' },
      { value: 'Home gym with basic equipment', label: 'Home gym (basic)' },
      { value: 'Home with bodyweight only', label: 'Home (bodyweight)' },
      { value: 'Outdoors', label: 'Outdoors' },
    ],
  },
]

type StepKey = (typeof STEPS)[number]['key']

export function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(0)
  const [selections, setSelections] = useState<Partial<Record<StepKey, string>>>({})
  const [saving, setSaving] = useState(false)

  const current = STEPS[step]
  const selected = current ? selections[current.key] : undefined
  const isLast = step === STEPS.length - 1

  async function save(data: Partial<Record<StepKey, string>>) {
    setSaving(true)
    try {
      await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal: data.goal ?? null,
          experienceLevel: data.experienceLevel ?? null,
          environment: data.environment ?? null,
        }),
      })
    } catch {
      // silently fail — don't block the user
    } finally {
      setSaving(false)
      onComplete()
    }
  }

  function handleSelect(value: string) {
    if (!current) return
    setSelections((prev) => ({ ...prev, [current.key]: value }))
  }

  function handleContinue() {
    if (!current || saving) return
    if (isLast) {
      save({ ...selections })
    } else {
      setStep((s) => s + 1)
    }
  }

  function handleSkip() {
    save({})
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.4)' }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-8 shadow-xl"
        style={{ background: 'var(--surface)' }}
        role="dialog"
        aria-modal="true"
        aria-label="Set up your coaching profile"
      >
        {/* Step indicator */}
        <div className="flex gap-1.5 mb-6">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className="h-1 flex-1 rounded-full transition-colors duration-200"
              style={{
                background: i <= step ? 'var(--accent)' : 'oklch(0.93 0 0)',
              }}
            />
          ))}
        </div>

        {current && (
          <>
            <h2
              className="text-xl font-semibold tracking-tight mb-6"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}
            >
              {current.heading}
            </h2>

            <div className="flex flex-col gap-2.5 mb-8">
              {current.options.map((opt) => {
                const isSelected = selected === opt.value
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleSelect(opt.value)}
                    className={cn(
                      'w-full text-left rounded-xl px-4 py-3 text-sm font-medium transition-all',
                      'border focus-visible:outline-none focus-visible:ring-2',
                      isSelected
                        ? 'border-[var(--accent)] text-[var(--accent)]'
                        : 'border-[oklch(0.9_0_0)] hover:border-[oklch(0.8_0_0)]',
                    )}
                    style={{
                      background: isSelected ? 'oklch(0.97 0.01 30)' : 'transparent',
                      color: isSelected ? 'var(--accent)' : 'var(--ink)',
                    }}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleContinue}
                disabled={!selected || saving}
                className={cn(
                  'w-full rounded-xl py-3 text-sm font-semibold transition-all',
                  selected && !saving
                    ? 'text-white hover:opacity-90 active:scale-[0.98]'
                    : 'opacity-40 cursor-not-allowed',
                )}
                style={{ background: 'var(--accent)' }}
              >
                {saving ? 'Saving…' : isLast ? 'Finish setup' : 'Continue'}
              </button>

              <button
                onClick={handleSkip}
                disabled={saving}
                className="w-full text-sm transition-colors hover:opacity-70"
                style={{ color: 'var(--muted)' }}
              >
                Skip for now
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
