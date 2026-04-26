import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ChatView } from '@/components/messaging/chat-view'

type Message = {
  id: string
  content: string
  created_at: string
  sender: { id: string; full_name: string; avatar_url: string | null }
}

export default async function ChatPage({
  params,
}: {
  params: Promise<{ chatId: string }>
}) {
  const { chatId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('ride_chat_members')
    .select('chat_id')
    .eq('chat_id', chatId)
    .eq('user_id', user.id)
    .single()

  if (!membership) notFound()

  const { data: chat } = await supabase
    .from('ride_chats')
    .select('id, ride:rides!ride_id(id, departure_time, event:events!event_id(name))')
    .eq('id', chatId)
    .single()

  if (!chat) notFound()

  const { data: rawMessages } = await supabase
    .from('messages')
    .select('id, content, created_at, sender:profiles!sender_id(id, full_name, avatar_url)')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: false })
    .limit(50)

  const messages = ((rawMessages ?? []) as unknown as Message[]).reverse()

  const ride = (chat as unknown as { ride: { id: string; departure_time: string; event: { name: string } } | null }).ride
  const eventName = ride?.event?.name ?? 'Ride Chat'
  const departureStr = ride?.departure_time
    ? new Date(ride.departure_time).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : ''

  return (
    <div className="flex flex-col h-screen">
      <div className="flex items-center gap-3 px-4 pt-5 pb-3 border-b border-border shrink-0">
        <Link href="/inbox" className="text-muted-foreground">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{eventName}</p>
          {departureStr && (
            <p className="text-xs text-muted-foreground">{departureStr}</p>
          )}
        </div>
      </div>

      <ChatView chatId={chatId} currentUserId={user.id} initialMessages={messages} />
    </div>
  )
}
