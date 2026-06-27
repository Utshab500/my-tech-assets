'use client'

import { useRef, type KeyboardEvent, type ChangeEvent } from 'react'
import { ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InputBarProps {
  value: string
  onChange: (value: string) => void
  onSend: (text: string) => void
  disabled?: boolean
}

export function InputBar({ value, onChange, onSend, disabled = false }: InputBarProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function handleChange(e: ChangeEvent<HTMLTextAreaElement>) {
    onChange(e.target.value)
    // Auto-resize
    const el = e.target
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleSend() {
    const text = value.trim()
    if (!text || disabled) return
    onSend(text)
    onChange('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const canSend = value.trim().length > 0 && !disabled

  return (
    <div
      className="flex items-end gap-2 rounded-2xl border px-4 py-3 shadow-sm transition-shadow focus-within:shadow-md"
      style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Message your coach…"
        rows={1}
        disabled={disabled}
        aria-label="Message input"
        className={cn(
          'flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-[var(--muted)]',
          'leading-6 max-h-[200px] min-h-[24px]',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
        style={{ color: 'var(--ink)' }}
      />

      <button
        onClick={handleSend}
        disabled={!canSend}
        aria-label="Send message"
        className={cn(
          'flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full transition-all',
          canSend
            ? 'text-white hover:opacity-90 active:scale-95'
            : 'text-[var(--muted)] bg-transparent',
        )}
        style={canSend ? { background: 'var(--accent)' } : {}}
      >
        {disabled ? (
          <span className="block w-4 h-4 rounded-full border-2 border-[var(--muted)] border-t-transparent animate-spin" />
        ) : (
          <ArrowUp size={16} strokeWidth={2.5} />
        )}
      </button>
    </div>
  )
}
