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
