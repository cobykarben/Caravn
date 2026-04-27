# Phase 1 · Tasks 11–13: Rides (Wizard, Detail, My Rides)

**Status: ⬜ All pending**

**Prerequisites:** Task 10 (Interactive Seat Map) must be done first — the wizard and detail page both use `<SeatMap>`.

**Next prompt to run:**
> "Read `docs/superpowers/plans/phase-1-task-4-rides.md` only. Implement Task 11: Create Ride Wizard. Follow the TDD steps exactly."

---

## Task 11: Create Ride Wizard (4-step) ⬜

### Objective

Build a 4-step wizard for posting a ride: (1) select event, (2) select vehicle (with seat preview), (3) ride details + optional flexible pickup, (4) review + publish. Publishing inserts a ride with `status: 'active'`, which fires the `on_ride_published` DB trigger and auto-creates the group chat.

### Files

| File | Action |
|------|--------|
| `components/rides/create-ride-wizard.tsx` | Create |
| `components/rides/__tests__/create-ride-wizard.test.tsx` | Create (many tests) |
| `app/(app)/rides/new/page.tsx` | Replace stub |

### Failing Tests

Create `components/rides/__tests__/create-ride-wizard.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { CreateRideWizard } from '../create-ride-wizard'
import type { Seat } from '@/lib/seat-templates'

const mockEvent = {
  id: 'evt-1',
  name: 'Taylor Swift — Eras Tour',
  venue_name: 'Wrigley Field',
  city: 'Chicago',
  starts_at: '2026-07-15T19:00:00Z',
}

const mockSeats: Seat[] = [
  { id: 'r0s0', row: 0, position: 0, label: 'Driver',           isDriver: true,  x: 25, y: 22, status: 'driver'    },
  { id: 'r0s1', row: 0, position: 1, label: 'Front Passenger',  isDriver: false, x: 75, y: 22, status: 'available' },
  { id: 'r1s0', row: 1, position: 0, label: 'Rear Left',        isDriver: false, x: 15, y: 72, status: 'available' },
  { id: 'r1s1', row: 1, position: 1, label: 'Rear Center',      isDriver: false, x: 50, y: 72, status: 'available' },
  { id: 'r1s2', row: 1, position: 2, label: 'Rear Right',       isDriver: false, x: 85, y: 72, status: 'available' },
]

const mockVehicle = {
  id: 'v1',
  make: 'Toyota',
  model: 'Camry',
  year: 2022,
  color: 'Silver',
  type: 'sedan' as const,
  capacity: 5,
  seat_template: mockSeats,
  is_default: true,
}

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }),
    },
    from: vi.fn(() => {
      const chain: Record<string, unknown> = {}
      const resolved = { data: [], error: null }
      const methods = ['select','eq','neq','ilike','or','order','limit','gte','in']
      methods.forEach(m => { chain[m] = vi.fn(() => chain) })
      chain['insert'] = vi.fn(() => ({
        select: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: { id: 'ride-new-1' }, error: null }) })),
      }))
      chain['update'] = vi.fn(() => chain)
      Object.assign(chain, { then: (cb: (v: typeof resolved) => void) => Promise.resolve().then(() => cb(resolved)) })
      return chain
    }),
  })),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => ({ get: vi.fn().mockReturnValue(null) }),
}))

describe('CreateRideWizard — step indicators', () => {
  it('renders all 4 step numbers', () => {
    render(<CreateRideWizard />)
    ;['1','2','3','4'].forEach(n =>
      expect(screen.getAllByText(n).length).toBeGreaterThanOrEqual(1)
    )
  })

  it('starts on step 1 — event selection', () => {
    render(<CreateRideWizard />)
    expect(screen.getByText(/select event/i)).toBeInTheDocument()
  })
})

describe('CreateRideWizard — step 1 (event selection)', () => {
  it('renders event search input', () => {
    render(<CreateRideWizard />)
    expect(screen.getByPlaceholderText(/search events/i)).toBeInTheDocument()
  })

  it('Next is disabled when no event is selected', () => {
    render(<CreateRideWizard />)
    expect(screen.getByRole('button', { name: /^next$/i })).toBeDisabled()
  })

  it('Next is enabled when a preselected event is provided', () => {
    render(<CreateRideWizard preselectedEvent={mockEvent} />)
    expect(screen.getByRole('button', { name: /^next$/i })).not.toBeDisabled()
  })

  it('shows selected event name when preselected', () => {
    render(<CreateRideWizard preselectedEvent={mockEvent} />)
    expect(screen.getByText('Taylor Swift — Eras Tour')).toBeInTheDocument()
  })
})

describe('CreateRideWizard — step 2 (vehicle selection)', () => {
  async function goToStep2() {
    const user = userEvent.setup()
    render(<CreateRideWizard preselectedEvent={mockEvent} />)
    await user.click(screen.getByRole('button', { name: /^next$/i }))
    return user
  }

  it('advances to step 2 when Next is clicked with event selected', async () => {
    await goToStep2()
    expect(screen.getByText(/select vehicle/i)).toBeInTheDocument()
  })

  it('Back button returns to step 1', async () => {
    const user = await goToStep2()
    await user.click(screen.getByRole('button', { name: /^back$/i }))
    expect(screen.getByText(/select event/i)).toBeInTheDocument()
  })

  it('Next is disabled when no vehicle is selected', async () => {
    await goToStep2()
    expect(screen.getByRole('button', { name: /^next$/i })).toBeDisabled()
  })
})

describe('CreateRideWizard — step 3 (ride details)', () => {
  async function goToStep3() {
    const user = userEvent.setup()
    render(<CreateRideWizard preselectedEvent={mockEvent} preselectedVehicle={mockVehicle} />)
    await user.click(screen.getByRole('button', { name: /^next$/i })) // step 1 → 2
    await user.click(screen.getByRole('button', { name: /^next$/i })) // step 2 → 3
    return user
  }

  it('advances to step 3 with vehicle preselected', async () => {
    await goToStep3()
    expect(screen.getByText(/ride details/i)).toBeInTheDocument()
  })

  it('renders departure address and time inputs', async () => {
    await goToStep3()
    expect(screen.getByLabelText(/departure address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/departure time/i)).toBeInTheDocument()
  })

  it('renders cost per person input defaulting to 0', async () => {
    await goToStep3()
    const costInput = screen.getByLabelText(/cost per person/i) as HTMLInputElement
    expect(costInput.value).toBe('0')
  })

  it('renders optional pickup radius toggle', async () => {
    await goToStep3()
    expect(screen.getByLabelText(/flexible pickup/i)).toBeInTheDocument()
  })

  it('Next is disabled when required fields are empty', async () => {
    await goToStep3()
    expect(screen.getByRole('button', { name: /^next$/i })).toBeDisabled()
  })

  it('Next is enabled when departure address and time are filled', async () => {
    const user = await goToStep3()
    await user.type(screen.getByLabelText(/departure address/i), '123 Main St, Chicago')
    await user.type(screen.getByLabelText(/departure time/i), '2026-07-15T17:00')
    expect(screen.getByRole('button', { name: /^next$/i })).not.toBeDisabled()
  })
})

describe('CreateRideWizard — step 4 (preview + publish)', () => {
  async function goToStep4() {
    const user = userEvent.setup()
    render(<CreateRideWizard preselectedEvent={mockEvent} preselectedVehicle={mockVehicle} />)
    await user.click(screen.getByRole('button', { name: /^next$/i })) // → step 2
    await user.click(screen.getByRole('button', { name: /^next$/i })) // → step 3
    await user.type(screen.getByLabelText(/departure address/i), '123 Main St')
    await user.type(screen.getByLabelText(/departure time/i), '2026-07-15T17:00')
    await user.click(screen.getByRole('button', { name: /^next$/i })) // → step 4
    return user
  }

  it('shows review heading and Publish Ride button', async () => {
    await goToStep4()
    expect(screen.getByText(/review & publish/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /publish ride/i })).toBeInTheDocument()
  })

  it('shows selected event name in review', async () => {
    await goToStep4()
    expect(screen.getByText('Taylor Swift — Eras Tour')).toBeInTheDocument()
  })

  it('shows vehicle info in review', async () => {
    await goToStep4()
    expect(screen.getByText(/2022 Toyota Camry/i)).toBeInTheDocument()
  })

  it('shows departure address in review', async () => {
    await goToStep4()
    expect(screen.getByText('123 Main St')).toBeInTheDocument()
  })

  it('Back button in step 4 returns to step 3', async () => {
    const user = await goToStep4()
    await user.click(screen.getByRole('button', { name: /^back$/i }))
    expect(screen.getByText(/ride details/i)).toBeInTheDocument()
  })
})
```

