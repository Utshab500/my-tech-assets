'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'
import { CopyButton } from './copy-button'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
}

export function MessageItem({ message }: { message: ChatMessage }) {
  const isCoach = message.role === 'assistant'

  return (
    <div className="animate-fade-in group py-1">
      {isCoach ? (
        <CoachMessage message={message} />
      ) : (
        <UserMessage message={message} />
      )}
    </div>
  )
}

function CoachMessage({ message }: { message: ChatMessage }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span
        className="text-xs font-medium tracking-wide uppercase"
        style={{ color: 'var(--accent)', fontFamily: 'var(--font-display)' }}
      >
        Coach
      </span>

      <div
        className="rounded-2xl rounded-tl-sm px-4 py-3 text-sm shadow-sm"
        style={{ background: 'var(--surface)', color: 'var(--ink)' }}
      >
        {message.content ? (
          <>
            <div className="markdown">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeSanitize]}
              >
                {message.content}
              </ReactMarkdown>
            </div>
            {message.isStreaming && <span className="streaming-cursor" />}
          </>
        ) : (
          message.isStreaming && (
            <span className="flex gap-1 items-center py-0.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="block w-1.5 h-1.5 rounded-full"
                  style={{
                    background: 'var(--muted)',
                    animation: `blink 1.2s ${i * 0.2}s ease-in-out infinite`,
                  }}
                />
              ))}
            </span>
          )
        )}
      </div>

      {!message.isStreaming && message.content && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <CopyButton text={message.content} />
        </div>
      )}
    </div>
  )
}

function UserMessage({ message }: { message: ChatMessage }) {
  return (
    <div className="flex flex-col items-end gap-1.5">
      <span
        className="text-xs font-medium"
        style={{ color: 'var(--muted)' }}
      >
        You
      </span>
      <div
        className="max-w-[80%] rounded-2xl rounded-tr-sm px-4 py-3 text-sm"
        style={{
          background: 'oklch(0.93 0 0)',
          color: 'var(--ink)',
        }}
      >
        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
      </div>
    </div>
  )
}
