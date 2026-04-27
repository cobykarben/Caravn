# Completed Progress Log

Chronological record of what's been built, with commit hashes for reference.

---

## Phase 1 Build Log

### 2026-04-22 — Initial commits

**`ae76ba7`** — Task 1: Project bootstrap
- Next.js 14 App Router, TypeScript strict, shadcn/ui (Zinc), Vitest
- Uber dark theme: `--background: 0 0% 4%`, `body { max-width: 480px }`
- Installed: `@supabase/supabase-js`, `@supabase/ssr`, `lucide-react`

**`3c2ea96`** (+ fixes `09caee3`, `84b0feb`) — Task 2: Database schema
- 3 migration files: initial schema, RLS policies, functions/triggers
- Tables: profiles, events, vehicles, rides, ride_applications, friendships, ride_chats, ride_chat_members, messages
- Triggers: handle_new_user, handle_ride_published, handle_application_accepted, sync_seat_map_on_application
- Function: find_similar_events (pg_trgm fuzzy matching)
- Generated `types/database.ts`

**`a4bc4a3`** — Task 3: Auth + Middleware
- Supabase SSR clients (browser + server)
- Middleware protecting all routes except `/login`, `/signup`, `/verify-email`
- Login page (email/password + Google OAuth)
- Signup page (full name + email + password + Google OAuth)
- Verify-email screen
- Auth callback route for OAuth code exchange

**`5bfdc04`** — Task 4: App Shell
- Bottom nav: 5 tabs (Events, Rides, [FAB gap], Inbox, Profile)
- FAB: floating `+` button, opens sheet with "Find a Ride" / "Post a Ride"
- App layout: server component, redirects unauthenticated users
- Stub pages for all 4 tabs

**`06b2904`** — Task 5: Utility functions
- `lib/seat-templates.ts`: `generateSeatTemplate()`, `seatMapToRecord()`
- `lib/haversine.ts`: `haversineDistance()`, `isWithinRadius()`
- `lib/cost-split.ts`: `calculateCostShare()`
- Full test coverage (14 tests)

---

### 2026-04-22 — Profile & Events

**`2f9923a`** — Task 6: Profile
- `ProfileHeader` component (avatar, name, username, bio, verified badge)
- Profile page (server component with menu links + sign-out server action)
- Edit profile page (client component)
- Phone verification page (2-step: enter phone → OTP → mark verified)

**`5e5fb17`** — Task 7: Events Directory
- `EventCard` component (name, category badge, date, venue, ride count)
- `EventSearch` client component (URL param-based, no debounce needed)
- Events page (server component with `?q`, `?city`, `?category` filtering)

**`1d6303c`** — Task 8: Event Detail + Create
- Event detail page (header, attached rides list, "Post ride" button)
- `CreateEventForm` with fuzzy duplicate detection via `find_similar_events` RPC
- Dialog to show similar events before creating
- `RideCard` stub (basic departure time + seat count display)
- Create event page

---

### 2026-04-22 — Vehicles

**`4472688`** — Task 9: Vehicle Registration
- `VehicleCard` (year/make/model, color/type/capacity, Default badge, set-as-default button)
- `VehicleForm` with live seat preview (`SeatPreview` SVG circles updated on type/capacity change)
- Vehicle list page (client component, loads on mount, `setDefault` updates DB)
- Add vehicle page

**`1ef0f96`** — Fix: vehicle form loading state + setDefault optimistic update guard
- Fixed loading state during vehicle save
- Added guard against race condition in setDefault

---

### 2026-04-25 — Seat Map + Rides + Social + Bug Fixes

**`e00d7c9`** — Task 10: Interactive Seat Map
- `SeatMap` component: full SVG car silhouette, color-coded seat status (available/reserved/occupied/driver)
- Seat selection with `aria-pressed`, `aria-label`, read-only mode
- `seatRecordToArray()` helper added to `lib/seat-templates.ts`
- 6 SeatMap tests + 1 round-trip test

**`0010e2b`** — Task 11: Create Ride Wizard
- 4-step wizard: Event → Vehicle → Details → Publish
- Step 1: debounced event search, preselected event support
- Step 2: vehicle list with seat preview on selection
- Step 3: departure address/time, cost, notes, flexible pickup radius toggle
- Step 4: review summary + Publish (inserts ride with `status: 'active'`)
- `app/(app)/rides/new/page.tsx` with `<Suspense>` wrapper for `useSearchParams`
- 21 wizard tests

