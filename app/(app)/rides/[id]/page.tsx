import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { ChevronLeft, MessageCircle, Check, Clock, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { seatRecordToArray } from '@/lib/seat-templates'
import { RideApplicationForm } from '@/components/rides/ride-application-form'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Seat } from '@/lib/seat-templates'
import type { VehicleType } from '@/components/rides/vehicle-silhouettes'

export default async function RideDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ ref?: string }>
}) {
  const { id } = await params
  const { ref } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: rawRide } = await supabase
    .from('rides')
    .select(`
      id, status, departure_address, departure_time, return_time,
      cost_per_person, is_paid, notes, pickup_radius_miles, seat_map,
      driver_id,
      driver:profiles!driver_id(id, full_name, username, avatar_url),
      vehicle:vehicles!vehicle_id(make, model, year, color, type, capacity),
      event:events!event_id(id, name, venue_name, city, starts_at),
      ride_applications(
        id, status, seat_ids, cost_share, message,
        rider:profiles!rider_id(id, full_name, username, avatar_url)
      )
    `)
    .eq('id', id)
    .single()

  if (!rawRide) notFound()

  const ride = rawRide as unknown as {
    id: string
    status: string
    departure_address: string
    departure_time: string
    return_time: string | null
    cost_per_person: number
    is_paid: boolean
    notes: string | null
    pickup_radius_miles: number | null
    seat_map: Record<string, Seat>
    driver_id: string
    driver: { id: string; full_name: string; username: string; avatar_url: string | null } | null
    vehicle: { make: string; model: string; year: number; color: string; type: string; capacity: number } | null
    event: { id: string; name: string; venue_name: string; city: string; starts_at: string } | null
    ride_applications: Array<{
      id: string
      status: string
      seat_ids: string[]
      cost_share: number | null
      message: string | null
      rider: { id: string; full_name: string; username: string; avatar_url: string | null } | null
    }>
  }

  const isDriver = ride.driver_id === user.id
  const myApplication = (ride.ride_applications ?? []).find(
    (a: { rider: { id: string } | null }) => a.rider?.id === user.id
  )
  const isAccepted = myApplication?.status === 'accepted'
  const isPending = myApplication?.status === 'pending'

  const seats = seatRecordToArray(ride.seat_map as Record<string, Seat>)

  const acceptedApplications = (ride.ride_applications ?? []).filter(
    (a: { status: string }) => a.status === 'accepted'
  )
  const pendingApplications = (ride.ride_applications ?? []).filter(
    (a: { status: string }) => a.status === 'pending'
  )

  const { data: chatData } = await supabase
    .from('ride_chats')
    .select('id')
    .eq('ride_id', id)
    .single()

  const chatId = chatData?.id ?? null
  const canAccessChat = chatId && (isDriver || isAccepted)

  async function acceptApplication(formData: FormData) {
    'use server'
    const applicationId = formData.get('applicationId') as string
    const sb = await createClient()
    await sb
      .from('ride_applications')
      .update({ status: 'accepted' })
      .eq('id', applicationId)
    revalidatePath(`/rides/${id}`)
  }

  async function rejectApplication(formData: FormData) {
    'use server'
    const applicationId = formData.get('applicationId') as string
    const sb = await createClient()
    await sb
      .from('ride_applications')
      .update({ status: 'rejected' })
      .eq('id', applicationId)
    revalidatePath(`/rides/${id}`)
  }

  async function cancelRide(formData: FormData) {
    'use server'
    const rideId = formData.get('rideId') as string
    const sb = await createClient()
    await sb.from('rides').update({ status: 'cancelled' }).eq('id', rideId)
    revalidatePath(`/rides/${rideId}`)
  }

  const rideEvent = ride.event
  const driver = ride.driver
  const vehicle = ride.vehicle

  const departureStr = new Date(ride.departure_time).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })

  return (
    <div className="px-4 pt-6 pb-24">
      {/* Back + header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={ref === 'ai' ? '/ai' : (rideEvent ? `/events/${rideEvent.id}` : '/rides')}
          className="text-muted-foreground"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{rideEvent?.name ?? 'Ride'}</p>
          {rideEvent && (
            <p className="text-xs text-muted-foreground">
              {rideEvent.venue_name} · {rideEvent.city}
            </p>
          )}
        </div>
        {ride.status === 'full' && (
          <Badge variant="secondary" className="shrink-0">Full</Badge>
        )}
      </div>

      {/* Driver info */}
      {driver && (
        <div className="flex items-center gap-3 mb-5 p-4 rounded-xl border border-border bg-card">
          <Avatar className="w-10 h-10 shrink-0">
            {driver.avatar_url && <AvatarImage src={driver.avatar_url} />}
            <AvatarFallback className="bg-muted">{driver.full_name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold">{driver.full_name}</p>
            <p className="text-xs text-muted-foreground">@{driver.username} · Driver</p>
          </div>
        </div>
      )}

      {/* Trip details */}
      <div className="space-y-3 mb-6">
        <div className="p-4 rounded-xl border border-border bg-card space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Departs</span>
            <span className="font-medium">{departureStr}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Pickup</span>
            <span className="font-medium text-right max-w-[60%]">{ride.departure_address}</span>
          </div>
          {ride.pickup_radius_miles && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Flexible pickup</span>
              <span className="font-medium">within {ride.pickup_radius_miles} mi</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Cost</span>
            <span className="font-medium">
              {ride.is_paid
                ? `$${ride.cost_per_person.toFixed(2)} total · split equally`
                : <span className="text-green-400">Free</span>}
            </span>
          </div>
          {vehicle && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Vehicle</span>
              <span className="font-medium capitalize">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </span>
            </div>
          )}
        </div>

        {ride.notes && (
          <div className="p-4 rounded-xl border border-border bg-card">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Notes</p>
            <p className="text-sm">{ride.notes}</p>
          </div>
        )}
      </div>

      {/* Group chat link */}
      {canAccessChat && (
        <Link
          href={`/inbox/${chatId}`}
          className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card mb-6 hover:bg-muted transition-colors"
        >
          <MessageCircle className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-semibold">Group Chat</p>
            <p className="text-xs text-muted-foreground">Chat with your rideshare group</p>
          </div>
        </Link>
      )}

      {/* Driver view: pending applications */}
      {isDriver && (
        <div className="space-y-4">
          {pendingApplications.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                Pending Requests ({pendingApplications.length})
              </h2>
              <div className="space-y-3">
                {pendingApplications.map((app) => (
                  <div key={app.id} className="p-4 rounded-xl border border-border bg-card">
                    <div className="flex items-center gap-2.5 mb-3">
                      <Avatar className="w-8 h-8 shrink-0">
                        {app.rider?.avatar_url && <AvatarImage src={app.rider.avatar_url} />}
                        <AvatarFallback className="text-xs bg-muted">
                          {app.rider?.full_name?.charAt(0) ?? '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold">{app.rider?.full_name}</p>
                        <p className="text-xs text-muted-foreground">
                          @{app.rider?.username} · {app.seat_ids?.length ?? 1} seat{(app.seat_ids?.length ?? 1) !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    {app.message && (
                      <p className="text-xs text-muted-foreground italic mb-3 pl-1">"{app.message}"</p>
                    )}
                    <div className="flex gap-2">
                      <form action={acceptApplication} className="flex-1">
                        <input type="hidden" name="applicationId" value={app.id} />
                        <Button type="submit" size="sm" className="w-full gap-1.5">
                          <Check className="h-3.5 w-3.5" /> Accept
                        </Button>
                      </form>
                      <form action={rejectApplication} className="flex-1">
                        <input type="hidden" name="applicationId" value={app.id} />
                        <Button type="submit" size="sm" variant="outline" className="w-full gap-1.5">
                          <X className="h-3.5 w-3.5" /> Decline
                        </Button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {acceptedApplications.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                Riders ({acceptedApplications.length})
              </h2>
              <div className="space-y-2">
                {acceptedApplications.map((app) => (
                  <div key={app.id} className="flex items-center gap-2.5 p-3 rounded-xl border border-border bg-card">
                    <Avatar className="w-7 h-7 shrink-0">
                      {app.rider?.avatar_url && <AvatarImage src={app.rider.avatar_url} />}
                      <AvatarFallback className="text-[10px] bg-muted">
                        {app.rider?.full_name?.charAt(0) ?? '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{app.rider?.full_name}</p>
                      <p className="text-xs text-muted-foreground">@{app.rider?.username}</p>
                    </div>
                    {app.cost_share != null && app.cost_share > 0 && (
                      <span className="text-xs text-muted-foreground">${app.cost_share.toFixed(2)}</span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {pendingApplications.length === 0 && acceptedApplications.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">No applications yet.</p>
          )}

          {ride.status !== 'cancelled' && (
            <form action={cancelRide} className="pt-2">
              <input type="hidden" name="rideId" value={ride.id} />
              <Button type="submit" variant="outline" size="sm" className="w-full text-destructive border-destructive/30 hover:bg-destructive/10">
                Cancel Ride
              </Button>
            </form>
          )}
        </div>
      )}

      {/* Accepted rider view */}
      {!isDriver && isAccepted && (
        <div className="p-4 rounded-xl border border-green-500/30 bg-green-500/5">
          <div className="flex items-center gap-2 mb-2">
            <Check className="h-4 w-4 text-green-400" />
            <p className="text-sm font-semibold text-green-400">You're confirmed!</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Seats: {myApplication?.seat_ids?.join(', ')}
          </p>
          {myApplication?.cost_share != null && myApplication.cost_share > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Your share: ${myApplication.cost_share.toFixed(2)}
            </p>
          )}
        </div>
      )}

      {/* Pending rider view */}
      {!isDriver && isPending && (
        <div className="p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/5">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-yellow-500" />
            <p className="text-sm font-semibold text-yellow-500">Request pending</p>
          </div>
          <p className="text-xs text-muted-foreground">
            The driver will review your request soon.
          </p>
        </div>
      )}

      {/* Rejected or cancelled applicant view */}
      {!isDriver && myApplication && (myApplication.status === 'rejected' || myApplication.status === 'cancelled') && (
        <div className="p-4 rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 mb-1">
            <X className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-semibold text-muted-foreground">
              {myApplication.status === 'rejected' ? 'Request not accepted' : 'Request cancelled'}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            {myApplication.status === 'rejected'
              ? 'The driver didn\'t have space for your request.'
              : 'You cancelled your seat request for this ride.'}
          </p>
        </div>
      )}

      {/* Visitor: active ride — show application form */}
      {!isDriver && !myApplication && ride.status === 'active' && (
        <div>
          <h2 className="text-sm font-semibold mb-4">Request a seat</h2>
          <RideApplicationForm
            ride={{
              id: ride.id,
              cost_per_person: ride.cost_per_person,
              is_paid: ride.is_paid,
              pickup_radius_miles: ride.pickup_radius_miles,
              seats,
              accepted_count: acceptedApplications.length,
              vehicleType: (vehicle?.type ?? 'sedan') as VehicleType,
            }}
          />
        </div>
      )}

      {/* Visitor: full ride */}
      {!isDriver && !myApplication && ride.status === 'full' && (
        <div className="p-4 rounded-xl border border-border bg-card text-center py-8">
          <p className="text-sm font-semibold mb-1">This ride is full</p>
          <p className="text-xs text-muted-foreground">Check back later or find another ride.</p>
        </div>
      )}
    </div>
  )
}
