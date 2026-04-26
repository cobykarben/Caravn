import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { UserSearch } from '@/components/profile/user-search'
import { ChevronLeft } from 'lucide-react'

type Profile = {
  id: string
  full_name: string
  username: string
  avatar_url: string | null
}

export default async function FriendsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: incomingRaw } = await supabase
    .from('friendships')
    .select('id, requester:profiles!requester_id(id, full_name, username, avatar_url)')
    .eq('addressee_id', user.id)
    .eq('status', 'pending')

  const incoming = (incomingRaw ?? []) as unknown as Array<{
    id: string
    requester: Profile | null
  }>

  const { data: friendsRaw } = await supabase
    .from('friendships')
    .select(`
      id, requester_id, addressee_id,
      requester:profiles!requester_id(id, full_name, username, avatar_url),
      addressee:profiles!addressee_id(id, full_name, username, avatar_url)
    `)
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
    .eq('status', 'accepted')

  const friends = ((friendsRaw ?? []) as unknown as Array<{
    requester_id: string
    requester: Profile | null
    addressee: Profile | null
  }>)
    .map(f => (f.requester_id === user.id ? f.addressee : f.requester))
    .filter(Boolean) as Profile[]

  const { data: outgoingRaw } = await supabase
    .from('friendships')
    .select('addressee_id')
    .eq('requester_id', user.id)
    .eq('status', 'pending')

  const pendingIds = (outgoingRaw ?? []).map(r => r.addressee_id as string)
  const friendIds = friends.map(f => f.id)

  async function acceptRequest(formData: FormData) {
    'use server'
    const friendshipId = formData.get('friendshipId') as string
    const sb = await createClient()
    await sb.from('friendships').update({ status: 'accepted' }).eq('id', friendshipId)
    revalidatePath('/profile/friends')
  }

  async function declineRequest(formData: FormData) {
    'use server'
    const friendshipId = formData.get('friendshipId') as string
    const sb = await createClient()
    await sb.from('friendships').update({ status: 'rejected' }).eq('id', friendshipId)
    revalidatePath('/profile/friends')
  }

  return (
    <div className="px-4 pt-6 pb-10">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/profile" className="text-muted-foreground">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">Friends</h1>
      </div>

      {incoming.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Requests ({incoming.length})
          </h2>
          <div className="space-y-3">
            {incoming.map(req => (
              <div
                key={req.id}
                className="flex items-center justify-between gap-3 p-4 rounded-xl border border-border bg-card"
              >
                <div className="flex items-center gap-2.5">
                  <Avatar className="w-9 h-9">
                    {req.requester?.avatar_url && (
                      <AvatarImage src={req.requester.avatar_url} />
                    )}
                    <AvatarFallback className="text-sm bg-muted">
                      {req.requester?.full_name?.charAt(0) ?? '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold">{req.requester?.full_name}</p>
                    <p className="text-xs text-muted-foreground">@{req.requester?.username}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <form action={acceptRequest}>
                    <input type="hidden" name="friendshipId" value={req.id} />
                    <Button type="submit" size="sm">Accept</Button>
                  </form>
                  <form action={declineRequest}>
                    <input type="hidden" name="friendshipId" value={req.id} />
                    <Button type="submit" size="sm" variant="outline">Decline</Button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mb-8">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Friends ({friends.length})
        </h2>
        {friends.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No friends yet. Search below to add some.
          </p>
        ) : (
          <div className="space-y-2">
            {friends.map(f => (
              <div
                key={f.id}
                className="flex items-center gap-2.5 p-3 rounded-xl border border-border bg-card"
              >
                <Avatar className="w-8 h-8">
                  {f.avatar_url && <AvatarImage src={f.avatar_url} />}
                  <AvatarFallback className="text-xs bg-muted">
                    {f.full_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold">{f.full_name}</p>
                  <p className="text-xs text-muted-foreground">@{f.username}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Find Friends
        </h2>
        <UserSearch
          currentUserId={user.id}
          existingFriendIds={friendIds}
          pendingIds={pendingIds}
        />
      </section>
    </div>
  )
}
