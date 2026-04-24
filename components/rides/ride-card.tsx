import Link from 'next/link'
import { Car } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

type RideCardProps = {
  ride: {
    id: string
    departure_address: string
    departure_time: string
    cost_per_person: number
    is_paid: boolean
    status: string
    seat_map: Record<string, { status: string; isDriver: boolean }>
  }
}

export function RideCard({ ride }: RideCardProps) {
  const availableSeats = Object.values(ride.seat_map).filter(
    s => !s.isDriver && s.status === 'available'
  ).length

  const timeStr = new Date(ride.departure_time).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })

  return (
    <Link
      href={`/rides/${ride.id}`}
      className="block bg-card border border-border rounded-xl p-4 active:opacity-80 transition-opacity"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <Car className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium">Departs {timeStr}</span>
        </div>
        <Badge variant={ride.status === 'full' ? 'secondary' : 'outline'} className="text-xs">
          {ride.status === 'full' ? 'Full' : `${availableSeats} seat${availableSeats !== 1 ? 's' : ''}`}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground ml-6">{ride.departure_address}</p>
      <p className="text-xs font-medium mt-2 ml-6">
        {ride.is_paid ? `$${ride.cost_per_person} / person` : 'Free ride'}
      </p>
    </Link>
  )
}
