# Phase 1 — AI Features Plan

## Overview

A conversational AI interface that replaces the FAB (floating action button) as the primary way users create and find rides. Users type naturally ("make a ride for the Giants game tonight", "find me rides to Drake from the upper west side") and the AI handles event lookup, prefills ride details, confirms with the user, and posts or applies — all within a single chat thread.

**AI provider:** Claude (Anthropic) via `@anthropic-ai/sdk`
**Model:** `claude-sonnet-4-6` with prompt caching on the system prompt

---

## What Changes vs Phase 1

| Before | After |
|--------|-------|
| `app/page.tsx` → `redirect('/events')` | `redirect('/ai')` |
| FAB center button opens "Find / Post" sheet | FAB replaced by AI nav button → `/ai` |
| Rides created via 4-step wizard | Rides created via AI conversation |
| Rides found by browsing event → rides list | Rides found via AI conversation |

The `/events`, `/rides`, `/inbox`, and `/profile` pages remain fully functional — they're still in the bottom nav. AI is the default entry point, not the only one.

---

## Architecture

### 1. API Route — `app/api/ai/chat/route.ts`

A streaming POST route. Receives `{ messages, userId }`, calls Claude with tools, and streams the response back using the Vercel AI SDK pattern (or raw SSE).

```
POST /api/ai/chat
Body: { messages: Message[], userId: string }
Response: text/event-stream (streaming)
```

**System prompt (cached with `cache_control: ephemeral`):**
```
You are Caravn's AI assistant — a concise, friendly helper for event ride-sharing.
You help users create rides to events and find rides from other drivers.

Rules:
- ALWAYS call search_events before confirming an event. Never assume.
- ALWAYS call get_user_profile before prefilling ride details.
- ALWAYS show a summary and ask for confirmation before calling create_ride.
- Keep responses short and mobile-friendly.
- When showing rides, present the top 3 inline. Offer "see all" to navigate to the event page.
- Never make up event names, venues, or times. Use only what the tools return.
```

### 2. Tool Definitions — `lib/ai/tools.ts`

Five tools Claude can call:

| Tool | Purpose | Key inputs |
|------|---------|-----------|
| `search_events` | Fuzzy-search events in DB | `query: string`, `date?: string` |
| `get_user_profile` | Get user's vehicles + profile address | `user_id: string` |
| `find_rides` | Get rides for an event, ranked by proximity | `event_id: string`, `lat?: number`, `lng?: number` |
| `create_ride` | Insert a ride row (status: active) | All ride fields |
| `apply_to_ride` | Insert a ride_application row (status: pending) | `ride_id`, `seat_ids[]`, optional `message` |

### 3. Tool Handlers — `lib/ai/tool-handlers.ts`

Server-side functions that execute the actual Supabase queries for each tool. Uses the service role client (not user client) so they can bypass RLS where needed. Returns structured JSON the AI reads.

`search_events`: Queries `events` table with `ilike` on name + venue + city. Also calls `find_similar_events` RPC for fuzzy match. Returns top 5 with id, name, venue, city, starts_at.

`get_user_profile`: Returns user's full_name, default vehicle (make/model/year/color/capacity/seat_template), and any saved departure address from their profile.

`find_rides`: Queries active/full rides for the event. If lat/lng provided, sorts by haversine distance from user's location using the existing `haversineDistance` utility. Returns top 10 with driver name, departure address, time, cost, available seat count, distance (if location known).

`create_ride`: Calls `supabase.from('rides').insert(...)` with `status: 'active'`. Uses `seatMapToRecord` to convert the vehicle's seat_template. Returns the new ride ID and a link to `/rides/[id]`.

`apply_to_ride`: Calls `supabase.from('ride_applications').insert(...)`. Returns confirmation.

### 4. Location Parsing

For ride finding, Claude extracts location from user text ("from upper west side" → geocode or known NYC neighborhood coordinates). For Phase 1, use a simple lookup table of common neighborhoods/landmarks → lat/lng in the tool handler. If no location in text, fall back to the user's profile departure address (if set), otherwise find all rides for the event unsorted.

---

## UI Changes

### Bottom Nav — `components/layout/bottom-nav.tsx`

Replace the center gap (where FAB sat) with a real nav item:

```
Events  |  Rides  |  [AI ✦]  |  Inbox  |  Profile
```

The center item links to `/ai`, uses a sparkle/stars icon (Lucide `Sparkles`), and has the same active-state treatment as the other tabs.

### FAB — `components/layout/fab.tsx`

