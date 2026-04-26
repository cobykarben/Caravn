import { createAdminClient } from '@/lib/supabase/admin'
import { haversineDistance } from '@/lib/haversine'
import { seatMapToRecord } from '@/lib/seat-templates'
import type { Seat } from '@/lib/seat-templates'

// Simple lookup for common location names → lat/lng (NYC-centric for MVP)
const LOCATION_LOOKUP: Record<string, { lat: number; lng: number }> = {
  'upper west side': { lat: 40.786, lng: -73.975 },
  'upper east side': { lat: 40.776, lng: -73.957 },
  'midtown':         { lat: 40.754, lng: -73.984 },
  'downtown':        { lat: 40.712, lng: -74.006 },
  'brooklyn':        { lat: 40.678, lng: -73.944 },
  'bronx':           { lat: 40.837, lng: -73.866 },
  'queens':          { lat: 40.728, lng: -73.794 },
  'harlem':          { lat: 40.811, lng: -73.946 },
  'east village':    { lat: 40.726, lng: -73.982 },
  'west village':    { lat: 40.735, lng: -74.005 },
  'hoboken':         { lat: 40.744, lng: -74.032 },
  'jersey city':     { lat: 40.718, lng: -74.043 },
}

export function resolveLocation(text: string): { lat: number; lng: number } | null {
  const lower = text.toLowerCase()
  for (const [name, coords] of Object.entries(LOCATION_LOOKUP)) {
    if (lower.includes(name)) return coords
  }
  return null
}

// ---

export async function searchEvents(input: { query: string; date?: string }) {
  const supabase = createAdminClient()
  const now = new Date().toISOString()

  // Text search on name / venue / city
  const { data: textResults } = await supabase
    .from('events')
    .select('id, name, venue_name, city, starts_at, category')
    .or(
      `name.ilike.%${input.query}%,venue_name.ilike.%${input.query}%,city.ilike.%${input.query}%`
    )
    .gte('starts_at', now)
    .order('starts_at', { ascending: true })
    .limit(5)

  // Also call the fuzzy RPC (best-effort — ignore errors)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: fuzzyResults } = await (supabase as any).rpc('find_similar_events', {
    p_name: input.query,
    p_venue: '',
    p_starts_at: input.date ? `${input.date}T00:00:00Z` : now,
  })

  // Merge and de-duplicate by id
  const seen = new Set<string>()
  const merged: Array<{
    id: string
    name: string
    venue_name: string
    city: string
    starts_at: string
    category: string
  }> = []

  for (const e of [...(textResults ?? []), ...(fuzzyResults ?? [])]) {
    if (!seen.has(e.id)) {
      seen.add(e.id)
      merged.push(e as { id: string; name: string; venue_name: string; city: string; starts_at: string; category: string })
    }
  }

  return { events: merged.slice(0, 5) }
}

export async function getUserProfile(input: { user_id: string }) {
  const supabase = createAdminClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, bio, phone_verified')
    .eq('id', input.user_id)
    .single()

  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('id, make, model, year, color, type, capacity, seat_template, is_default')
    .eq('owner_id', input.user_id)
    .order('is_default', { ascending: false })

  const defaultVehicle = (vehicles ?? []).find(v => v.is_default) ?? vehicles?.[0] ?? null

  return {
    full_name: profile?.full_name ?? null,
    default_vehicle: defaultVehicle
      ? {
          id: defaultVehicle.id,
          make: defaultVehicle.make,
          model: defaultVehicle.model,
          year: defaultVehicle.year,
          color: defaultVehicle.color,
          type: defaultVehicle.type,
          capacity: defaultVehicle.capacity,
          passenger_seats: (defaultVehicle.capacity as number) - 1,
        }
      : null,
    all_vehicles: (vehicles ?? []).map(v => ({
      id: v.id,
      make: v.make,
      model: v.model,
      year: v.year,
      color: v.color,
      capacity: v.capacity,
      is_default: v.is_default,
    })),
  }
}

