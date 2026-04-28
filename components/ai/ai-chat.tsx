'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Sparkles, X, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AIMessage, type UIMessage } from '@/components/ai/ai-message'
import { cn } from '@/lib/utils'

type APIMessage = { role: 'user' | 'assistant'; content: string }

const GREETING = "Hey, where are you headed? I can find or create a ride for any event."
const DEFAULT_SUGGESTIONS = ['Find me a ride tonight', 'Post a ride to a game', 'What events are near me?']

export function AIChat({ userId, suggestions = DEFAULT_SUGGESTIONS }: { userId: string; suggestions?: string[] }) {
  const [uiMessages, setUiMessages] = useState<UIMessage[]>([])
  const [apiMessages, setApiMessages] = useState<APIMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [uiMessages])

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`
  }, [input])

  const send = useCallback(async (text: string) => {
    if (!text.trim() || loading) return

    const userText = text.trim()
    setInput('')

    const nextApiMessages: APIMessage[] = [
      ...apiMessages,
      { role: 'user', content: userText },
    ]

    const userUiMsgId = crypto.randomUUID()
    const aiUiMsgId = crypto.randomUUID()

    setUiMessages(prev => [
      ...prev,
      { id: userUiMsgId, role: 'user', text: userText },
      { id: aiUiMsgId, role: 'assistant', text: '', isStreaming: true },
    ])
    setLoading(true)

    let aiText = ''

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextApiMessages, userId }),
      })

      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (!raw) continue

          let event: { type: string; text?: string; message?: string }
          try { event = JSON.parse(raw) } catch { continue }

          if (event.type === 'text' && event.text) {
            aiText += event.text
            setUiMessages(prev =>
              prev.map(m => m.id === aiUiMsgId ? { ...m, text: aiText } : m)
            )
          } else if (event.type === 'error') {
            aiText = event.message ?? 'Something went wrong. Please try again.'
          }
        }
      }
    } catch {
      aiText = 'Connection error. Please try again.'
    } finally {
      setUiMessages(prev =>
        prev.map(m =>
          m.id === aiUiMsgId ? { ...m, text: aiText || '…', isStreaming: false } : m
        )
      )
      setApiMessages([...nextApiMessages, { role: 'assistant', content: aiText }])
      setLoading(false)
      textareaRef.current?.focus()
    }
  }, [apiMessages, loading, userId])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    send(input)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  function clearChat() {
    setUiMessages([])
    setApiMessages([])
    setInput('')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          <span className="text-sm font-semibold">Caravn AI</span>
        </div>
        <button
          onClick={clearChat}
          aria-label="Clear chat"
          className={cn(
            'text-muted-foreground hover:text-foreground transition-colors',
            uiMessages.length === 0 && 'invisible',
          )}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {uiMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold mb-1.5">Caravn AI</p>
              <p className="text-sm text-muted-foreground max-w-[260px] leading-relaxed">
                {GREETING}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {suggestions.map(s => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {uiMessages.map(msg => (
              <AIMessage key={msg.id} message={msg} onSend={send} />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input bar */}
      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-2 px-4 py-3 border-t border-border bg-background shrink-0"
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Where are you headed?"
          rows={1}
          disabled={loading}
          className="flex-1 resize-none bg-muted rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-border min-h-[40px] max-h-[120px] overflow-y-auto disabled:opacity-50"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!input.trim() || loading}
          aria-label="Send"
          className="shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
