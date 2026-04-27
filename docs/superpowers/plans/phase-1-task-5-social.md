# Phase 1 · Tasks 14–15: Group Messaging + Friends

**Status: ⬜ All pending**

**Prerequisites:** Tasks 10–13 (Seat Map + Rides) must be complete first.

**Next prompt to run:**
> "Read `docs/superpowers/plans/phase-1-task-5-social.md` only. Implement Task 14: Group Messaging. Follow the TDD steps exactly."

---

## Task 14: Group Messaging (Inbox + Chat View) ⬜

### Objective

Build the full group messaging flow: an inbox listing all ride chats the user is a member of, and a real-time chat view using Supabase Realtime `postgres_changes`. Chats are auto-created by the `handle_ride_published` DB trigger — no manual creation needed.

### Files

| File | Action |
|------|--------|
| `app/(app)/inbox/page.tsx` | Replace stub |
| `app/(app)/inbox/[chatId]/page.tsx` | Create |
| `components/messaging/chat-list-item.tsx` | Create |
| `components/messaging/chat-view.tsx` | Create |
| `components/messaging/__tests__/chat-list-item.test.tsx` | Create (5 tests) |
| `components/messaging/__tests__/chat-view.test.tsx` | Create (6 tests) |

---

### Step 1: ChatListItem — failing tests

Create `components/messaging/__tests__/chat-list-item.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ChatListItem } from '../chat-list-item'

const chat = {
  id: 'chat-1',
  ride: {
    id: 'ride-1',
    departure_time: '2026-07-15T17:00:00Z',
    event: { name: 'Taylor Swift — Eras Tour' },
  },
  lastMessage: {
    content: 'See everyone at the north gate!',
    sender_name: 'Dana',
    created_at: '2026-07-10T12:00:00Z',
  },
}

describe('ChatListItem', () => {
  it('renders the event name', () => {
    render(<ChatListItem chat={chat} />)
    expect(screen.getByText('Taylor Swift — Eras Tour')).toBeInTheDocument()
  })

  it('renders a preview of the last message', () => {
    render(<ChatListItem chat={chat} />)
    expect(screen.getByText(/See everyone at the north gate!/)).toBeInTheDocument()
  })

  it('renders sender name prefix in last message', () => {
    render(<ChatListItem chat={chat} />)
    expect(screen.getByText(/Dana:/)).toBeInTheDocument()
  })

  it('renders "No messages yet" when lastMessage is null', () => {
    render(<ChatListItem chat={{ ...chat, lastMessage: null }} />)
    expect(screen.getByText(/No messages yet/)).toBeInTheDocument()
  })

  it('links to the chat detail page', () => {
    render(<ChatListItem chat={chat} />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/inbox/chat-1')
  })
})
```

Run: `npm run test:run components/messaging/__tests__/chat-list-item.test.tsx` — expect FAIL.

---

### Step 2: ChatListItem implementation

Create `components/messaging/chat-list-item.tsx`:

```typescript
import Link from 'next/link'
import { MessageCircle } from 'lucide-react'

type Props = {
  chat: {
    id: string
    ride: { id: string; departure_time: string; event: { name: string } }
    lastMessage: { content: string; sender_name: string; created_at: string } | null
  }
}

export function ChatListItem({ chat }: Props) {
  const dateStr = new Date(chat.ride.departure_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return (
    <Link href={`/inbox/${chat.id}`} className="flex items-start gap-3 p-4 border-b border-border hover:bg-muted/50 transition-colors">
      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
        <MessageCircle className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2 mb-0.5">
          <p className="text-sm font-semibold truncate">{chat.ride.event.name}</p>
          <p className="text-xs text-muted-foreground shrink-0">{dateStr}</p>
        </div>
        {chat.lastMessage ? (
          <p className="text-xs text-muted-foreground truncate">
            <span className="font-medium text-foreground/70">{chat.lastMessage.sender_name}:</span>{' '}
            {chat.lastMessage.content}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground italic">No messages yet</p>
        )}
      </div>
    </Link>
  )
}
```

Run tests — expect PASS (5 tests).

---

### Step 3: ChatView — failing tests

