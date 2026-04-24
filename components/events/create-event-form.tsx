'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

type SimilarEvent = {
  id: string
  name: string
  venue_name: string
  starts_at: string
  score: number
}

const CATEGORIES = ['concert', 'sports', 'festival', 'conference', 'other'] as const

export function CreateEventForm() {
  const [name, setName] = useState('')
  const [venueName, setVenueName] = useState('')
  const [venueAddress, setVenueAddress] = useState('')
  const [city, setCity] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [category, setCategory] = useState<typeof CATEGORIES[number]>('concert')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [similarEvents, setSimilarEvents] = useState<SimilarEvent[]>([])
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false)
  const router = useRouter()

  async function checkDuplicatesAndSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: similar } = await (supabase as any).rpc('find_similar_events', {
      p_name: name,
      p_venue: venueName,
      p_starts_at: startsAt,
    })

    if (similar && (similar as unknown[]).length > 0) {
      setSimilarEvents(similar as SimilarEvent[])
      setShowDuplicateDialog(true)
      setLoading(false)
      return
    }

    await createEvent()
  }

  async function createEvent() {
    setLoading(true)
    setShowDuplicateDialog(false)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('events')
      .insert({
        created_by: user.id,
        name,
        venue_name: venueName,
        venue_address: venueAddress,
        city,
        starts_at: startsAt,
        ends_at: endsAt,
        category,
        description: description || null,
      })
      .select('id')
      .single()

    if (error || !data) {
      setError(error?.message ?? 'Failed to create event')
      setLoading(false)
      return
    }

    const row = data as Record<string, unknown>
    router.push(`/events/${row['id']}`)
  }

  function useExistingEvent(id: string) {
    setShowDuplicateDialog(false)
    router.push(`/events/${id}`)
  }

  return (
    <>
      <form onSubmit={checkDuplicatesAndSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="name">Event name</Label>
          <Input
            id="name"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Taylor Swift — Eras Tour"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="venueName">Venue name</Label>
          <Input
            id="venueName"
            value={venueName}
            onChange={e => setVenueName(e.target.value)}
            placeholder="Wrigley Field"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="venueAddress">Venue address</Label>
          <Input
            id="venueAddress"
            value={venueAddress}
            onChange={e => setVenueAddress(e.target.value)}
            placeholder="1060 W Addison St"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={city}
            onChange={e => setCity(e.target.value)}
            placeholder="Chicago"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="startsAt">Start date & time</Label>
            <Input
              id="startsAt"
              type="datetime-local"
              value={startsAt}
              onChange={e => setStartsAt(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="endsAt">End date & time</Label>
            <Input
              id="endsAt"
              type="datetime-local"
              value={endsAt}
              onChange={e => setEndsAt(e.target.value)}
              min={startsAt}
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="category">Category</Label>
          <Select value={category} onValueChange={v => setCategory(v as typeof CATEGORIES[number])}>
            <SelectTrigger id="category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(c => (
                <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Description (optional)</Label>
          <Textarea
            id="description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Any details about the event…"
            rows={3}
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? 'Checking…' : 'Create event'}
        </Button>
      </form>

      <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Similar events found</DialogTitle>
            <DialogDescription>
              These events look similar to what you&apos;re adding. Use an existing one or create a new entry.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 my-2">
            {similarEvents.map(evt => (
              <button
                key={evt.id}
                onClick={() => useExistingEvent(evt.id)}
                className="w-full text-left p-3 rounded-lg border border-border hover:bg-muted transition-colors"
              >
                <p className="text-sm font-medium">{evt.name}</p>
                <p className="text-xs text-muted-foreground">{evt.venue_name}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(evt.starts_at).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                  })}
                </p>
              </button>
            ))}
          </div>

          <Button onClick={createEvent} variant="outline" className="w-full" disabled={loading}>
            {loading ? 'Creating…' : 'Create anyway'}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  )
}
