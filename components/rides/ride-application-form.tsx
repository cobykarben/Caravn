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
    id: string
    cost_per_person: number
    is_paid: boolean
    pickup_radius_miles: number | null
    seats: Seat[]
    accepted_count: number
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
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  const estimatedCost = ride.is_paid
    ? calculateCostShare(ride.cost_per_person, ride.accepted_count + 1)
    : 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (selectedIds.length === 0) return
    setLoading(true)
    setError(null)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not signed in'); setLoading(false); return }
    const { error: insertError } = await supabase.from('ride_applications').insert({
      ride_id: ride.id,
      rider_id: user.id,
      status: 'pending',
      seat_ids: selectedIds,
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
        <p className="text-sm font-medium mb-3">
          Select your seat{selectedIds.length > 1 ? 's' : ''}
        </p>
        <SeatMap seats={ride.seats} selectedSeatIds={selectedIds} onSeatToggle={toggleSeat} />
      </div>

      <div className="p-3 rounded-xl border border-border bg-card text-center">
        {ride.is_paid ? (
          <p className="text-sm">
            Estimated cost:{' '}
            <span className="font-semibold">${estimatedCost.toFixed(2)} / person</span>
            <span className="text-muted-foreground text-xs ml-1">(recalculated on acceptance)</span>
          </p>
        ) : (
          <p className="text-sm font-semibold text-green-400">Free ride</p>
        )}
      </div>

      {ride.pickup_radius_miles !== null && (
        <div className="space-y-1.5">
          <Label htmlFor="customPickup">
            Custom pickup address (within {ride.pickup_radius_miles} mi)
          </Label>
          <Input
            id="customPickup"
            value={customPickup}
            onChange={e => setCustomPickup(e.target.value)}
            placeholder="Your preferred pickup address"
          />
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="message">Message to driver (optional)</Label>
        <Textarea
          id="message"
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Hi, looking forward to this!"
          rows={2}
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={selectedIds.length === 0 || loading}
      >
        {loading ? 'Sending…' : `Request seat${selectedIds.length > 1 ? 's' : ''}`}
      </Button>
    </form>
  )
}
