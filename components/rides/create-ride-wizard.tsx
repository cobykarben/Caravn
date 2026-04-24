'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Car, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { seatMapToRecord, type Seat } from '@/lib/seat-templates'
import { SeatMap } from '@/components/rides/seat-map'
import { Button, buttonVariants } from '@/components/ui/button'
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
      setResults((data ?? []) as WizardEvent[])
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
          <a href="/profile/vehicles/new" className={buttonVariants({ size: 'sm' })}>Add a vehicle first</a>
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
      .then((res: { data: unknown }) => { if (res.data) setEvent(res.data as WizardEvent) })
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
    router.push(`/rides/${(data as { id: string }).id}`)
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