export async function findRides(input: {
  event_id: string
  lat?: number
  lng?: number
}) {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rides } = await (supabase as any)
    .from('rides')
    .select(
      `id, departure_address, departure_time, cost_per_person, is_paid, status, seat_map,
       driver:profiles!driver_id(full_name, username, avatar_url)`
    )
    .eq('event_id', input.event_id)
    .in('status', ['active', 'full'])
    .order('departure_time', { ascending: true })

  if (!rides || rides.length === 0) {
    return { rides: [], count: 0 }
  }

  type RideRow = {
    id: string
    departure_address: string
    departure_time: string
    cost_per_person: number
    is_paid: boolean
    status: string
    seat_map: Record<string, Seat>
    driver: { full_name: string; username: string; avatar_url: string | null } | null
    available_seats: number
    distance_miles?: number
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const enriched: RideRow[] = (rides as any[]).map(r => {
    const seats = Object.values(r.seat_map as Record<string, Seat>)
    const available = seats.filter(s => !s.isDriver && s.status === 'available').length
    const result: RideRow = {
      ...(r as unknown as RideRow),
      available_seats: available,
    }
    if (input.lat !== undefined && input.lng !== undefined) {
      // crude geocode: extract lat/lng from departure_address if embedded,
      // or skip — the AI will show address and let user decide
      // For now we sort by departure_time (already sorted above)
    }
    return result
  })

  // If location provided, try to sort by proximity to known location names in the address
  // (full geocoding deferred to Phase 2)
  const results = enriched.slice(0, 10).map(r => {
    const seatArr = Object.values(r.seat_map as Record<string, Seat>)
    const availableSeatIds = seatArr
      .filter(s => !s.isDriver && s.status === 'available')
      .map(s => s.id)
    return {
      id: r.id,
      driver_name: r.driver?.full_name ?? 'Driver',
      departure_address: r.departure_address,
      departure_time: r.departure_time,
      cost_per_person: r.cost_per_person,
      is_paid: r.is_paid,
      status: r.status,
      available_seats: r.available_seats,
      available_seat_ids: availableSeatIds,
      distance_miles: r.distance_miles ?? null,
    }
  })

  return { rides: results, count: results.length }
}

export async function createRide(input: {
  driver_id: string
  event_id: string
  vehicle_id: string
  departure_address: string
  departure_time: string
  return_time?: string
  cost_per_person: number
  notes?: string
  pickup_radius_miles?: number
}) {
  const supabase = createAdminClient()

  // Fetch the vehicle to get its seat_template
  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('seat_template, capacity')
    .eq('id', input.vehicle_id)
    .single()

  if (!vehicle) {
    return { error: 'Vehicle not found' }
  }

  const seatMap = seatMapToRecord(vehicle.seat_template as Seat[])

  const { data: ride, error } = await supabase
    .from('rides')
    .insert({
      driver_id: input.driver_id,
      event_id: input.event_id,
      vehicle_id: input.vehicle_id,
      status: 'active',
      departure_address: input.departure_address,
      departure_time: input.departure_time,
      return_time: input.return_time ?? null,
      cost_per_person: input.cost_per_person,
      notes: input.notes ?? null,
      seat_map: seatMap,
      pickup_radius_miles: input.pickup_radius_miles ?? null,
    })
    .select('id')
    .single()

  if (error || !ride) {
    return { error: error?.message ?? 'Failed to create ride' }
  }

  return {
    success: true,
    ride_id: ride.id,
    url: `/rides/${ride.id}`,
  }
}

export async function applyToRide(input: {
  ride_id: string
  rider_id: string
  seat_ids: string[]
  message?: string
}) {
  const supabase = createAdminClient()

  const { error } = await supabase.from('ride_applications').insert({
    ride_id: input.ride_id,
    rider_id: input.rider_id,
    status: 'pending',
    seat_ids: input.seat_ids,
    message: input.message ?? null,
    custom_pickup_address: null,
    cost_share: 0,
  })

  if (error) {
    return { error: error.message }
  }

  return {
    success: true,
    message: 'Application submitted. The driver will review your request.',
  }
}

// Dispatcher — called by the API route
export async function executeToolCall(
  name: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  input: Record<string, any>,
  _userId: string,
): Promise<unknown> {
  switch (name) {
    case 'search_events':
      return searchEvents(input as { query: string; date?: string })
    case 'get_user_profile':
      return getUserProfile(input as { user_id: string })
    case 'find_rides':
      return findRides(input as { event_id: string; lat?: number; lng?: number })
    case 'create_ride':
      return createRide(input as Parameters<typeof createRide>[0])
    case 'apply_to_ride':
      return applyToRide(input as Parameters<typeof applyToRide>[0])
    default:
      return { error: `Unknown tool: ${name}` }
  }
}
