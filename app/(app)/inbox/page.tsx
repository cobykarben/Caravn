import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ChatListItem } from '@/components/messaging/chat-list-item'

export default async function InboxPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: memberships } = await supabase
    .from('ride_chat_members')
    .select(`
      chat:ride_chats!chat_id(
        id,
        ride:rides!ride_id(id, departure_time, event:events!event_id(name)),
        messages(id, content, created_at, sender:profiles!sender_id(full_name))
      )
    `)
    .eq('user_id', user.id)

  type RawChat = {
    id: string
    ride: { id: string; departure_time: string; event: { name: string } } | null
    messages: Array<{
      id: string
      content: string
      created_at: string
      sender: { full_name: string } | null
    }> | null
  }

  const chats = (memberships ?? [])
    .map(m => (m as unknown as { chat: RawChat | null }).chat)
    .filter(Boolean)
    .map(chat => {
      const msgs = (chat!.messages ?? []).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      const last = msgs[0] ?? null
      return {
        id: chat!.id,
        ride: chat!.ride!,
        lastMessage: last
          ? {
              content: last.content,
              sender_name: last.sender?.full_name ?? 'Someone',
              created_at: last.created_at,
            }
          : null,
      }
    })
    .filter(c => c.ride)
    .sort((a, b) => {
      const aTime = a.lastMessage?.created_at ?? a.ride.departure_time
      const bTime = b.lastMessage?.created_at ?? b.ride.departure_time
      return new Date(bTime).getTime() - new Date(aTime).getTime()
    })

  return (
    <div className="pt-6">
      <h1 className="text-2xl font-bold px-4 mb-4">Inbox</h1>
      {chats.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-muted-foreground">No chats yet.</p>
          <p className="text-xs text-muted-foreground mt-1">
            Chats appear here once you join a ride.
          </p>
        </div>
      ) : (
        <div>
          {chats.map(chat => (
            <ChatListItem key={chat.id} chat={chat as Parameters<typeof ChatListItem>[0]['chat']} />
          ))}
        </div>
      )}
    </div>
  )
}
