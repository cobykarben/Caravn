import { Suspense } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { EventCard } from '@/components/events/event-card'
import { EventSearch } from '@/components/events/event-search'

type SearchParams = {
  q?: string
  city?: string
  category?: string
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const { q, city, category } = await searchParams
  const supabase = await createClient()

  // Show events that haven't ended yet. For events without an end time,
  // keep them visible until 6 hours after they start (covers same-day rides).
  const cutoff = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()

  let query = supabase
    .from('events')
    .select('id, name, venue_name, city, starts_at, ends_at, category, image_url, rides(id)')
    .or(`ends_at.gte.${new Date().toISOString()},and(ends_at.is.null,starts_at.gte.${cutoff})`)
    .order('starts_at', { ascending: true })
    .limit(50)

  if (city) query = query.ilike('city', `%${city}%`)
  if (category) query = query.eq('category', category)
  if (q) {
    query = query.or(`name.ilike.%${q}%,venue_name.ilike.%${q}%,city.ilike.%${q}%`)
  }

  const { data: rawEventsData } = await query
  const rawEvents = rawEventsData as Array<Record<string, unknown>> | null

  const events = (rawEvents ?? []).map(e => {
    const rides = e['rides']
    return {
      id: e.id as string,
      name: e.name as string,
      venue_name: e.venue_name as string,
      city: e.city as string,
      starts_at: e.starts_at as string,
      ends_at: e.ends_at as string | null,
      category: e.category as string,
      image_url: e.image_url as string | null,
      ride_count: Array.isArray(rides) ? rides.length : 0,
    }
  })

  return (
    <div className="px-4 pt-6 pb-4">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold">Events</h1>
        <Link
          href="/events/new"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add event
        </Link>
      </div>

      <Suspense fallback={null}>
        <div className="mb-4">
          <EventSearch />
        </div>
      </Suspense>

      {events.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-sm">
            {q || city || category ? 'No events match your search.' : 'No upcoming events yet.'}
          </p>
          <Link href="/events/new" className="text-sm underline underline-offset-4 mt-2 inline-block">
            Create the first one
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map(event => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  )
}
