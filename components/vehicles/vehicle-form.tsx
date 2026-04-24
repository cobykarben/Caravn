'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { generateSeatTemplate, type Seat } from '@/lib/seat-templates'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

const VEHICLE_TYPES = ['sedan', 'suv', 'minivan', 'truck', 'coupe', 'hatchback', 'van'] as const
type VehicleType = typeof VEHICLE_TYPES[number]

const MAX_CAPACITY: Record<VehicleType, number> = {
  sedan: 5, coupe: 4, hatchback: 5, suv: 7, minivan: 8, van: 11, truck: 5,
}

function SeatPreview({ seats }: { seats: Seat[] }) {
  const rows = [...new Set(seats.map(s => s.row))].sort((a, b) => a - b)
  const passengerCount = seats.filter(s => !s.isDriver).length

  return (
    <div className="bg-muted/50 border border-border rounded-xl p-4">
      <p className="text-xs text-muted-foreground mb-3 text-center">Seat preview</p>
      <div className="flex flex-col items-center gap-2">
        {rows.map(row => {
          const rowSeats = seats.filter(s => s.row === row)
          return (
            <div key={row} className="flex gap-2">
              {rowSeats.map(seat => (
                <div
                  key={seat.id}
                  title={seat.label}
                  className={cn(
                    'w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-bold',
                    seat.isDriver
                      ? 'bg-foreground border-foreground text-background'
                      : 'bg-transparent border-muted-foreground/40 text-muted-foreground',
                  )}
                >
                  {seat.isDriver ? '▲' : ''}
                </div>
              ))}
            </div>
          )
        })}
      </div>
      <p className="text-xs text-muted-foreground mt-3 text-center">
        {passengerCount} passenger seat{passengerCount !== 1 ? 's' : ''}
      </p>
    </div>
  )
}

export function VehicleForm() {
  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState(new Date().getFullYear().toString())
  const [color, setColor] = useState('')
  const [type, setType] = useState<VehicleType>('sedan')
  const [capacity, setCapacity] = useState(5)
  const [previewSeats, setPreviewSeats] = useState<Seat[]>(() => generateSeatTemplate('sedan', 5))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    setPreviewSeats(generateSeatTemplate(type, capacity))
  }, [type, capacity])

  useEffect(() => {
    setCapacity(c => Math.min(c, MAX_CAPACITY[type]))
  }, [type])

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

    const seatTemplate = generateSeatTemplate(type, capacity)

    const { data: existing } = await supabase
      .from('vehicles')
      .select('id')
      .eq('owner_id', user.id)

    const isDefault = !existing || existing.length === 0

    const { error } = await supabase.from('vehicles').insert({
      owner_id: user.id,
      make,
      model,
      year: parseInt(year),
      color,
      type,
      capacity,
      seat_template: seatTemplate,
      is_default: isDefault,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/profile/vehicles')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="make">Make</Label>
          <Input
            id="make"
            value={make}
            onChange={e => setMake(e.target.value)}
            placeholder="Toyota"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="model">Model</Label>
          <Input
            id="model"
            value={model}
            onChange={e => setModel(e.target.value)}
            placeholder="Camry"
            required
          />
        </div>
      </div>

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

      <div className="space-y-1.5">
        <Label htmlFor="capacity">Total seats (including driver)</Label>
        <Input
          id="capacity"
          type="number"
          value={capacity}
          onChange={e =>
            setCapacity(Math.max(2, Math.min(parseInt(e.target.value) || 2, MAX_CAPACITY[type])))
          }
          min={2}
          max={MAX_CAPACITY[type]}
          required
        />
      </div>

      <SeatPreview seats={previewSeats} />

      {error && <p className="text-sm text-red-400">{error}</p>}

      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? 'Saving…' : 'Save vehicle'}
      </Button>
    </form>
  )
}
