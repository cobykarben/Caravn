import { notFound } from 'next/navigation'
import Link from 'next/link'
import { CalendarDays, MapPin, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { RideCard } from '@/components/rides/ride-card'
import type { Seat } from '@/lib/seat-templates'

type EventRow = {
  id: string
  name: string
  venue_name: string
  city: string
  starts_at: string
  category: string
  description: string | null
}

type RideRow = {
  id: string
  departure_address: string
  departure_time: string
  cost_per_person: number
  is_paid: boolean
  status: string
  seat_map: Record<string, Seat>
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: rawEvent } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single()

  if (!rawEvent) notFound()
  const event = rawEvent as unknown as EventRow

  const { data: rawRides } = await supabase
    .from('rides')
    .select(`
      id, departure_address, departure_time, cost_per_person, is_paid,
      seat_map, status, notes, pickup_radius_miles,
      driver:profiles!driver_id(id, full_name, username, avatar_url, phone_verified),
      vehicle:vehicles!vehicle_id(make, model, year, color, type, capacity)
    `)
    .eq('event_id', id)
    .in('status', ['active', 'full'])
    .order('departure_time', { ascending: true })

  const rides = (rawRides ?? []) as unknown as RideRow[]

  const startDate = new Date(event.starts_at)
  const dateStr = startDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
  const timeStr = startDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="px-4 pt-6 pb-5 border-b border-border">
        <div className="flex items-start justify-between gap-3 mb-4">
          <h1 className="text-xl font-bold leading-snug flex-1">{event.name}</h1>
          <Badge variant="outline" className="capitalize shrink-0">{event.category}</Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4 shrink-0" />
            <span>{dateStr} at {timeStr}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span>{event.venue_name} · {event.city}</span>
          </div>
        </div>

        {event.description && (
          <p className="mt-4 text-sm text-muted-foreground">{event.description}</p>
        )}
      </div>

      {/* Rides section */}
      <div className="px-4 pt-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">
            Rides ({rides.length})
          </h2>
          <Link
            href={`/rides/new?event=${event.id}`}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}
          >
            <Plus className="h-3.5 w-3.5" />
            Post ride
          </Link>
        </div>

        {rides.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border rounded-xl">
            <p className="text-sm text-muted-foreground mb-3">No rides posted yet</p>
            <Link
              href={`/rides/new?event=${event.id}`}
              className={cn(buttonVariants({ size: 'sm' }))}
            >
              Post the first ride
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {rides.map(ride => (
              <RideCard key={ride.id} ride={ride} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
