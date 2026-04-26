'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Send } from 'lucide-react'

type Message = {
  id: string
  content: string
  created_at: string
  sender: { id: string; full_name: string; avatar_url: string | null }
}

type Props = {
  chatId: string
  currentUserId: string
  initialMessages: Message[]
}

export function ChatView({ chatId, currentUserId, initialMessages }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const channel = supabase
      .channel(`chat-${chatId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
        async (payload: { new: { id: string } }) => {
          const { data } = await supabase
            .from('messages')
            .select('id, content, created_at, sender:profiles!sender_id(id, full_name, avatar_url)')
            .eq('id', payload.new.id)
            .single()
          if (data) setMessages(prev => [...prev, data as Message])
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [chatId])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    const content = text.trim()
    if (!content) return
    setSending(true)
    setText('')
    await supabase.from('messages').insert({
      chat_id: chatId,
      sender_id: currentUserId,
      content,
    })
    setSending(false)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div role="log" className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map(msg => {
          const isOwn = msg.sender.id === currentUserId
          return (
            <div key={msg.id} className={cn('flex gap-2.5', isOwn ? 'flex-row-reverse' : 'flex-row')}>
              {!isOwn && (
                <Avatar className="w-7 h-7 shrink-0 mt-0.5">
                  {msg.sender.avatar_url && <AvatarImage src={msg.sender.avatar_url} />}
                  <AvatarFallback className="text-[10px] bg-muted">
                    {msg.sender.full_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              )}
              <div className={cn('max-w-[75%]', isOwn ? 'items-end' : 'items-start')}>
                {!isOwn && (
                  <p className="text-[10px] text-muted-foreground mb-1 ml-1">
                    {msg.sender.full_name}
                  </p>
                )}
                <div className={cn(
                  'px-3 py-2 rounded-2xl text-sm',
                  isOwn
                    ? 'bg-foreground text-background rounded-tr-sm'
                    : 'bg-muted text-foreground rounded-tl-sm',
                )}>
                  {msg.content}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 mx-1">
                  {new Date(msg.created_at).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={sendMessage}
        className="flex gap-2 px-4 py-3 border-t border-border bg-background"
      >
        <Input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Message…"
          className="flex-1"
          autoComplete="off"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!text.trim() || sending}
          aria-label="Send"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