**`c477df0`** — Task 12: Ride Detail + Application Form
- `app/(app)/rides/[id]/page.tsx`: server component, 4 view modes (driver / accepted / pending / visitor)
- Driver view: pending applications with accept/decline server actions, accepted riders list, cancel ride
- `RideApplicationForm`: seat picker, cost estimate, optional custom pickup, message field
- Full `RideCard` replacement: driver avatar, date/time, address, cost line
- 7 RideApplicationForm tests

**`cc641df`** — Task 13: My Rides Page
- `app/(app)/rides/page.tsx`: Driving section (driver_id match) + Riding section (accepted applications)
- Empty state when no rides in either section
- Reuses `RideCard`, no new components

**`cff9ea7`** — Task 14: Group Messaging
- `ChatListItem`: event name, last message preview with sender prefix, "No messages yet" fallback, links to chat
- `ChatView`: own/other bubble layout, sender names + avatars, Supabase Realtime `postgres_changes` subscription, send input + button
- `app/(app)/inbox/page.tsx`: membership-based chat list, sorted by last message time
- `app/(app)/inbox/[chatId]/page.tsx`: membership guard, last 50 messages, `<ChatView>`
- 5 ChatListItem tests + 6 ChatView tests

**`1af8a1f`** — Task 15: Friends System
- `UserSearch`: debounced username search, Add/Pending/Friends status per result, optimistic sent tracking
- `app/(app)/profile/friends/page.tsx`: incoming requests with accept/decline server actions, accepted friends list (bidirectional query), `<UserSearch>` with state passed down
- 6 UserSearch tests

**`31f02cc`** — Bug fixes (post-review)
- `Step1Event`: "Change event" button now calls `onSelect(null)` to clear parent state → search input reappears
- `SeatMap`: added `type="button"` to seat `<button>` elements — prevents accidental form submission when SeatMap is inside a `<form>`
- `RideApplicationForm`: cost estimate uses `accepted_count + Math.max(1, selectedIds.length)` — updates live as multiple seats are selected; stored `cost_share` is also correct
- `rides/[id]`: added rejected/cancelled applicant state block with descriptive copy

---

## Phase 1 Final State

**✅ All 15 tasks complete · 2026-04-25**

| Metric | Value |
|--------|-------|
| Test files | 17 |
| Tests passing | 97 |
| TypeScript errors | 0 |
| Routes | 20 (14 dynamic, 6 static) |
| Commits | 19 |

### Known issues to address in Phase 2 setup
- `types/database.ts` is a generated stub — run `supabase gen types typescript --linked` against live project before Phase 2
- No trigger to auto-transition `rides.status` from `active` → `full` when last seat is accepted
- Inbox query fetches all messages (no limit) — add `.limit(1)` or denormalize `last_message_id`
- `createClient()` called at component render level — stabilize with `useMemo` in client components
- Departure time input has no `min` date constraint — drivers can post rides in the past

---

## AI Features Build Log

### 2026-04-26 — Task AI-1: API Infrastructure

**Commit:** `3fa3af1`

**What was built:**
- Installed `@anthropic-ai/sdk`
- `lib/supabase/admin.ts` — service role Supabase client (bypasses RLS for tool handlers)
- `lib/ai/tools.ts` — 5 Anthropic `Tool` definitions for Claude:
  - `search_events`: ilike + fuzzy RPC match, returns top 5 upcoming events
  - `get_user_profile`: profile + default vehicle info + all vehicles list
  - `find_rides`: active/full rides for event with available seat count, sorted by departure time
  - `create_ride`: fetches vehicle seat_template, converts via `seatMapToRecord`, inserts ride with `status: 'active'`
  - `apply_to_ride`: inserts `ride_applications` row with `status: 'pending'`
- `lib/ai/tool-handlers.ts` — Supabase query implementations for each tool + dispatcher `executeToolCall()`
  - NYC neighborhood location lookup table (12 entries) for proximity sorting
  - userId injected server-side into all auth fields — AI never needs UUIDs
