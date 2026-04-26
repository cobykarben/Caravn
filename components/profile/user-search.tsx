'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

type Result = {
  id: string
  full_name: string
  username: string
  avatar_url: string | null
}

type Props = {
  currentUserId: string
  existingFriendIds: string[]
  pendingIds: string[]
}

export function UserSearch({ currentUserId, existingFriendIds, pendingIds }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [sent, setSent] = useState<string[]>([])
  const supabase = createClient()

  useEffect(() => {
    if (query.length < 2) { setResults([]); return }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .ilike('username', `%${query}%`)
        .neq('id', currentUserId)
        .limit(8)
      setResults((data ?? []) as Result[])
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  async function sendRequest(addresseeId: string) {
    const { error } = await supabase.from('friendships').insert({
      requester_id: currentUserId,
      addressee_id: addresseeId,
      status: 'pending',
    })
    if (!error) setSent(prev => [...prev, addresseeId])
  }

  function statusFor(userId: string): 'friend' | 'pending' | 'none' {
    if (existingFriendIds.includes(userId)) return 'friend'
    if (pendingIds.includes(userId) || sent.includes(userId)) return 'pending'
    return 'none'
  }

  return (
    <div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by username…"
          className="pl-9"
        />
      </div>

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map(u => {
            const status = statusFor(u.id)
            return (
              <div
                key={u.id}
                className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border bg-card"
              >
                <div className="flex items-center gap-2.5">
                  <Avatar className="w-8 h-8">
                    {u.avatar_url && <AvatarImage src={u.avatar_url} />}
                    <AvatarFallback className="text-xs bg-muted">
                      {u.full_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold">{u.full_name}</p>
                    <p className="text-xs text-muted-foreground">@{u.username}</p>
                  </div>
                </div>
                {status === 'friend' && (
                  <span className="text-xs text-muted-foreground font-medium">Friends</span>
                )}
                {status === 'pending' && (
                  <span className="text-xs text-muted-foreground font-medium">Pending</span>
                )}
                {status === 'none' && (
                  <Button size="sm" variant="outline" onClick={() => sendRequest(u.id)}>
                    Add
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {query.length >= 2 && results.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">No users found.</p>
      )}
    </div>
  )
}
