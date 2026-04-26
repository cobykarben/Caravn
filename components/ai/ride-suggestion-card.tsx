'use client'

import Link from 'next/link'
import { MapPin, Clock, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type RideSuggestionData = {
  id: string
  driver_name: string
  departure_address: string
  departure_time: string
  cost_per_person: number
  is_paid: boolean
  available_seats: number
  available_seat_ids: string[]
  distance_miles?: number | null
}

type Props = {
  data: RideSuggestionData
  onSend: (text: string) => void
}

export function RideSuggestionCard({ data, onSend }: Props) {
  const timeStr = new Date(data.departure_time).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit',
  })

  function handleApply() {
    const seatId = data.available_seat_ids[0] ?? ''
    onSend(`apply to ride ${data.id}${seatId ? ` seat ${seatId}` : ''}`)
  }

  return (
    <div className="mt-2 rounded-xl border border-border bg-background overflow-hidden">
      <div className="p-3 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold">{data.driver_name}</p>
          <span className="text-xs font-medium shrink-0">
            {data.is_paid
              ? `$${data.cost_per_person.toFixed(2)} total`
              : <span className="text-green-400">Free</span>
            }
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5 shrink-0" />
          <span>{timeStr}</span>
          {data.distance_miles != null && (
            <span className="text-muted-foreground">· {data.distance_miles.toFixed(1)} mi away</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{data.departure_address}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="h-3.5 w-3.5 shrink-0" />
          <span>{data.available_seats} seat{data.available_seats !== 1 ? 's' : ''} open</span>
        </div>
      </div>
      <div className="flex border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 rounded-none rounded-bl-xl text-xs h-9 font-medium"
          disabled={data.available_seats === 0}
          onClick={handleApply}
        >
          Apply
        </Button>
        <div className="w-px bg-border" />
        <Link
          href={`/rides/${data.id}`}
          className="flex-1 flex items-center justify-center text-xs h-9 text-muted-foreground hover:text-foreground transition-colors rounded-br-xl"
        >
          Details →
        </Link>
      </div>
    </div>
  )
}
