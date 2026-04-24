import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { CalendarDays, MapPin } from 'lucide-react'

type EventCardProps = {
  event: {
    id: string
    name: string
    venue_name: string
    city: string
    starts_at: string
    category: string
    image_url: string | null
    ride_count: number
  }
}

export function EventCard({ event }: EventCardProps) {
  const date = new Date(event.starts_at)
  const dateStr = date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })

  return (
    <Link
      href={`/events/${event.id}`}
      className="block bg-card border border-border rounded-xl p-4 active:opacity-80 transition-opacity"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-semibold text-base leading-snug flex-1">{event.name}</h3>
        <Badge variant="outline" className="text-xs shrink-0 capitalize">
          {event.category}
        </Badge>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5 shrink-0" />
          <span>{dateStr} · {timeStr}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span>{event.venue_name} · {event.city}</span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-border">
        <span className="text-xs font-medium">
          {event.ride_count > 0 ? (
            <span className="text-green-400">{event.ride_count} ride{event.ride_count !== 1 ? 's' : ''} available</span>
          ) : (
            <span className="text-muted-foreground">No rides yet — be the first!</span>
          )}
        </span>
      </div>
    </Link>
  )
}
