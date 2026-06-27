'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'

export function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <button
      onClick={handleCopy}
      aria-label={copied ? 'Copied' : 'Copy message'}
      className={cn(
        'flex items-center gap-1 rounded px-1.5 py-1 text-xs transition-colors',
        'text-[var(--muted)] hover:text-[var(--ink)] hover:bg-black/5',
        className,
      )}
    >
      {copied ? <Check size={13} strokeWidth={2.5} /> : <Copy size={13} strokeWidth={2} />}
      <span>{copied ? 'Copied' : 'Copy'}</span>
    </button>
  )
}
