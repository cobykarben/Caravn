import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RideCard } from '@/components/rides/ride-card'
import type { Seat } from '@/lib/seat-templates'

type RideRow = {
  id: string
  status: string
  departure_address: string
  departure_time: string
  cost_per_person: number
  is_paid: boolean
  seat_map: Record<string, Seat>
  driver: { full_name: string; username: string; avatar_url: string | null } | null
}

export default async function RidesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: drivingRaw } = await supabase
    .from('rides')
    .select(`
      id, status, departure_address, departure_time, cost_per_person, is_paid, seat_map,
      driver:profiles!driver_id(full_name, username, avatar_url)
    `)
    .eq('driver_id', user.id)
    .in('status', ['active', 'full', 'draft'])
    .order('departure_time', { ascending: true })

  const { data: ridingApplications } = await supabase
    .from('ride_applications')
    .select(`
      ride:rides!ride_id(
        id, status, departure_address, departure_time, cost_per_person, is_paid, seat_map,
        driver:profiles!driver_id(full_name, username, avatar_url)
      )
    `)
    .eq('rider_id', user.id)
    .eq('status', 'accepted')

  const drivingRides = (drivingRaw ?? []) as unknown as RideRow[]
  const ridingRides = (ridingApplications ?? [])
    .map(a => (a as unknown as { ride: RideRow | null }).ride)
    .filter(Boolean) as RideRow[]

  const isEmpty = drivingRides.length === 0 && ridingRides.length === 0

  return (
    <div className="px-4 pt-6 pb-8">
      <h1 className="text-2xl font-bold mb-6">My Rides</h1>

      {isEmpty ? (
        <div className="text-center py-16 border border-dashed border-border rounded-xl">
          <p className="text-sm text-muted-foreground mb-2">No upcoming rides</p>
          <p className="text-xs text-muted-foreground">Use the + button to find or post a ride.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {drivingRides.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                Driving
              </h2>
              <div className="space-y-3">
                {drivingRides.map(ride => (
                  <RideCard key={ride.id} ride={ride} role="driver" />
                ))}
              </div>
            </section>
          )}

          {ridingRides.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                Riding
              </h2>
              <div className="space-y-3">
                {ridingRides.map(ride => (
                  <RideCard key={ride.id} ride={ride} role="rider" />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
