'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { generateSeatTemplate, type Seat } from '@/lib/seat-templates'
import { SeatMap } from '@/components/rides/seat-map'
import { getBrands, getModelsByBrand, inferVehicleType } from '@/lib/car-data'
import { VEHICLE_TYPES } from '@/components/rides/vehicle-silhouettes'
import type { VehicleType } from '@/components/rides/vehicle-silhouettes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function VehicleForm({ returnTo }: { returnTo?: string }) {
  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState(new Date().getFullYear().toString())
  const [color, setColor] = useState('')
  const [licensePlate, setLicensePlate] = useState('')
  const [type, setType] = useState<VehicleType>('sedan')
  const [capacity, setCapacity] = useState(5)
  const [seatTemplate, setSeatTemplate] = useState<Seat[]>([])
  const [defaultReservedSeatIds, setDefaultReservedSeatIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const brands = getBrands()
  const models = make ? getModelsByBrand(make) : []

  useEffect(() => {
    if (!model) { setSeatTemplate([]); return }
    const template = generateSeatTemplate(type, capacity)
    setSeatTemplate(template)
    setDefaultReservedSeatIds(prev => prev.filter(id => template.some(s => s.id === id)))
  }, [type, capacity, model])

  function handleMakeSelect(brand: string | null) {
    if (!brand) return
    setMake(brand)
    setModel('')
    setSeatTemplate([])
    setDefaultReservedSeatIds([])
  }

  function handleModelSelect(modelName: string | null) {
    if (!modelName) return
    const modelData = models.find(m => m.model === modelName)
    if (!modelData) return
    setModel(modelName)
    const inferredType = inferVehicleType(make, modelName, modelData.seats)
    setType(inferredType)
    setCapacity(modelData.seats)
  }

  function toggleReservedSeat(seatId: string) {
    setDefaultReservedSeatIds(prev =>
      prev.includes(seatId) ? prev.filter(id => id !== seatId) : [...prev, seatId]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Session expired. Please sign in again.')
      setLoading(false)
      return
    }

    const template = generateSeatTemplate(type, capacity)

    const { data: existing } = await supabase
      .from('vehicles')
      .select('id')
      .eq('owner_id', user.id)

    const isDefault = !existing || existing.length === 0

    const { error: insertError } = await supabase.from('vehicles').insert({
      owner_id: user.id,
      make,
      model,
      year: parseInt(year),
      color,
      type,
      capacity,
      seat_template: template,
      is_default: isDefault,
      license_plate: licensePlate.trim() || null,
      default_reserved_seat_ids: defaultReservedSeatIds,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.push(returnTo ?? '/profile/vehicles')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Make (brand) */}
      <div className="space-y-1.5">
        <Label htmlFor="make">Make</Label>
        <Select value={make} onValueChange={handleMakeSelect}>
          <SelectTrigger id="make">
            <SelectValue placeholder="Select make" />
          </SelectTrigger>
          <SelectContent>
            {brands.map(b => (
              <SelectItem key={b} value={b}>{b}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Model */}
      <div className="space-y-1.5">
        <Label htmlFor="model">Model</Label>
        <Select value={model} onValueChange={handleModelSelect} disabled={!make}>
          <SelectTrigger id="model">
            <SelectValue placeholder={make ? 'Select model' : 'Select make first'} />
          </SelectTrigger>
          <SelectContent>
            {models.map(m => (
              <SelectItem key={m.model} value={m.model}>{m.model}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Year + Color */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="year">Year</Label>
          <Input
            id="year"
            type="number"
            value={year}
            onChange={e => setYear(e.target.value)}
            min={1990}
            max={new Date().getFullYear() + 1}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="color">Color</Label>
          <Input
            id="color"
            value={color}
            onChange={e => setColor(e.target.value)}
            placeholder="Silver"
            required
          />
        </div>
      </div>

      {/* Vehicle type */}
      <div className="space-y-1.5">
        <Label htmlFor="type">Vehicle type</Label>
        <Select value={type} onValueChange={v => setType(v as VehicleType)}>
          <SelectTrigger id="type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {VEHICLE_TYPES.map(t => (
              <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* License plate */}
      <div className="space-y-1.5">
        <Label htmlFor="licensePlate">License plate</Label>
        <Input
          id="licensePlate"
          value={licensePlate}
          onChange={e => setLicensePlate(e.target.value.toUpperCase())}
          placeholder="ABC 1234"
        />
        <p className="text-xs text-muted-foreground">Only shown to confirmed riders</p>
      </div>

      {/* Seat map — shown once model is selected */}
      {seatTemplate.length > 0 ? (
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium">Default seat layout</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tap passenger seats to mark them as always reserved by default (e.g. for car seats or personal preference). You can override this when posting a ride.
            </p>
          </div>
          <SeatMap
            seats={seatTemplate}
            vehicleType={type}
            selectedSeatIds={defaultReservedSeatIds}
            onSeatToggle={toggleReservedSeat}
          />
          {defaultReservedSeatIds.length > 0 && (
            <p className="text-xs text-muted-foreground text-center">
              {defaultReservedSeatIds.length} seat{defaultReservedSeatIds.length !== 1 ? 's' : ''} reserved by default
            </p>
          )}
        </div>
      ) : (
        <div className="bg-muted/30 border border-border border-dashed rounded-xl p-6 text-center">
          <p className="text-xs text-muted-foreground">Select a make and model to preview the seat layout</p>
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={loading || !make || !model}
      >
        {loading ? 'Saving…' : 'Save vehicle'}
      </Button>
    </form>
  )
}
