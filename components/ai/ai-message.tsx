'use client'

import { cn } from '@/lib/utils'

export type UIMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
  isStreaming?: boolean
}

type Props = {
  message: UIMessage
  // Called by rich card action buttons (AI-4). onSend("yes") auto-submits a user message.
  onSend?: (text: string) => void
}

export function AIMessage({ message }: Props) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
          isUser
            ? 'bg-foreground text-background rounded-br-sm'
            : 'bg-muted text-foreground rounded-bl-sm',
        )}
      >
        <span className="whitespace-pre-wrap break-words">{message.text}</span>
        {message.isStreaming && (
          <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-current rounded-sm animate-pulse align-middle" />
        )}
      </div>
    </div>
  )
}
