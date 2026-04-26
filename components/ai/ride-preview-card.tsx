'use client'

import { CalendarDays, MapPin, Car, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type RidePreviewData = {
  event_name: string
  vehicle: string
  departure_address: string
  departure_time: string
  cost_per_person: number
  available_seats: number
  return_time?: string
  notes?: string
}

type Props = {
  data: RidePreviewData
  onSend: (text: string) => void
}

export function RidePreviewCard({ data, onSend }: Props) {
  const dateStr = new Date(data.departure_time).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  })
  const timeStr = new Date(data.departure_time).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit',
  })

  return (
    <div className="mt-2 rounded-xl border border-border bg-background overflow-hidden">
      <div className="px-3 pt-3 pb-2 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Ride preview
        </p>
        <p className="text-sm font-semibold leading-tight">{data.event_name}</p>

        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Car className="h-3.5 w-3.5 shrink-0" />
            <span>{data.vehicle}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
            <span>{dateStr} · {timeStr}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{data.departure_address}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5 shrink-0" />
            <span>
              {data.available_seats} passenger seat{data.available_seats !== 1 ? 's' : ''} ·{' '}
              {data.cost_per_person === 0
                ? 'Free ride'
                : `$${data.cost_per_person.toFixed(2)} total cost`
              }
            </span>
          </div>
        </div>

        {data.notes && (
          <p className="text-xs text-muted-foreground italic border-t border-border pt-2">
            {data.notes}
          </p>
        )}
      </div>

      <div className="flex border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 rounded-none rounded-bl-xl text-xs h-9 font-medium"
          onClick={() => onSend('confirm, post the ride')}
        >
          Post it
        </Button>
        <div className="w-px bg-border" />
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 rounded-none rounded-br-xl text-xs h-9 text-muted-foreground"
          onClick={() => onSend('edit the ride details')}
        >
          Edit
        </Button>
      </div>
    </div>
  )
}