- `app/api/ai/chat/route.ts` — streaming SSE POST route
  - Agentic loop: up to 10 iterations, executes all tool calls per iteration, streams text/tool events
  - System prompt with `cache_control: { type: 'ephemeral' }` for prompt caching
  - SSE event types: `text`, `tool_call`, `tool_result`, `done`, `error`
- Service role grants migrations: `20260426000001_grants_backfill.sql`, `20260426000002_service_role_grants.sql`
- `middleware.ts` updated: passes `/api/*` routes through without auth redirect

---

### 2026-04-26 — Tasks AI-2 through AI-4: Nav, Chat Shell, Rich Cards

**Commits:** `6685388`, `3cd5564`, `b81ac36`, `036e3e3`

**AI-2: Nav + routing**
- `app/page.tsx` → `redirect('/ai')`
- `components/layout/bottom-nav.tsx` — FAB gap replaced with `Sparkles` icon → `/ai`
- `components/layout/fab.tsx` — deleted
- `app/(app)/layout.tsx` — FAB removed
- `app/(app)/ai/page.tsx` — server component, passes userId to `<AIChat>`

**AI-3: Chat shell**
- `components/ai/ai-chat.tsx` — streaming fetch, message history, auto-resize textarea, greeting state
- `components/ai/ai-message.tsx` — bubble renderer with action tag parsing + `stripActions` for clean display

**AI-4: Rich cards**
- `components/ai/event-result-card.tsx` — event match with "That's the one" / "Not this one"
- `components/ai/ride-suggestion-card.tsx` — ride card with Apply + Details link
- `components/ai/ride-preview-card.tsx` — ride creation preview with "Post it" / "Edit"
- Wire-up: `ai-message.tsx` parses `<action type="...">JSON</action>` blocks and renders the card
- All card "Post it" / "That's the one" / Apply buttons call `onSend()` to inject a new user turn

---

### 2026-04-26 — Task AI-5: Ride Creation Flow (Flow A) — Complete

**Verified end-to-end code path:**

1. User: "make a ride for the Giants game tonight"
2. AI calls `search_events` → returns event with id, name, venue, starts_at
3. AI outputs text + `<action type="event_result">{"id":"...","name":"...","starts_at":"..."}</action>`
4. User taps "That's the one" → sends "yes, that's the one"
5. AI calls `get_user_profile` → returns `default_vehicle.id`, `passenger_seats`, vehicle description
6. AI outputs text: "Got it. Your 2022 Toyota Camry — 4 passenger seats. What time do you want to leave?"
7. User types "around 5"
8. AI outputs ride_preview action with event_name (from history), vehicle description, departure time, `available_seats = passenger_seats`
9. User taps "Post it" → sends "confirm, post the ride"
10. AI calls `get_user_profile` again (vehicle_id UUID not in text history) → then calls `create_ride` once
11. `create_ride` handler: fetches seat_template, builds seat_map, inserts ride with status 'active', driver_id = userId
12. AI includes `/rides/[new-id]` link from tool result
13. Ride appears in `/rides` under Driving (queried by `driver_id = user.id`)

**Bug fixed:** Double `create_ride` call — Claude was calling `create_ride` first with an invented vehicle_id (fails "Vehicle not found"), then `get_user_profile`, then `create_ride` again. Fixed by:
- System prompt: `get_user_profile` MUST be called before `create_ride`; once `create_ride` returns success, STOP all tool calls
- Tool description: vehicle_id must come from `get_user_profile`, call this exactly once per confirmation
- System prompt: `available_seats` in ride_preview = `passenger_seats` from profile (capacity − 1)

**Both Flow A and Flow B smoke-tested and passing.**

---

## AI Features — Remaining Task

### Task AI-6: Ride Finding Flow (Flow B) — ✅ Already passing (smoke-tested with AI-5)

`find_rides` handler queries Supabase (done in AI-1). Flow B verified:
- search → confirm event → `find_rides` tool → RideSuggestionCards rendered → Apply → `apply_to_ride` inserts pending application
- Application visible in `/rides` under Riding

No additional code changes needed. AI features complete.

---

**Current AI state (2026-04-26):**
- All 6 AI tasks done
- 95 tests passing (97 − 2 removed FAB tests, expected)
- 0 TypeScript errors
- 22 routes (20 Phase 1 + `/ai` + `/api/ai/chat`)
