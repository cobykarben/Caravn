import Link from 'next/link'
import { MessageCircle } from 'lucide-react'

type Props = {
  chat: {
    id: string
    ride: { id: string; departure_time: string; event: { name: string } }
    lastMessage: { content: string; sender_name: string; created_at: string } | null
  }
}

export function ChatListItem({ chat }: Props) {
  const dateStr = new Date(chat.ride.departure_time).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  return (
    <Link
      href={`/inbox/${chat.id}`}
      className="flex items-start gap-3 p-4 border-b border-border hover:bg-muted/50 transition-colors"
    >
      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
        <MessageCircle className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2 mb-0.5">
          <p className="text-sm font-semibold truncate">{chat.ride.event.name}</p>
          <p className="text-xs text-muted-foreground shrink-0">{dateStr}</p>
        </div>
        {chat.lastMessage ? (
          <p className="text-xs text-muted-foreground truncate">
            <span className="font-medium text-foreground/70">{chat.lastMessage.sender_name}:</span>{' '}
            {chat.lastMessage.content}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground italic">No messages yet</p>
        )}
      </div>
    </Link>
  )
}