Delete this file entirely (or keep as dead code). The bottom sheet ("Find a Ride / Post a Ride") is removed. All ride creation/finding goes through AI.

### App Root — `app/page.tsx`

```typescript
redirect('/ai')
```

### New AI Page — `app/(app)/ai/page.tsx`

Server component. Gets the user (for userId). Renders `<AIChat userId={user.id} />` wrapped in a `<Suspense>`.

---

## Components

### `components/ai/ai-chat.tsx`

Client component. The main chat interface.

**State:**
- `messages: UIMessage[]` — conversation history displayed
- `apiMessages: APIMessage[]` — full history sent to API (includes tool calls/results)
- `input: string`
- `loading: boolean`

**Layout:**
```
┌─────────────────────────────┐
│  Caravn AI              [×] │  ← header with clear button
├─────────────────────────────┤
│                             │
│  [message bubbles]          │  ← scrollable
│                             │
├─────────────────────────────┤
│  [input]           [Send ▶] │  ← fixed bottom
└─────────────────────────────┘
```

Greeting on empty state: "Hey, where are you headed? I can find or create a ride for any event."

On submit: appends user message, calls `POST /api/ai/chat` with stream, appends AI response tokens as they arrive. After full response, checks for any tool-driven "action" blocks in the message (see Rich Cards below).

### `components/ai/ai-message.tsx`

Renders a single message. User messages: right-aligned, foreground background. AI messages: left-aligned, muted background. Supports rendering rich cards embedded in the message payload.

### `components/ai/event-result-card.tsx`

Inline event card shown when AI presents an event match. Shows: event name, venue, city, date/time, and a "That's the one" / "Not this one" button pair. Tapping "That's the one" appends a user message "yes" automatically.

### `components/ai/ride-suggestion-card.tsx`

Inline ride card in AI messages during ride finding. Shows: driver avatar + name, departure address, time, available seats, cost, distance (if known). Has an "Apply" button that triggers `apply_to_ride` tool call and a "Details" link to `/rides/[id]`.

### `components/ai/ride-preview-card.tsx`

Shown at the confirmation step during ride creation. Displays all the ride details the AI has collected. Has "Post it" and "Edit" buttons. "Post it" appends "confirm" to the conversation and triggers the `create_ride` tool call. "Edit" clears the pending confirmation.

---

## Conversation Flows

### Flow A — Create a Ride

```
User:  "make a ride for the giants game tonight"
AI:    [calls search_events("giants game tonight")]
AI:    "Found NY Giants vs Cowboys at MetLife Stadium, tonight at 8:25 PM.
        Is that the one?"
       [EventResultCard with confirm/reject]

User:  [taps "That's the one"]
AI:    [calls get_user_profile(userId)]
AI:    "Got it. I've prefilled what I know:
        • Vehicle: 2022 Toyota Camry — 4 open seats
        • Pickup: 185th & Broadway (your profile address)
        What time do you want to leave?"

User:  "around 5"
AI:    "Here's the full ride before I post it:"
       [RidePreviewCard: Giants game · MetLife · Toyota Camry · 5:00 PM · 4 seats · Free]
       "Tap 'Post it' to confirm."

User:  [taps "Post it"]
AI:    [calls create_ride(...)]
AI:    "Done! Your ride is posted. Tap here to view it → /rides/abc123"
```

### Flow B — Find a Ride

```
User:  "find me rides to drake from the upper west side"
AI:    [calls search_events("drake concert")]
AI:    "Found Drake at Madison Square Garden, Fri Apr 29 at 8 PM.
        That the one?"
       [EventResultCard]

User:  [taps "That's the one"]
AI:    [calls find_rides(event_id, lat=40.786, lng=-73.975)]
AI:    "Here are the best rides near you:"
       [RideSuggestionCard #1 — 0.3 mi · 6:15 PM · 2 seats · Free]
       [RideSuggestionCard #2 — 0.8 mi · 6:30 PM · 1 seat · $20]
       [RideSuggestionCard #3 — 1.2 mi · 6:00 PM · 3 seats · Free]
       "Or [see all rides to this event →]"

User:  [taps Apply on card #1]
AI:    [calls apply_to_ride(ride_id, seat_ids=["r0s1"])]
AI:    "Request sent! The driver will review it. You'll see it in My Rides."
```

### Fallback / Ambiguous Input

```
User:  "giants game"
AI:    [calls search_events("giants game")]
       → returns NY Giants (NFL) AND SF Giants (MLB) results
AI:    "Found a couple options:"
       [EventResultCard for each]
       "Which one did you mean?"
```