Create `components/messaging/__tests__/chat-view.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { ChatView } from '../chat-view'

const messages = [
  { id: 'm1', content: 'Hello everyone!', created_at: '2026-07-10T10:00:00Z',
    sender: { id: 'u2', full_name: 'Dana', avatar_url: null } },
  { id: 'm2', content: "Can't wait for the show", created_at: '2026-07-10T10:01:00Z',
    sender: { id: 'u3', full_name: 'Ray', avatar_url: null } },
]

const mockChannel = { on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() }

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: null }),
      then: (cb: any) => Promise.resolve(cb({ data: messages, error: null })),
    })),
    channel: vi.fn(() => mockChannel),
    removeChannel: vi.fn(),
  })),
}))

describe('ChatView', () => {
  it('renders the chat container', () => {
    render(<ChatView chatId="chat-1" currentUserId="u1" initialMessages={messages} />)
    expect(screen.getByRole('log')).toBeInTheDocument()
  })

  it('renders initial messages', () => {
    render(<ChatView chatId="chat-1" currentUserId="u1" initialMessages={messages} />)
    expect(screen.getByText('Hello everyone!')).toBeInTheDocument()
    expect(screen.getByText("Can't wait for the show")).toBeInTheDocument()
  })

  it('renders sender names', () => {
    render(<ChatView chatId="chat-1" currentUserId="u1" initialMessages={messages} />)
    expect(screen.getByText('Dana')).toBeInTheDocument()
    expect(screen.getByText('Ray')).toBeInTheDocument()
  })

  it('renders the message input and send button', () => {
    render(<ChatView chatId="chat-1" currentUserId="u1" initialMessages={messages} />)
    expect(screen.getByPlaceholderText(/message/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument()
  })

  it('send button is disabled when input is empty', () => {
    render(<ChatView chatId="chat-1" currentUserId="u1" initialMessages={messages} />)
    expect(screen.getByRole('button', { name: /send/i })).toBeDisabled()
  })

  it('send button is enabled after typing a message', async () => {
    const user = userEvent.setup()
    render(<ChatView chatId="chat-1" currentUserId="u1" initialMessages={messages} />)
    await user.type(screen.getByPlaceholderText(/message/i), 'Hello!')
    expect(screen.getByRole('button', { name: /send/i })).not.toBeDisabled()
  })
})
```

Run: `npm run test:run components/messaging/__tests__/chat-view.test.tsx` — expect FAIL.

---

### Step 4: ChatView implementation

Create `components/messaging/chat-view.tsx`:

```typescript
'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Send } from 'lucide-react'

type Message = {
  id: string; content: string; created_at: string
  sender: { id: string; full_name: string; avatar_url: string | null }
}

type Props = { chatId: string; currentUserId: string; initialMessages: Message[] }

export function ChatView({ chatId, currentUserId, initialMessages }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  useEffect(() => {
    const channel = supabase
      .channel(`chat-${chatId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
        async payload => {
          const { data } = await supabase
            .from('messages')
            .select('id, content, created_at, sender:profiles!sender_id(id, full_name, avatar_url)')
            .eq('id', (payload.new as { id: string }).id)
            .single()
          if (data) setMessages(prev => [...prev, data as Message])
        })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [chatId])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    const content = text.trim()
    if (!content) return
    setSending(true); setText('')
    await supabase.from('messages').insert({ chat_id: chatId, sender_id: currentUserId, content })
    setSending(false)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div role="log" className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map(msg => {
          const isOwn = msg.sender.id === currentUserId
          return (
            <div key={msg.id} className={cn('flex gap-2.5', isOwn ? 'flex-row-reverse' : 'flex-row')}>
              {!isOwn && (
                <Avatar className="w-7 h-7 shrink-0 mt-0.5">
                  {msg.sender.avatar_url && <AvatarImage src={msg.sender.avatar_url} />}
                  <AvatarFallback className="text-[10px] bg-muted">{msg.sender.full_name.charAt(0)}</AvatarFallback>
                </Avatar>
              )}
              <div className={cn('max-w-[75%]', isOwn ? 'items-end' : 'items-start')}>
                {!isOwn && <p className="text-[10px] text-muted-foreground mb-1 ml-1">{msg.sender.full_name}</p>}
                <div className={cn('px-3 py-2 rounded-2xl text-sm',
                  isOwn ? 'bg-foreground text-background rounded-tr-sm' : 'bg-muted text-foreground rounded-tl-sm')}>
                  {msg.content}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 mx-1">
                  {new Date(msg.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={sendMessage} className="flex gap-2 px-4 py-3 border-t border-border bg-background">
        <Input value={text} onChange={e => setText(e.target.value)} placeholder="Message…" className="flex-1" autoComplete="off" />
        <Button type="submit" size="icon" disabled={!text.trim() || sending} aria-label="Send">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
```

Run tests — expect PASS (6 tests).

---

### Step 5: Inbox page

Replace `app/(app)/inbox/page.tsx`:

```typescript
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ChatListItem } from '@/components/messaging/chat-list-item'

export default async function InboxPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: memberships } = await supabase
    .from('ride_chat_members')
    .select(`chat:ride_chats!chat_id(id,
      ride:rides!ride_id(id, departure_time, event:events!event_id(name)),
      messages(id, content, created_at, sender:profiles!sender_id(full_name)))`)
    .eq('user_id', user.id)

  type RawChat = {
    id: string
    ride: { id: string; departure_time: string; event: { name: string } } | null
    messages: Array<{ id: string; content: string; created_at: string; sender: { full_name: string } | null }> | null
  }

  const chats = (memberships ?? [])
    .map(m => m.chat as RawChat | null)
    .filter(Boolean)
    .map(chat => {
      const msgs = (chat!.messages ?? []).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      const last = msgs[0] ?? null
      return {
        id: chat!.id,
        ride: chat!.ride!,
        lastMessage: last ? { content: last.content, sender_name: last.sender?.full_name ?? 'Someone', created_at: last.created_at } : null,
      }
    })
    .filter(c => c.ride)
    .sort((a, b) => {
      const aTime = a.lastMessage?.created_at ?? a.ride.departure_time
      const bTime = b.lastMessage?.created_at ?? b.ride.departure_time
      return new Date(bTime).getTime() - new Date(aTime).getTime()
    })

  return (
    <div className="pt-6">
      <h1 className="text-2xl font-bold px-4 mb-4">Inbox</h1>
      {chats.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-muted-foreground">No chats yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Chats appear here once you join a ride.</p>
        </div>
      ) : (
        <div>{chats.map(chat => <ChatListItem key={chat.id} chat={chat as any} />)}</div>
      )}
    </div>
  )
}
```

---

### Step 6: Chat detail page

Create `app/(app)/inbox/[chatId]/page.tsx`:

```typescript
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ChatView } from '@/components/messaging/chat-view'

