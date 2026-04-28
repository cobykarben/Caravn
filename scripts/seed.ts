/**
 * Seed script — populates Caravn with 8 test users, 10 NYC events,
 * 50 rides, and 30 ride applications for QA.
 *
 * Run from the project root:
 *   npx tsx scripts/seed.ts
 *
 * Test accounts (password: Test1234!):
 *   driver1–3@caravn.test  (can post rides, log in as driver)
 *   rider1–5@caravn.test   (can apply to rides)
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'
import { generateSeatTemplate, seatMapToRecord } from '../lib/seat-templates'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// ─── Static data ──────────────────────────────────────────────────────────────

const USERS = [
  { email: 'driver1@caravn.test', password: 'Test1234!', full_name: 'Alex Rivera',    username: 'alex_rivera',    vehicle: { make: 'Toyota',   model: 'Camry',    year: 2022, color: 'Silver', type: 'sedan'   as const, capacity: 5 } },
  { email: 'driver2@caravn.test', password: 'Test1234!', full_name: 'Jordan Park',    username: 'jordan_park',    vehicle: { make: 'Honda',    model: 'Pilot',    year: 2021, color: 'Black',  type: 'suv'     as const, capacity: 7 } },
  { email: 'driver3@caravn.test', password: 'Test1234!', full_name: 'Morgan Chen',    username: 'morgan_chen',    vehicle: { make: 'Chrysler', model: 'Pacifica', year: 2023, color: 'White',  type: 'minivan' as const, capacity: 8 } },
  { email: 'rider1@caravn.test',  password: 'Test1234!', full_name: 'Sam Taylor',     username: 'sam_taylor',     vehicle: null },
  { email: 'rider2@caravn.test',  password: 'Test1234!', full_name: 'Casey Williams', username: 'casey_williams', vehicle: null },
  { email: 'rider3@caravn.test',  password: 'Test1234!', full_name: 'Dana Lee',       username: 'dana_lee',       vehicle: null },
  { email: 'rider4@caravn.test',  password: 'Test1234!', full_name: 'Riley Johnson',  username: 'riley_johnson',  vehicle: null },
  { email: 'rider5@caravn.test',  password: 'Test1234!', full_name: 'Quinn Martinez', username: 'quinn_martinez', vehicle: null },
] as const

const EVENTS = [
  { name: 'Taylor Swift — The Eras Tour',          venue_name: 'Madison Square Garden',        venue_address: '4 Penn Plaza, New York, NY 10001',                  city: 'New York',        lat: 40.7505, lng: -73.9934, category: 'concert'  as const, starts_at: '2026-05-15T20:00:00Z', ends_at: '2026-05-15T23:30:00Z', description: 'The record-breaking Eras Tour returns to NYC.'        },
  { name: 'Yankees vs. Red Sox',                   venue_name: 'Yankee Stadium',                venue_address: '1 E 161st St, Bronx, NY 10451',                    city: 'New York',        lat: 40.8296, lng: -73.9262, category: 'sports'   as const, starts_at: '2026-05-22T23:05:00Z', ends_at: '2026-05-23T02:00:00Z', description: 'Classic Bronx Bombers vs. Boston rivalry night game.'  },
  { name: 'Knicks vs. Celtics — Playoffs',         venue_name: 'Madison Square Garden',        venue_address: '4 Penn Plaza, New York, NY 10001',                  city: 'New York',        lat: 40.7505, lng: -73.9934, category: 'sports'   as const, starts_at: '2026-06-05T23:30:00Z', ends_at: '2026-06-06T02:00:00Z', description: 'Eastern Conference showdown at the Garden.'            },
  { name: "Governor's Ball Music Festival",        venue_name: 'Flushing Meadows Corona Park', venue_address: 'Flushing Meadows Corona Park, Queens, NY 11368',    city: 'Queens',          lat: 40.7282, lng: -73.8440, category: 'festival' as const, starts_at: '2026-06-06T16:00:00Z', ends_at: '2026-06-07T00:00:00Z', description: 'Three-day outdoor festival: hip-hop, indie, and EDM.'  },
  { name: 'Coldplay — Music of the Spheres Tour',  venue_name: 'MetLife Stadium',              venue_address: '1 MetLife Stadium Dr, East Rutherford, NJ 07073',  city: 'East Rutherford', lat: 40.8135, lng: -74.0745, category: 'concert'  as const, starts_at: '2026-06-20T23:30:00Z', ends_at: '2026-06-21T02:30:00Z', description: "Coldplay's stunning global tour with full light show."  },
  { name: 'NYC Pride March',                       venue_name: '5th Ave & 25th St',            venue_address: '5th Ave & 25th St, New York, NY 10010',            city: 'New York',        lat: 40.7428, lng: -73.9876, category: 'other'    as const, starts_at: '2026-06-28T15:00:00Z', ends_at: '2026-06-28T21:00:00Z', description: 'Annual NYC Pride March through Midtown Manhattan.'     },
  { name: 'Billie Eilish — Hit Me Hard and Soft',  venue_name: 'Barclays Center',              venue_address: '620 Atlantic Ave, Brooklyn, NY 11217',             city: 'Brooklyn',        lat: 40.6826, lng: -73.9754, category: 'concert'  as const, starts_at: '2026-07-04T23:00:00Z', ends_at: '2026-07-05T01:30:00Z', description: 'Billie Eilish performs her acclaimed latest album.'     },
  { name: 'Electric Zoo Festival',                 venue_name: "Randall's Island Park",        venue_address: "Randall's Island, New York, NY 10035",             city: 'New York',        lat: 40.7910, lng: -73.9222, category: 'festival' as const, starts_at: '2026-09-05T17:00:00Z', ends_at: '2026-09-06T02:00:00Z', description: "NYC's premier electronic music festival."              },
  { name: 'Giants vs. Cowboys',                    venue_name: 'MetLife Stadium',              venue_address: '1 MetLife Stadium Dr, East Rutherford, NJ 07073',  city: 'East Rutherford', lat: 40.8135, lng: -74.0745, category: 'sports'   as const, starts_at: '2026-09-13T17:00:00Z', ends_at: '2026-09-13T20:00:00Z', description: 'NFL season opener — Giants host Dallas at MetLife.'    },
  { name: 'New York Comic Con',                    venue_name: 'Javits Center',                venue_address: '655 W 34th St, New York, NY 10001',                city: 'New York',        lat: 40.7571, lng: -74.0021, category: 'other'    as const, starts_at: '2026-10-08T14:00:00Z', ends_at: '2026-10-08T22:00:00Z', description: 'The biggest pop culture convention in NYC.'            },
] as const

// 12 realistic NYC departure neighborhoods
const ADDRESSES = [
  '121 Canal St, New York, NY 10002',
  'Jackson Heights, Queens, NY 11372',
  'Crown Heights, Brooklyn, NY 11213',
  'Bay Ridge, Brooklyn, NY 11209',
  'Washington Heights, New York, NY 10033',
  'Hoboken, NJ 07030',
  'Jersey City, NJ 07302',
  'Flushing, Queens, NY 11354',
  'Fordham Heights, Bronx, NY 10458',
  'St. George, Staten Island, NY 10301',
  'Upper West Side, New York, NY 10024',
  'Astoria, Queens, NY 11103',
]

// Total trip costs — cycles across rides (0 = free ride)
const COSTS = [0, 0, 30, 40, 0, 50, 0, 60, 40, 80]

// [riderIndex, rideIndex, outcome]
const APP_DEFS: [number, number, 'accepted' | 'rejected' | 'pending'][] = [
  [3,  0, 'accepted'], [3,  2, 'accepted'], [3,  4, 'pending'],  [3,  8, 'pending'],  [3, 14, 'pending'],  [3, 20, 'pending'],
  [4,  1, 'accepted'], [4,  3, 'pending'],  [4,  7, 'accepted'], [4, 11, 'pending'],  [4, 19, 'pending'],  [4, 25, 'pending'],
  [5,  5, 'accepted'], [5,  9, 'rejected'], [5, 13, 'accepted'], [5, 17, 'pending'],  [5, 21, 'pending'],  [5, 26, 'pending'],
  [6,  6, 'accepted'], [6, 10, 'pending'],  [6, 15, 'accepted'], [6, 23, 'pending'],  [6, 29, 'pending'],  [6, 33, 'pending'],
  [7,  4, 'accepted'], [7, 12, 'pending'],  [7, 16, 'accepted'], [7, 24, 'pending'],  [7, 30, 'pending'],  [7, 36, 'pending'],
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ok<T>(data: T | null, error: { message: string } | null, label: string): T {
  if (error || !data) throw new Error(`${label}: ${error?.message ?? 'no data returned'}`)
  return data
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // Idempotency guard
  const { data: existing } = await sb.from('profiles').select('id').eq('username', 'alex_rivera').maybeSingle()
  if (existing) {
    console.log('Seed data already exists.')
    console.log('To reseed: delete the @caravn.test users from Supabase Auth, then re-run.')
    process.exit(0)
  }

  // ── 1. Auth users ────────────────────────────────────────────────────────────
  console.log('\nCreating users…')
  const userIds: string[] = []
  for (const u of USERS) {
    const { data, error } = await sb.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { full_name: u.full_name, username: u.username },
    })
    if (error) throw new Error(`createUser ${u.email}: ${error.message}`)
    userIds.push(data.user.id)
    console.log(`  ✓ ${u.full_name.padEnd(18)} ${u.email}`)
  }

  // ── 2. Vehicles (drivers only) ───────────────────────────────────────────────
  console.log('\nCreating vehicles…')
  const vehicleIds: string[] = new Array(USERS.length).fill('')
  for (let i = 0; i < USERS.length; i++) {
    const v = USERS[i]!.vehicle
    if (!v) continue
    const seats   = generateSeatTemplate(v.type, v.capacity)
    const seatTpl = seatMapToRecord(seats)
    const { data, error } = await sb.from('vehicles').insert({
      owner_id: userIds[i]!, make: v.make, model: v.model, year: v.year,
      color: v.color, type: v.type, capacity: v.capacity,
      seat_template: seatTpl, is_default: true,
    }).select('id').single()
    vehicleIds[i] = ok(data, error, `vehicle for ${USERS[i]!.full_name}`).id
    console.log(`  ✓ ${v.year} ${v.make} ${v.model} (${v.capacity} seats)`)
  }

  // ── 3. Events ────────────────────────────────────────────────────────────────
  console.log('\nCreating events…')
  const eventIds: string[] = []
  for (const e of EVENTS) {
    const { data, error } = await sb.from('events').insert({ created_by: userIds[0]!, ...e }).select('id').single()
    eventIds.push(ok(data, error, `event "${e.name}"`).id)
    console.log(`  ✓ ${e.name}`)
  }

  // ── 4. Rides (50 total, 5 per event, cycling across 3 drivers) ───────────────
  console.log('\nCreating 50 rides…')
  type RideEntry = { id: string; passengerSeats: string[] }
  const rides: RideEntry[] = []

  for (let i = 0; i < 50; i++) {
    const driverIdx = i % 3
    const eventIdx  = Math.floor(i / 5)
    const event     = EVENTS[eventIdx]!
    const vehicle   = USERS[driverIdx]!.vehicle!

    const departureTime = new Date(new Date(event.starts_at).getTime() - 2 * 60 * 60 * 1000).toISOString()
    const returnTime    = new Date(new Date(event.ends_at).getTime()   + 30 * 60 * 1000).toISOString()

    const seats   = generateSeatTemplate(vehicle.type, vehicle.capacity)
    const seatMap = seatMapToRecord(seats)

    const { data, error } = await sb.from('rides').insert({
      driver_id:           userIds[driverIdx]!,
      event_id:            eventIds[eventIdx]!,
      vehicle_id:          vehicleIds[driverIdx]!,
      status:              'active',
      departure_address:   ADDRESSES[i % ADDRESSES.length]!,
      departure_time:      departureTime,
      return_time:         returnTime,
      cost_per_person:     COSTS[i % COSTS.length]!,
      notes:               i % 4 === 0 ? 'Meeting at the main entrance. Text when you arrive!' : null,
      seat_map:            seatMap,
      pickup_radius_miles: i % 5 === 0 ? 3 : null,
    }).select('id').single()

    const rideId = ok(data, error, `ride ${i}`).id
    const passengerSeats = Object.values(seatMap)
      .filter(s => !s.isDriver)
      .map(s => s.id)

    rides.push({ id: rideId, passengerSeats })
  }
  console.log('  ✓ 50 rides created')

  // ── 5. Ride applications ─────────────────────────────────────────────────────
  console.log('\nCreating ride applications…')
  // Track seats already assigned per ride to avoid conflicts on multi-applicant rides
  const usedSeatsPerRide: Record<string, number> = {}

  let appCount = 0
  for (const [riderIdx, rideIdx, outcome] of APP_DEFS) {
    const ride     = rides[rideIdx]
    if (!ride) { console.warn(`  ⚠ ride index ${rideIdx} out of range`); continue }

    const seatOffset = usedSeatsPerRide[ride.id] ?? 0
    const seatId     = ride.passengerSeats[seatOffset]
    if (!seatId) { console.warn(`  ⚠ no seat left on ride ${rideIdx}`); continue }
    usedSeatsPerRide[ride.id] = seatOffset + 1

    const { data: appData, error: insertErr } = await sb.from('ride_applications').insert({
      ride_id:  ride.id,
      rider_id: userIds[riderIdx]!,
      status:   'pending',
      seat_ids: [seatId],
      message:  outcome === 'accepted' ? 'Looking forward to it!' : null,
      cost_share: 0,
    }).select('id').single()

    if (insertErr || !appData) {
      console.warn(`  ⚠ insert failed [rider${riderIdx}, ride${rideIdx}]: ${insertErr?.message}`)
      continue
    }

    if (outcome !== 'pending') {
      const { error: updateErr } = await sb.from('ride_applications')
        .update({ status: outcome })
        .eq('id', appData.id)
      if (updateErr) console.warn(`  ⚠ update to ${outcome} failed: ${updateErr.message}`)
    }

    appCount++
  }
  console.log(`  ✓ ${appCount} applications created`)

  // ── Summary ───────────────────────────────────────────────────────────────────
  console.log('\n✅ Seed complete!\n')
  console.log('Test accounts — password for all: Test1234!\n')
  console.log('  Role    Email')
  console.log('  ──────  ──────────────────────────')
  for (const u of USERS) {
    const role = u.vehicle ? 'Driver' : 'Rider '
    console.log(`  ${role}  ${u.email}`)
  }
  console.log()
}

main().catch(err => {
  console.error('\n✗ Seed failed:', err.message)
  process.exit(1)
})
