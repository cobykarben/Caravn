import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { CalendarDays, MapPin } from 'lucide-react'
import type { Seat } from '@/lib/seat-templates'

type RideCardProps = {
  ride: {
    id: string
    departure_address: string
    departure_time: string
    cost_per_person: number
    is_paid: boolean
    status: string
    seat_map: Record<string, Seat>
    driver?: { full_name: string; username: string; avatar_url: string | null } | null
  }
}

export function RideCard({ ride }: RideCardProps) {
  const seats = Object.values(ride.seat_map)
  const availableSeats = seats.filter(s => !s.isDriver && s.status === 'available').length
  const isFull = ride.status === 'full'
  const timeStr = new Date(ride.departure_time).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
  const dateStr = new Date(ride.departure_time).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  return (
    <Link
      href={`/rides/${ride.id}`}
      className="block bg-card border border-border rounded-xl p-4 active:opacity-80 transition-opacity"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          {ride.driver && (
            <Avatar className="w-8 h-8 shrink-0">
              {ride.driver.avatar_url && <AvatarImage src={ride.driver.avatar_url} />}
              <AvatarFallback className="text-xs bg-muted">
                {ride.driver.full_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
          )}
          <div>
            <p className="text-sm font-semibold leading-tight">
              {ride.driver?.full_name ?? 'Driver'}
            </p>
            {ride.driver && (
              <p className="text-xs text-muted-foreground">@{ride.driver.username}</p>
            )}
          </div>
        </div>
        <Badge
          variant={isFull ? 'secondary' : 'outline'}
          className="text-xs shrink-0"
        >
          {isFull ? 'Full' : `${availableSeats} seat${availableSeats !== 1 ? 's' : ''}`}
        </Badge>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5 shrink-0" />
          <span>{dateStr} · {timeStr}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{ride.departure_address}</span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-border">
        <span className="text-xs font-medium">
          {ride.is_paid
            ? `$${ride.cost_per_person.toFixed(2)} total trip cost · split equally`
            : <span className="text-green-400">Free ride</span>}
        </span>
      </div>
    </Link>
  )
}