export default async function ChatPage({ params }: { params: Promise<{ chatId: string }> }) {
  const { chatId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('ride_chat_members').select('chat_id').eq('chat_id', chatId).eq('user_id', user.id).single()
  if (!membership) notFound()

  const { data: chat } = await supabase
    .from('ride_chats')
    .select('id, ride:rides!ride_id(id, departure_time, event:events!event_id(name))')
    .eq('id', chatId).single()
  if (!chat) notFound()

  const { data: rawMessages } = await supabase
    .from('messages')
    .select('id, content, created_at, sender:profiles!sender_id(id, full_name, avatar_url)')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: false })
    .limit(50)

  const messages = (rawMessages ?? []).reverse()
  const ride = (chat as any).ride
  const eventName = ride?.event?.name ?? 'Ride Chat'
  const departureStr = ride?.departure_time
    ? new Date(ride.departure_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : ''

  return (
    <div className="flex flex-col h-screen">
      <div className="flex items-center gap-3 px-4 pt-5 pb-3 border-b border-border shrink-0">
        <Link href="/inbox" className="text-muted-foreground"><ChevronLeft className="h-5 w-5" /></Link>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{eventName}</p>
          {departureStr && <p className="text-xs text-muted-foreground">{departureStr}</p>}
        </div>
      </div>
      <ChatView chatId={chatId} currentUserId={user.id} initialMessages={messages as any} />
    </div>
  )
}
```

---

### Step 7: Verify & Commit

```bash
npm run test:run
npm run build
git add app/(app)/inbox/ components/messaging/
git commit -m "feat: group messaging — inbox chat list and real-time chat view"
```

### Acceptance Criteria

- [ ] 5 ChatListItem tests pass
- [ ] 6 ChatView tests pass
- [ ] `npm run build` has zero TypeScript errors

---

## Task 15: Friends System ⬜

**Next prompt to run (after Task 14):**
> "Read `docs/superpowers/plans/phase-1-task-5-social.md` only. Implement Task 15: Friends System."

### Objective

Send/accept friend requests, view friends list, search for users. Friendships are bidirectional in the DB (stored as requester→addressee). The friends page handles incoming requests (server actions), friends list (either direction), and a `<UserSearch>` client component.

### Files

| File | Action |
|------|--------|
| `app/(app)/profile/friends/page.tsx` | Create |
| `components/profile/user-search.tsx` | Create |
| `components/profile/__tests__/user-search.test.tsx` | Create (6 tests) |

---

### Step 1: UserSearch — failing tests

Create `components/profile/__tests__/user-search.test.tsx`:

```typescript
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { UserSearch } from '../user-search'