---

## Environment Variables

Add to `.env.local.example`:
```
ANTHROPIC_API_KEY=your_key_here
```

---

## Task List (Implementation Order)

### Task AI-1: API infrastructure
**Files to create:**
- `lib/ai/tools.ts` — Claude tool definitions (TypeScript objects matching Anthropic SDK format)
- `lib/ai/tool-handlers.ts` — Supabase query functions for each tool
- `app/api/ai/chat/route.ts` — streaming POST route, handles tool call loop
- `.env.local.example` — add `ANTHROPIC_API_KEY`

**Install:** `npm install @anthropic-ai/sdk`

**Acceptance:** `POST /api/ai/chat` with a test message returns a streaming response; tool calls execute real Supabase queries.

### Task AI-2: Nav + routing changes
**Files to modify:**
- `app/page.tsx` — change redirect from `/events` to `/ai`
- `components/layout/bottom-nav.tsx` — replace FAB gap with `Sparkles` icon → `/ai`
- `components/layout/fab.tsx` — delete (or export nothing and remove from layout)
- `app/(app)/layout.tsx` — remove `<FAB />` import/render

**New file:**
- `app/(app)/ai/page.tsx` — server component, passes userId to AIChat

**Acceptance:** Navigating to `/` lands on the AI page. Center nav button is a sparkle icon. No FAB visible anywhere.

### Task AI-3: AI Chat shell
**Files to create:**
- `components/ai/ai-chat.tsx` — chat UI, streaming fetch, message list
- `components/ai/ai-message.tsx` — message bubble renderer

**Acceptance:** Can type a message, it streams back a response, conversation history is maintained across turns.

### Task AI-4: Rich card components
**Files to create:**
- `components/ai/event-result-card.tsx`
- `components/ai/ride-suggestion-card.tsx`
- `components/ai/ride-preview-card.tsx`

**Wire-up:** `ai-message.tsx` parses a structured payload from the API (JSON block embedded in AI response, or a separate `toolResult` field on the message) and renders the appropriate card.

**Acceptance:** AI response containing an event match renders an EventResultCard. AI response containing ride results renders RideSuggestionCards. Confirmation step renders RidePreviewCard.

### Task AI-5: Ride creation flow end-to-end
Wire `create_ride` tool handler to actually insert in Supabase. Test full Flow A: search → confirm event → prefill → add time → confirm → posted.

**Acceptance:** A ride created via AI appears in `/rides` under Driving.

### Task AI-6: Ride finding flow end-to-end
Wire `find_rides` tool with proximity sorting. Test full Flow B: search → confirm event → see ranked rides → apply.

**Acceptance:** Applying via AI creates a pending application visible in `/rides` under Riding.

---

## Out of Scope (Deferred)

| Feature | Why deferred | When |
|---------|-------------|------|
| In-group-chat AI assistant (Feature 4) | Different surface, needs chat context injection, more complex prompt engineering | Phase 2 AI |
| Ticketmaster / SeatGeek live event data | Requires API keys + event normalization layer | Phase 3 |
| AI ride pricing suggestions | Needs historical data | Phase 2 |
| Conversation history persisted to Supabase | Client state sufficient for pitch | Phase 2 |
| Browser geolocation API | AI parses location from text; falls back to profile address | Phase 2 |
| Tests for AI flows | Tool handlers can be unit tested; full flow requires mocking Claude | Phase 2 |

---

## Notes for Implementation Session

- Use the `superpowers:claude-api` skill when building Task AI-1. It will handle prompt caching and streaming patterns correctly.
- The API route needs the Supabase service role key to run tool handlers server-side without RLS interference.
- The `find_rides` tool handler should re-use `haversineDistance` from `lib/haversine.ts`.
- `seatMapToRecord` from `lib/seat-templates.ts` is needed in `create_ride` handler.
- Rich cards are triggered by the AI including a structured JSON block in its message (e.g., `<action type="event_result" data={...} />`). The message renderer strips these and renders the component.
- Keep the system prompt ≤ 1024 tokens for optimal cache hit rate.

---

## Suggested Start Prompt (Next Session)

> "Read `docs/superpowers/plans/phase-1-ai-features.md` only. Implement Task AI-1: API infrastructure. Install `@anthropic-ai/sdk`, create `lib/ai/tools.ts`, `lib/ai/tool-handlers.ts`, and `app/api/ai/chat/route.ts`. Use the `claude-api` skill for the implementation."
