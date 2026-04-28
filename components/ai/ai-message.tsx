'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { EventResultCard, type EventResultData } from './event-result-card'
import { RideSuggestionCard, type RideSuggestionData } from './ride-suggestion-card'
import { RidePreviewCard, type RidePreviewData } from './ride-preview-card'

export type UIMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
  isStreaming?: boolean
}

type ActionBlock =
  | { type: 'event_result'; data: EventResultData }
  | { type: 'ride_suggestion'; data: RideSuggestionData }
  | { type: 'ride_preview'; data: RidePreviewData }

// Matches <action type="...">...</action> with JSON body
const ACTION_REGEX = /<action type="([^"]+)">([\s\S]*?)<\/action>/g

// Inline markdown: **bold**, *italic*, [text](url)
const INLINE_TOKENS = /(\*\*([^*\n]+)\*\*)|(\*([^*\n]+)\*)|(\[([^\]\n]+)\]\(([^)\n]+)\))/g

function renderInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  let last = 0
  INLINE_TOKENS.lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = INLINE_TOKENS.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index))
    const key = match.index
    if (match[1] !== undefined) {
      nodes.push(<strong key={key} className="font-semibold">{match[2]}</strong>)
    } else if (match[3] !== undefined) {
      nodes.push(<em key={key} className="italic">{match[4]}</em>)
    } else if (match[5] !== undefined) {
      const href = match[7]!
      const label = match[6]!
      nodes.push(
        href.startsWith('/')
          ? <Link key={key} href={href} className="underline underline-offset-2 font-medium">{label}</Link>
          : <a key={key} href={href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 font-medium">{label}</a>
      )
    }
    last = match.index + match[0].length
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n')
  return lines.map((line, i) => (
    <span key={i}>
      {renderInline(line)}
      {i < lines.length - 1 && <br />}
    </span>
  ))
}

function parseActions(text: string): ActionBlock[] {
  const blocks: ActionBlock[] = []
  for (const match of text.matchAll(ACTION_REGEX)) {
    const type = match[1]
    const json = match[2]
    if (!type || !json) continue
    try {
      const data = JSON.parse(json.trim())
      if (type === 'event_result') blocks.push({ type, data: data as EventResultData })
      else if (type === 'ride_suggestion') blocks.push({ type, data: data as RideSuggestionData })
      else if (type === 'ride_preview') blocks.push({ type, data: data as RidePreviewData })
    } catch {
      // malformed JSON — skip this block
    }
  }
  return blocks
}

function stripActions(text: string): string {
  return text
    .replace(ACTION_REGEX, '')          // remove complete action blocks
    .replace(/<action[\s\S]*$/, '')     // remove any incomplete action block still streaming
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

type Props = {
  message: UIMessage
  onSend?: (text: string) => void
}

export function AIMessage({ message, onSend }: Props) {
  const isUser = message.role === 'user'
  const cleanText = stripActions(message.text)
  const actions = isUser || message.isStreaming ? [] : parseActions(message.text)

  return (
    <div className={cn('flex flex-col', isUser ? 'items-end' : 'items-start')}>
      {/* Text bubble — only render if there's visible text */}
      {cleanText.length > 0 && (
        <div
          className={cn(
            'max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
            isUser
              ? 'bg-foreground text-background rounded-br-sm'
              : 'bg-muted text-foreground rounded-bl-sm',
          )}
        >
          <span className="break-words">{renderMarkdown(cleanText)}</span>
          {message.isStreaming && (
            <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-current rounded-sm animate-pulse align-middle" />
          )}
        </div>
      )}

      {/* Streaming cursor with no text yet */}
      {message.isStreaming && cleanText.length === 0 && (
        <div className="max-w-[85%] px-4 py-2.5 rounded-2xl bg-muted">
          <span className="inline-block w-1.5 h-3.5 bg-muted-foreground rounded-sm animate-pulse" />
        </div>
      )}

      {/* Rich cards — rendered below text, full width */}
      {actions.length > 0 && onSend && (
        <div className="w-full max-w-[340px] space-y-0">
          {actions.map((action, i) => {
            if (action.type === 'event_result') {
              return <EventResultCard key={i} data={action.data} onSend={onSend} />
            }
            if (action.type === 'ride_suggestion') {
              return <RideSuggestionCard key={i} data={action.data} onSend={onSend} />
            }
            if (action.type === 'ride_preview') {
              return <RidePreviewCard key={i} data={action.data} onSend={onSend} />
            }
          })}
        </div>
      )}
    </div>
  )
}