const mockUser = { id: 'u2', full_name: 'Ray Rider', username: 'rayrider', avatar_url: null }

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
    from: vi.fn((table: string) => {
      const chain: Record<string, unknown> = {}
      const methods = ['select','eq','neq','ilike','or','limit','insert','single']
      methods.forEach(m => { chain[m] = vi.fn(() => chain) })
      if (table === 'profiles') {
        Object.assign(chain, { then: (cb: any) => Promise.resolve(cb({ data: [mockUser], error: null })) })
      } else {
        Object.assign(chain, { then: (cb: any) => Promise.resolve(cb({ data: null, error: null })) })
        chain['insert'] = vi.fn(() => ({ then: (cb: any) => Promise.resolve(cb({ error: null })) }))
      }
      return chain
    }),
  })),
}))

describe('UserSearch', () => {
  it('renders a search input', () => {
    render(<UserSearch currentUserId="u1" existingFriendIds={[]} pendingIds={[]} />)
    expect(screen.getByPlaceholderText(/search by username/i)).toBeInTheDocument()
  })

  it('shows no results before typing', () => {
    render(<UserSearch currentUserId="u1" existingFriendIds={[]} pendingIds={[]} />)
    expect(screen.queryByText('Ray Rider')).not.toBeInTheDocument()
  })

  it('displays results after typing 2+ characters', async () => {
    const user = userEvent.setup()
    render(<UserSearch currentUserId="u1" existingFriendIds={[]} pendingIds={[]} />)
    await user.type(screen.getByPlaceholderText(/search by username/i), 'ray')
    await waitFor(() => expect(screen.getByText('Ray Rider')).toBeInTheDocument())
  })

  it('shows Add button for users who are not yet friends', async () => {
    const user = userEvent.setup()
    render(<UserSearch currentUserId="u1" existingFriendIds={[]} pendingIds={[]} />)
    await user.type(screen.getByPlaceholderText(/search by username/i), 'ray')
    await waitFor(() => expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument())
  })

  it('shows Friends label instead of Add button for existing friends', async () => {
    const user = userEvent.setup()
    render(<UserSearch currentUserId="u1" existingFriendIds={['u2']} pendingIds={[]} />)
    await user.type(screen.getByPlaceholderText(/search by username/i), 'ray')
    await waitFor(() => expect(screen.getByText('Friends')).toBeInTheDocument())
    expect(screen.queryByRole('button', { name: /add/i })).not.toBeInTheDocument()
  })

  it('shows Pending label for already-requested users', async () => {
    const user = userEvent.setup()
    render(<UserSearch currentUserId="u1" existingFriendIds={[]} pendingIds={['u2']} />)
    await user.type(screen.getByPlaceholderText(/search by username/i), 'ray')
    await waitFor(() => expect(screen.getByText('Pending')).toBeInTheDocument())
  })
})
```

Run: `npm run test:run components/profile/__tests__/user-search.test.tsx` — expect FAIL.

---

### Step 2: UserSearch implementation

Create `components/profile/user-search.tsx`:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

type Result = { id: string; full_name: string; username: string; avatar_url: string | null }
type Props = { currentUserId: string; existingFriendIds: string[]; pendingIds: string[] }

export function UserSearch({ currentUserId, existingFriendIds, pendingIds }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [sent, setSent] = useState<string[]>([])
  const supabase = createClient()

  useEffect(() => {
    if (query.length < 2) { setResults([]); return }
    const timer = setTimeout(async () => {
      const { data } = await supabase.from('profiles')
        .select('id, full_name, username, avatar_url')
        .ilike('username', `%${query}%`)
        .neq('id', currentUserId)
        .limit(8)
      setResults(data ?? [])
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  async function sendRequest(addresseeId: string) {
    const { error } = await supabase.from('friendships').insert({
      requester_id: currentUserId, addressee_id: addresseeId, status: 'pending',
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
        <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by username…" className="pl-9" />
      </div>
      {results.length > 0 && (
        <div className="space-y-2">
          {results.map(u => {
            const status = statusFor(u.id)
            return (
              <div key={u.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border bg-card">
                <div className="flex items-center gap-2.5">
                  <Avatar className="w-8 h-8">
                    {u.avatar_url && <AvatarImage src={u.avatar_url} />}
                    <AvatarFallback className="text-xs bg-muted">{u.full_name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold">{u.full_name}</p>
                    <p className="text-xs text-muted-foreground">@{u.username}</p>
                  </div>
                </div>
                {status === 'friend' && <span className="text-xs text-muted-foreground font-medium">Friends</span>}
                {status === 'pending' && <span className="text-xs text-muted-foreground font-medium">Pending</span>}
                {status === 'none' && <Button size="sm" variant="outline" onClick={() => sendRequest(u.id)}>Add</Button>}
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
```