### Implementation

Create `components/rides/create-ride-wizard.tsx`:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Car, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { seatMapToRecord, type Seat } from '@/lib/seat-templates'
import { SeatMap } from '@/components/rides/seat-map'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type WizardEvent = {
  id: string; name: string; venue_name: string; city: string; starts_at: string
}

type WizardVehicle = {
  id: string; make: string; model: string; year: number; color: string
  type: string; capacity: number; seat_template: Seat[]; is_default: boolean
}

type WizardStep = 1 | 2 | 3 | 4

type RideDetails = {
  departureAddress: string; departureTime: string; returnTime: string
  costPerPerson: number; notes: string; pickupRadiusMiles: number | null
}

function StepIndicator({ current }: { current: WizardStep }) {
  const labels = ['Event', 'Vehicle', 'Details', 'Review']
  return (
    <div className="flex items-center gap-2 mb-6">
      {labels.map((label, i) => {
        const step = (i + 1) as WizardStep
        const isActive = step === current
        const isDone = step < current
        return (
          <div key={step} className="flex items-center gap-2 flex-1">
            <div className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 shrink-0',
              isDone  ? 'bg-foreground border-foreground text-background' :
              isActive ? 'border-foreground text-foreground bg-transparent' :
                         'border-border text-muted-foreground bg-transparent'
            )}>
              {isDone ? <Check className="h-3.5 w-3.5" /> : step}
            </div>
            <span className={cn(
              'text-xs hidden sm:block',
              isActive ? 'text-foreground font-medium' : 'text-muted-foreground'
            )}>{label}</span>
            {i < labels.length - 1 && (
              <div className={cn('h-px flex-1', isDone ? 'bg-foreground' : 'bg-border')} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function Step1Event({ selected, onSelect }: { selected: WizardEvent | null; onSelect: (e: WizardEvent) => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<WizardEvent[]>([])
  const supabase = createClient()

  useEffect(() => {
    if (query.length < 2) { setResults([]); return }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('events')
        .select('id, name, venue_name, city, starts_at')
        .or(`name.ilike.%${query}%,venue_name.ilike.%${query}%,city.ilike.%${query}%`)
        .gte('starts_at', new Date().toISOString())
        .order('starts_at', { ascending: true })
        .limit(8)
      setResults(data ?? [])
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Select Event</h2>
      {selected && (
        <div className="mb-4 p-3 rounded-xl border border-foreground/30 bg-card">
          <p className="text-sm font-semibold">{selected.name}</p>
          <p className="text-xs text-muted-foreground">{selected.venue_name} · {selected.city}</p>
          <button onClick={() => { setQuery(''); setResults([]) }} className="text-xs text-muted-foreground underline underline-offset-4 mt-1">Change event</button>
        </div>
      )}
      {!selected && (
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search events, venues, cities…" className="pl-9" />
        </div>
      )}
      {!selected && results.length > 0 && (
        <div className="space-y-2">
          {results.map(evt => (
            <button key={evt.id} onClick={() => { onSelect(evt); setQuery(''); setResults([]) }}
              className="w-full text-left p-3 rounded-xl border border-border bg-card hover:bg-muted transition-colors">
              <p className="text-sm font-semibold">{evt.name}</p>
              <p className="text-xs text-muted-foreground">{evt.venue_name} · {evt.city}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Step2Vehicle({ selected, onSelect }: { selected: WizardVehicle | null; onSelect: (v: WizardVehicle) => void }) {
  const [vehicles, setVehicles] = useState<WizardVehicle[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('vehicles')
        .select('id, make, model, year, color, type, capacity, seat_template, is_default')
        .eq('owner_id', user.id)
        .order('is_default', { ascending: false })
      setVehicles((data ?? []) as WizardVehicle[])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <p className="text-sm text-muted-foreground py-8 text-center">Loading vehicles…</p>

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Select Vehicle</h2>
      {vehicles.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-xl">
          <p className="text-sm text-muted-foreground mb-3">No vehicles registered</p>
          <Button asChild size="sm"><a href="/profile/vehicles/new">Add a vehicle first</a></Button>
        </div>
      ) : (
        <div className="space-y-3">
          {vehicles.map(v => {
            const isSelected = selected?.id === v.id
            return (
              <button key={v.id} onClick={() => onSelect(v)}
                className={cn('w-full text-left p-4 rounded-xl border-2 transition-colors',
                  isSelected ? 'border-foreground bg-card' : 'border-border bg-card hover:bg-muted')}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Car className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm font-semibold">{v.year} {v.make} {v.model}</p>
                      <p className="text-xs text-muted-foreground capitalize">{v.color} · {v.type} · {v.capacity} seats</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {v.is_default && <Badge variant="outline" className="text-xs">Default</Badge>}
                    {isSelected && <div className="w-5 h-5 rounded-full bg-foreground flex items-center justify-center"><Check className="h-3 w-3 text-background" /></div>}
                  </div>
                </div>
                {isSelected && <div className="mt-4"><SeatMap seats={v.seat_template} readOnly /></div>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Step3Details({ details, onChange }: { details: RideDetails; onChange: (d: Partial<RideDetails>) => void }) {
  const [flexPickup, setFlexPickup] = useState(details.pickupRadiusMiles !== null)

  function toggleFlexPickup(checked: boolean) {
    setFlexPickup(checked)
    onChange({ pickupRadiusMiles: checked ? 2 : null })
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Ride Details</h2>
      <div className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="departureAddress">Departure address</Label>
          <Input id="departureAddress" value={details.departureAddress} onChange={e => onChange({ departureAddress: e.target.value })} placeholder="123 Main St, Chicago, IL" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="departureTime">Departure time</Label>
          <Input id="departureTime" type="datetime-local" value={details.departureTime} onChange={e => onChange({ departureTime: e.target.value })} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="returnTime">Return time (optional)</Label>
          <Input id="returnTime" type="datetime-local" value={details.returnTime} onChange={e => onChange({ returnTime: e.target.value })} min={details.departureTime} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="costPerPerson">Cost per person ($)</Label>
          <Input id="costPerPerson" type="number" min={0} step={0.01} value={details.costPerPerson} onChange={e => onChange({ costPerPerson: parseFloat(e.target.value) || 0 })} />
          <p className="text-xs text-muted-foreground">Set to $0 for a free ride</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="notes">Notes (optional)</Label>
          <Textarea id="notes" value={details.notes} onChange={e => onChange({ notes: e.target.value })} placeholder="Meeting point details, luggage rules, etc." rows={3} />
        </div>
        <div className="space-y-3 p-4 rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="flexPickup" className="text-sm font-medium cursor-pointer">Flexible pickup</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Allow riders to request a custom pickup within a radius</p>
            </div>
            <input id="flexPickup" type="checkbox" checked={flexPickup} onChange={e => toggleFlexPickup(e.target.checked)}
              className="w-4 h-4 accent-foreground cursor-pointer" aria-label="Flexible pickup" />
          </div>
          {flexPickup && (
            <div className="space-y-1.5 pt-1 border-t border-border">
              <Label htmlFor="pickupRadius">Pickup radius (miles)</Label>
              <Input id="pickupRadius" type="number" min={0.5} max={25} step={0.5}
                value={details.pickupRadiusMiles ?? 2}
                onChange={e => onChange({ pickupRadiusMiles: parseFloat(e.target.value) || 2 })} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Step4Review({ event, vehicle, details, onPublish, publishing }: {
  event: WizardEvent; vehicle: WizardVehicle; details: RideDetails; onPublish: () => void; publishing: boolean
}) {
  const seatMap = seatMapToRecord(vehicle.seat_template)
  const availableCount = Object.values(seatMap).filter(s => !s.isDriver).length

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Review &amp; Publish</h2>
      <div className="space-y-3 mb-6">
        <div className="p-4 rounded-xl border border-border bg-card space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Event</p>
          <p className="text-sm font-semibold">{event.name}</p>
          <p className="text-xs text-muted-foreground">{event.venue_name} · {event.city}</p>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Vehicle</p>
          <p className="text-sm font-semibold">{vehicle.year} {vehicle.make} {vehicle.model}</p>
          <p className="text-xs text-muted-foreground capitalize">{vehicle.color} · {vehicle.type} · {availableCount} passenger seat{availableCount !== 1 ? 's' : ''}</p>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Pickup</p>
          <p className="text-sm">{details.departureAddress}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(details.departureTime).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
          </p>
          {details.pickupRadiusMiles && <p className="text-xs text-muted-foreground">Flexible pickup within {details.pickupRadiusMiles} mi</p>}
        </div>
        <div className="p-4 rounded-xl border border-border bg-card space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Cost</p>
          <p className="text-sm font-semibold">{details.costPerPerson === 0 ? 'Free ride' : `$${details.costPerPerson.toFixed(2)} / person`}</p>
        </div>
        {details.returnTime && (
          <div className="p-4 rounded-xl border border-border bg-card space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Return</p>
            <p className="text-xs text-muted-foreground">{new Date(details.returnTime).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
          </div>
        )}
        {details.notes && (
          <div className="p-4 rounded-xl border border-border bg-card space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Notes</p>
            <p className="text-sm">{details.notes}</p>
          </div>
        )}
      </div>
      <div className="mb-6">
        <p className="text-xs text-muted-foreground mb-3 text-center">Seat layout</p>
        <SeatMap seats={vehicle.seat_template} readOnly />
      </div>
      <Button onClick={onPublish} disabled={publishing} className="w-full" size="lg">
        {publishing ? 'Publishing…' : 'Publish Ride'}
      </Button>
    </div>
  )
}

type Props = { preselectedEvent?: WizardEvent; preselectedVehicle?: WizardVehicle }

export function CreateRideWizard({ preselectedEvent, preselectedVehicle }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState<WizardStep>(1)
  const [event, setEvent] = useState<WizardEvent | null>(preselectedEvent ?? null)
  const [vehicle, setVehicle] = useState<WizardVehicle | null>(preselectedVehicle ?? null)
  const [details, setDetails] = useState<RideDetails>({
    departureAddress: '', departureTime: '', returnTime: '', costPerPerson: 0, notes: '', pickupRadiusMiles: null,
  })
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (preselectedEvent || event) return
    const eventId = searchParams.get('event')
    if (!eventId) return
    supabase.from('events').select('id, name, venue_name, city, starts_at').eq('id', eventId).single()
      .then(({ data }) => { if (data) setEvent(data as WizardEvent) })
  }, [])

  const step3Complete = details.departureAddress.trim() !== '' && details.departureTime !== ''
  function next() { setStep(s => (s < 4 ? (s + 1) as WizardStep : s)) }
  function back() { setStep(s => (s > 1 ? (s - 1) as WizardStep : s)) }

  async function publish() {
    if (!event || !vehicle) return
    setPublishing(true); setError(null)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setPublishing(false); return }
    const seatMap = seatMapToRecord(vehicle.seat_template)
    const { data, error: insertError } = await supabase.from('rides').insert({
      driver_id: user.id, event_id: event.id, vehicle_id: vehicle.id, status: 'active',
      departure_address: details.departureAddress, departure_time: details.departureTime,
      return_time: details.returnTime || null, cost_per_person: details.costPerPerson,
      notes: details.notes || null, seat_map: seatMap, pickup_radius_miles: details.pickupRadiusMiles,
    }).select('id').single()
    if (insertError || !data) { setError(insertError?.message ?? 'Failed to publish ride'); setPublishing(false); return }
    router.push(`/rides/${data.id}`)
  }

  return (
    <div>
      <StepIndicator current={step} />
      {step === 1 && (<><Step1Event selected={event} onSelect={setEvent} /><div className="mt-6 flex justify-end"><Button onClick={next} disabled={!event}>Next</Button></div></>)}
      {step === 2 && (<><Step2Vehicle selected={vehicle} onSelect={setVehicle} /><div className="mt-6 flex justify-between"><Button variant="outline" onClick={back}>Back</Button><Button onClick={next} disabled={!vehicle}>Next</Button></div></>)}
      {step === 3 && (<><Step3Details details={details} onChange={patch => setDetails(d => ({ ...d, ...patch }))} />{error && <p className="mt-3 text-sm text-red-400">{error}</p>}<div className="mt-6 flex justify-between"><Button variant="outline" onClick={back}>Back</Button><Button onClick={next} disabled={!step3Complete}>Next</Button></div></>)}
      {step === 4 && event && vehicle && (<><Step4Review event={event} vehicle={vehicle} details={details} onPublish={publish} publishing={publishing} />{error && <p className="mt-3 text-sm text-red-400">{error}</p>}<div className="mt-4"><Button variant="outline" onClick={back} className="w-full">Back</Button></div></>)}
    </div>
  )
}
```

Replace `app/(app)/rides/new/page.tsx`:

```typescript
import { Suspense } from 'react'
import { CreateRideWizard } from '@/components/rides/create-ride-wizard'

export default function NewRidePage() {
  return (
    <div className="px-4 pt-6 pb-10">
      <h1 className="text-2xl font-bold mb-6">Post a Ride</h1>
      <Suspense fallback={null}>
        <CreateRideWizard />
      </Suspense>
    </div>
  )
}
```

**Note:** `<Suspense>` is required because `CreateRideWizard` uses `useSearchParams()`.

### Verify & Commit

```bash
npm run test:run components/rides/__tests__/create-ride-wizard.test.tsx
npm run test:run
npm run build
git add components/rides/create-ride-wizard.tsx components/rides/__tests__/create-ride-wizard.test.tsx app/(app)/rides/new/page.tsx
git commit -m "feat: 4-step create ride wizard (event → vehicle → details → publish)"
```

---

## Task 12: Ride Detail Page + Application Form ⬜

**Next prompt to run (after Task 11):**
> "Read `docs/superpowers/plans/phase-1-task-4-rides.md` only. Implement Task 12: Ride Detail Page and Application Form."

### Objective

The ride detail page is a server component that determines the viewer's role (driver / accepted / pending / visitor) and renders accordingly. Accept/reject runs through server actions. The application form is a client component.

### Files

| File | Action |
|------|--------|
| `app/(app)/rides/[id]/page.tsx` | Create |
| `components/rides/ride-card.tsx` | Replace stub with full implementation |
| `components/rides/ride-application-form.tsx` | Create |
| `components/rides/__tests__/ride-application-form.test.tsx` | Create (7 tests) |

### Failing Tests

Create `components/rides/__tests__/ride-application-form.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { RideApplicationForm } from '../ride-application-form'
import type { Seat } from '@/lib/seat-templates'

const seats: Seat[] = [
  { id: 'r0s0', row: 0, position: 0, label: 'Driver',          isDriver: true,  x: 25, y: 22, status: 'driver'    },
  { id: 'r0s1', row: 0, position: 1, label: 'Front Passenger', isDriver: false, x: 75, y: 22, status: 'available' },
  { id: 'r1s0', row: 1, position: 0, label: 'Rear Left',       isDriver: false, x: 15, y: 72, status: 'available' },
  { id: 'r1s1', row: 1, position: 1, label: 'Rear Center',     isDriver: false, x: 50, y: 72, status: 'available' },
  { id: 'r1s2', row: 1, position: 2, label: 'Rear Right',      isDriver: false, x: 85, y: 72, status: 'available' },
]

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
    })),
  })),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

const freeRide = { id: 'r1', cost_per_person: 0, is_paid: false, pickup_radius_miles: null, seats, accepted_count: 0 }
const paidRide = { id: 'r2', cost_per_person: 60, is_paid: true, pickup_radius_miles: null, seats, accepted_count: 1 }
const flexRide  = { id: 'r3', cost_per_person: 0, is_paid: false, pickup_radius_miles: 2, seats, accepted_count: 0 }

describe('RideApplicationForm', () => {
  it('renders the seat map', () => {
    render(<RideApplicationForm ride={freeRide} />)
    expect(screen.getByRole('button', { name: /driver/i })).toBeInTheDocument()
  })

  it('Submit is disabled when no seats are selected', () => {
    render(<RideApplicationForm ride={freeRide} />)
    expect(screen.getByRole('button', { name: /request seat/i })).toBeDisabled()
  })

  it('Submit is enabled after selecting an available seat', async () => {
    const user = userEvent.setup()
    render(<RideApplicationForm ride={freeRide} />)
    await user.click(screen.getByRole('button', { name: /front passenger/i }))
    expect(screen.getByRole('button', { name: /request seat/i })).not.toBeDisabled()
  })

  it('shows "Free ride" for rides with cost_per_person = 0', () => {
    render(<RideApplicationForm ride={freeRide} />)
    expect(screen.getByText(/free ride/i)).toBeInTheDocument()
  })

  it('shows estimated cost per person for paid rides', () => {
    // $60 / (1 accepted + 1 driver + 1 new rider) = $20
    render(<RideApplicationForm ride={paidRide} />)
    expect(screen.getByText(/\$20\.00/)).toBeInTheDocument()
  })

  it('shows custom pickup address field when driver has flexible pickup radius', () => {
    render(<RideApplicationForm ride={flexRide} />)
    expect(screen.getByLabelText(/custom pickup/i)).toBeInTheDocument()
  })

  it('does not show custom pickup when pickup_radius_miles is null', () => {
    render(<RideApplicationForm ride={freeRide} />)
    expect(screen.queryByLabelText(/custom pickup/i)).not.toBeInTheDocument()
  })
})
```

### Implementation

**`components/rides/ride-application-form.tsx`:**

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { calculateCostShare } from '@/lib/cost-split'
import { SeatMap } from '@/components/rides/seat-map'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { Seat } from '@/lib/seat-templates'

type Props = {
  ride: {
    id: string; cost_per_person: number; is_paid: boolean
    pickup_radius_miles: number | null; seats: Seat[]; accepted_count: number
  }
}

export function RideApplicationForm({ ride }: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [customPickup, setCustomPickup] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  function toggleSeat(id: string) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])
  }

  const estimatedCost = ride.is_paid
    ? calculateCostShare(ride.cost_per_person, ride.accepted_count + selectedIds.length)
    : 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (selectedIds.length === 0) return
    setLoading(true); setError(null)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not signed in'); setLoading(false); return }
    const { error: insertError } = await supabase.from('ride_applications').insert({
      ride_id: ride.id, rider_id: user.id, status: 'pending', seat_ids: selectedIds,
      message: message.trim() || null,
      custom_pickup_address: customPickup.trim() || null,
      cost_share: estimatedCost,
    })
    if (insertError) { setError(insertError.message); setLoading(false); return }
    setSubmitted(true)
    router.refresh()
  }

  if (submitted) {
    return (
      <div className="p-4 rounded-xl border border-border bg-card text-center py-8">
        <p className="text-sm font-semibold mb-1">Request sent!</p>
        <p className="text-xs text-muted-foreground">The driver will review your request.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <p className="text-sm font-medium mb-3">Select your seat{selectedIds.length > 1 ? 's' : ''}</p>
        <SeatMap seats={ride.seats} selectedSeatIds={selectedIds} onSeatToggle={toggleSeat} />
      </div>
      <div className="p-3 rounded-xl border border-border bg-card text-center">
        {ride.is_paid ? (
          <p className="text-sm">Estimated cost: <span className="font-semibold">${estimatedCost.toFixed(2)} / person</span><span className="text-muted-foreground text-xs ml-1">(recalculated on acceptance)</span></p>
        ) : (
          <p className="text-sm font-semibold text-green-400">Free ride</p>
        )}
      </div>
      {ride.pickup_radius_miles !== null && (
        <div className="space-y-1.5">
          <Label htmlFor="customPickup">Custom pickup address (within {ride.pickup_radius_miles} mi)</Label>
          <Input id="customPickup" value={customPickup} onChange={e => setCustomPickup(e.target.value)} placeholder="Your preferred pickup address" />
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="message">Message to driver (optional)</Label>
        <Textarea id="message" value={message} onChange={e => setMessage(e.target.value)} placeholder="Hi, looking forward to this!" rows={2} />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button type="submit" className="w-full" size="lg" disabled={selectedIds.length === 0 || loading}>
        {loading ? 'Sending…' : `Request seat${selectedIds.length > 1 ? 's' : ''}`}
      </Button>
    </form>
  )
}
```

**Replace `components/rides/ride-card.tsx`** (full implementation):

```typescript
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { CalendarDays, MapPin } from 'lucide-react'
import type { Seat } from '@/lib/seat-templates'

type RideCardProps = {
  ride: {
    id: string; departure_address: string; departure_time: string
    cost_per_person: number; is_paid: boolean; status: string
    seat_map: Record<string, Seat>
    driver?: { full_name: string; username: string; avatar_url: string | null } | null
  }
}

export function RideCard({ ride }: RideCardProps) {
  const seats = Object.values(ride.seat_map)
  const availableSeats = seats.filter(s => !s.isDriver && s.status === 'available').length
  const isFull = ride.status === 'full'
  const timeStr = new Date(ride.departure_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const dateStr = new Date(ride.departure_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return (
    <Link href={`/rides/${ride.id}`} className="block bg-card border border-border rounded-xl p-4 active:opacity-80 transition-opacity">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          {ride.driver && (
            <Avatar className="w-8 h-8 shrink-0">
              {ride.driver.avatar_url && <AvatarImage src={ride.driver.avatar_url} />}
              <AvatarFallback className="text-xs bg-muted">{ride.driver.full_name.charAt(0)}</AvatarFallback>
            </Avatar>
          )}
          <div>
            <p className="text-sm font-semibold leading-tight">{ride.driver?.full_name ?? 'Driver'}</p>
            {ride.driver && <p className="text-xs text-muted-foreground">@{ride.driver.username}</p>}
          </div>
        </div>
        <Badge variant={isFull ? 'secondary' : 'outline'} className="text-xs shrink-0">
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
          {ride.is_paid ? `$${ride.cost_per_person.toFixed(2)} total trip cost · split equally` : <span className="text-green-400">Free ride</span>}
        </span>
      </div>
    </Link>
  )
}
```

**Create `app/(app)/rides/[id]/page.tsx`** — key sections:
- Fetch ride with driver, vehicle, event, and `ride_applications` (with rider profile)
- Determine viewer role: `isDriver`, `myApplication`, `isAccepted`, `isPending`
- Server actions: `acceptApplication`, `rejectApplication`, `cancelRide` (all use `revalidatePath`)
- Render sections conditionally:
  - **Driver:** pending applications list with accept/reject form buttons; cancel ride button
  - **Accepted rider:** green confirmation box showing seat IDs + cost share
  - **Pending rider:** yellow "awaiting response" box
  - **Visitor (status=active):** `<RideApplicationForm>`
  - **Visitor (status=full):** "This ride is full" box
- Group chat link (visible to driver + accepted riders if `ride_chats` row exists)
- Read-only `<SeatMap>` for everyone

See the full implementation in the original plan or implement from the description above.

### Verify & Commit

```bash
npm run test:run components/rides/__tests__/ride-application-form.test.tsx
npm run test:run
npm run build
git add app/(app)/rides/\[id\]/ components/rides/ride-application-form.tsx components/rides/ride-card.tsx components/rides/__tests__/ride-application-form.test.tsx
git commit -m "feat: ride detail page with seat map, driver accept/reject, and rider application form"
```

---

## Task 13: My Rides Page ⬜

**Next prompt to run (after Task 12):**
> "Read `docs/superpowers/plans/phase-1-task-4-rides.md` only. Implement Task 13: My Rides Page."

### Objective

Server component showing "Driving" and "Riding" sections. No new components — reuses `<RideCard>`.

### File

Replace `app/(app)/rides/page.tsx`:

```typescript
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RideCard } from '@/components/rides/ride-card'

export default async function RidesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: drivingRides } = await supabase
    .from('rides')
    .select(`id, status, departure_address, departure_time, cost_per_person, is_paid, seat_map,
      driver:profiles!driver_id(id, full_name, username, avatar_url)`)
    .eq('driver_id', user.id)
    .in('status', ['active', 'full', 'draft'])
    .order('departure_time', { ascending: true })

  const { data: ridingApplications } = await supabase
    .from('ride_applications')
    .select(`ride:rides!ride_id(id, status, departure_address, departure_time, cost_per_person, is_paid, seat_map,
      driver:profiles!driver_id(id, full_name, username, avatar_url))`)
    .eq('rider_id', user.id)
    .eq('status', 'accepted')

  const ridingRides = (ridingApplications ?? []).map(a => a.ride).filter(Boolean) as any[]
  const isEmpty = (!drivingRides || drivingRides.length === 0) && ridingRides.length === 0

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
          {drivingRides && drivingRides.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Driving</h2>
              <div className="space-y-3">{drivingRides.map(ride => <RideCard key={ride.id} ride={ride as any} />)}</div>
            </section>
          )}
          {ridingRides.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Riding</h2>
              <div className="space-y-3">{ridingRides.map(ride => <RideCard key={ride.id} ride={ride as any} />)}</div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
```

### Verify & Commit

```bash
npm run test:run
npm run build
git add app/(app)/rides/page.tsx
git commit -m "feat: My Rides page with driving and riding sections"
```

---

## Next Steps After Task 13

Read `phase-1-task-5-social.md` for Tasks 14–15 (Group Chat + Friends).
