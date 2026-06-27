'use client'

import { useEffect, useRef } from 'react'
import { MessageItem, type ChatMessage } from './message-item'

interface MessageListProps {
  messages: ChatMessage[]
}

export function MessageList({ messages }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isNearBottomRef = useRef(true)

  function handleScroll() {
    const el = containerRef.current
    if (!el) return
    isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
  }

  // Scroll to bottom when new messages arrive or content grows (streaming)
  useEffect(() => {
    if (isNearBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'instant' })
    }
  })

  // Always scroll to bottom when a brand-new message is added
  const prevLength = useRef(0)
  useEffect(() => {
    if (messages.length > prevLength.current) {
      isNearBottomRef.current = true
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
    prevLength.current = messages.length
  }, [messages.length])

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto"
    >
      <div className="mx-auto max-w-[720px] px-4 py-8 flex flex-col gap-6">
        {messages.map((msg) => (
          <MessageItem key={msg.id} message={msg} />
        ))}
        {/* Sentinel for scroll anchor */}
        <div ref={bottomRef} className="h-px" />
      </div>
    </div>
  )
}