Run tests — expect PASS (6 tests).

---

### Step 3: Friends page

Create `app/(app)/profile/friends/page.tsx`:

```typescript
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { UserSearch } from '@/components/profile/user-search'
import { ChevronLeft } from 'lucide-react'

export default async function FriendsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: incomingRaw } = await supabase
    .from('friendships')
    .select('id, requester:profiles!requester_id(id, full_name, username, avatar_url)')
    .eq('addressee_id', user.id).eq('status', 'pending')

  const incoming = (incomingRaw ?? []) as Array<{
    id: string
    requester: { id: string; full_name: string; username: string; avatar_url: string | null } | null
  }>

  const { data: friendsRaw } = await supabase
    .from('friendships')
    .select('id, requester_id, addressee_id, requester:profiles!requester_id(id, full_name, username, avatar_url), addressee:profiles!addressee_id(id, full_name, username, avatar_url)')
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
    .eq('status', 'accepted')

  const friends = (friendsRaw ?? []).map(f => {
    const isRequester = (f as any).requester_id === user.id
    return isRequester ? (f as any).addressee : (f as any).requester
  }).filter(Boolean) as Array<{ id: string; full_name: string; username: string; avatar_url: string | null }>

  const { data: outgoingRaw } = await supabase
    .from('friendships').select('addressee_id').eq('requester_id', user.id).eq('status', 'pending')

  const pendingIds = (outgoingRaw ?? []).map(r => r.addressee_id)
  const friendIds  = friends.map(f => f.id)

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
        <Link href="/profile" className="text-muted-foreground"><ChevronLeft className="h-5 w-5" /></Link>
        <h1 className="text-2xl font-bold">Friends</h1>
      </div>

      {incoming.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Requests ({incoming.length})</h2>
          <div className="space-y-3">
            {incoming.map(req => (
              <div key={req.id} className="flex items-center justify-between gap-3 p-4 rounded-xl border border-border bg-card">
                <div className="flex items-center gap-2.5">
                  <Avatar className="w-9 h-9">
                    {req.requester?.avatar_url && <AvatarImage src={req.requester.avatar_url} />}
                    <AvatarFallback className="text-sm bg-muted">{req.requester?.full_name?.charAt(0) ?? '?'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold">{req.requester?.full_name}</p>
                    <p className="text-xs text-muted-foreground">@{req.requester?.username}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <form action={acceptRequest}><input type="hidden" name="friendshipId" value={req.id} /><Button type="submit" size="sm">Accept</Button></form>
                  <form action={declineRequest}><input type="hidden" name="friendshipId" value={req.id} /><Button type="submit" size="sm" variant="outline">Decline</Button></form>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mb-8">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Friends ({friends.length})</h2>
        {friends.length === 0 ? (
          <p className="text-sm text-muted-foreground">No friends yet. Search below to add some.</p>
        ) : (
          <div className="space-y-2">
            {friends.map(f => (
              <div key={f.id} className="flex items-center gap-2.5 p-3 rounded-xl border border-border bg-card">
                <Avatar className="w-8 h-8">
                  {f.avatar_url && <AvatarImage src={f.avatar_url} />}
                  <AvatarFallback className="text-xs bg-muted">{f.full_name.charAt(0)}</AvatarFallback>
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
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Find Friends</h2>
        <UserSearch currentUserId={user.id} existingFriendIds={friendIds} pendingIds={pendingIds} />
      </section>
    </div>
  )
}
```

---

### Step 4: Verify & Commit

```bash
npm run test:run
npm run build
git add app/(app)/profile/friends/ components/profile/user-search.tsx components/profile/__tests__/user-search.test.tsx
git commit -m "feat: friends system — send/accept requests, friends list, user search"
```

### Acceptance Criteria

- [ ] 6 UserSearch tests pass
- [ ] `npm run build` has zero TypeScript errors
- [ ] Friends page server actions work (accept/decline via form submit)

---

## Phase 1 Complete! 🎉

After Task 15 all 15 tasks are done. The full MVP is functional:

| # | Feature |
|---|---------|
| 1–5 | Setup, DB, Auth, App Shell, Utilities |
| 6 | Profile + phone verification |
| 7–8 | Events directory + detail + create |
| 9–10 | Vehicle registration + interactive seat map |
| 11–13 | 4-step ride wizard + detail + My Rides |
| 14 | Group messaging with Supabase Realtime |
| 15 | Friends — send/accept requests |
