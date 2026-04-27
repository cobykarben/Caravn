# Phase 1 · Tasks 1–5: Foundation

**Status: ✅ All done**

These tasks are complete. This file is a reference summary — the code is in the repo. Jump to a pending task file to continue building.

---

## Task 1: Project Setup & Configuration ✅

**Commit:** `ae76ba7` — "chore: bootstrap Next.js 14 app with Supabase, shadcn/ui, Vitest, Uber dark theme"

**What was built:**
- Next.js 14 App Router with TypeScript strict mode + `noUncheckedIndexedAccess`
- Supabase SSR packages installed (`@supabase/supabase-js`, `@supabase/ssr`)
- shadcn/ui initialized (style=Default, base-color=Zinc, CSS variables=yes)
- shadcn components: button, input, label, card, sheet, badge, avatar, tabs, dialog, textarea, select
- Vitest + happy-dom + React Testing Library configured
- Uber-like dark theme in `app/globals.css`:
  - `--background: 0 0% 4%` (near-black)
  - `--foreground: 0 0% 98%` (near-white)
  - `--card: 0 0% 10%`
  - `--primary: 0 0% 98%`
  - `body { max-width: 480px; margin: 0 auto; }`
- `.env.local.example` with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

---

## Task 2: Database Schema + Migrations ✅

**Commits:** `3c2ea96`, `09caee3`, `84b0feb`

**What was built:**

Three migration files in `supabase/migrations/`:

**`20260422000001_initial_schema.sql`** — Tables:
- `profiles` (extends `auth.users` 1:1): `id`, `username`, `full_name`, `avatar_url`, `bio`, `phone`, `phone_verified`
- `events`: `name`, `venue_name`, `venue_address`, `city`, `lat`, `lng`, `starts_at`, `ends_at`, `category` (concert/sports/festival/conference/other), `external_id`, `external_source`
- `vehicles`: `owner_id`, `make`, `model`, `year`, `color`, `type` (sedan/suv/minivan/truck/coupe/hatchback/van), `capacity` (2–11), `seat_template` (jsonb), `is_default`
- `rides`: `driver_id`, `event_id`, `vehicle_id`, `status` (draft/active/full/cancelled/completed), `departure_address`, `departure_time`, `return_time`, `cost_per_person`, `is_paid` (generated), `notes`, `seat_map` (jsonb), `pickup_radius_miles`
- `ride_applications`: `ride_id`, `rider_id`, `status` (pending/accepted/rejected/cancelled), `seat_ids` (text[]), `message`, `custom_pickup_address`, `cost_share`
- `friendships`: `requester_id`, `addressee_id`, `status` (pending/accepted/rejected)
- `ride_chats`: `ride_id` (unique)
- `ride_chat_members`: `(chat_id, user_id)` composite PK
- `messages`: `chat_id`, `sender_id`, `content`
- GIN trigram indexes on `events.name` and `events.venue_name` for fuzzy search

**`20260422000002_rls_policies.sql`** — RLS on all tables:
- Profiles: anyone authenticated can select; only owner can insert/update
- Events: anyone can select; only creator can insert/update
- Vehicles: anyone can select; only owner has all permissions
- Rides: active/full/completed visible to all; draft visible only to driver
- Applications: visible to rider + driver; rider can insert; rider can update to cancelled; driver can update to accepted/rejected
- Friendships: visible to requester + addressee; requester inserts; addressee updates
- Chats/Members/Messages: only members can see; members can insert messages

**`20260422000003_functions_triggers.sql`** — Triggers:
- `handle_new_user()` → fires `after insert on auth.users` → creates profile with `full_name` from OAuth metadata, `username` auto-generated as `user_<8chars>`
- `handle_ride_published()` → fires `after insert or update of status on rides` → when status → `active`, creates `ride_chats` row + adds driver as member
- `handle_application_accepted()` → fires `after update of status on ride_applications` → adds accepted rider to chat, removes rejected/cancelled
- `sync_seat_map_on_application()` → fires `after insert or update of status on ride_applications` → updates JSONB `seat_map` on the ride (available/reserved/occupied based on status)
- `find_similar_events(p_name, p_venue, p_starts_at)` → returns top 5 similar events using trigram similarity + time proximity scoring

`types/database.ts` generated via `supabase gen types typescript --linked`.

---

## Task 3: Supabase Auth + Middleware ✅

**Commit:** `a4bc4a3` — "feat: Supabase auth clients, middleware route protection, login/signup/verify pages"

**What was built:**

- `lib/supabase/client.ts` — `createBrowserClient<Database>()` using `@supabase/ssr`
- `lib/supabase/server.ts` — `createServerClient<Database>()` using Next.js `cookies()` (async)
- `middleware.ts` — Protects all routes except `/login`, `/signup`, `/verify-email`. Redirects unauthenticated users to `/login`; redirects logged-in users away from auth pages to `/events`.
- `app/page.tsx` — `redirect('/events')`
- `app/auth/callback/route.ts` — OAuth code exchange; redirects to `/events` on success
- `app/(auth)/login/page.tsx` — Email/password + Google OAuth. Google is primary CTA.
- `app/(auth)/signup/page.tsx` — Full name + email + password. Google is primary CTA.
- `app/(auth)/verify-email/page.tsx` — "Check your email" screen with link back to login

**Key patterns:**
- Browser client created fresh each call: `createClient()` returns new instance
- Server client reads/writes cookies via Next.js `cookies()` store
- Middleware must not cache user between requests — uses `supabase.auth.getUser()` (not `getSession()`)

---

## Task 4: App Shell + Bottom Navigation ✅

**Commit:** `5bfdc04` — "feat: app shell with Uber-style bottom nav, FAB with bottom sheet, and tab stubs"

**What was built:**

- `app/(app)/layout.tsx` — Server component; redirects unauthenticated; renders `{children}`, `<BottomNav />`, `<FAB />`
- `components/layout/bottom-nav.tsx` — 5-tab nav (Events, Rides, [FAB slot], Inbox, Profile). Uses `usePathname()` for active state. `aria-current="page"` on active tab. Active icon has `strokeWidth={2.5}`.
- `components/layout/fab.tsx` — Floating `+` button centered over nav gap. Tapping opens a `<Sheet>` with two options: "Find a Ride" (→ `/rides?find=1`) and "Post a Ride" (→ `/rides/new`).
- Stub pages for `/events`, `/rides`, `/inbox`, `/profile`

**Tests:**
- `components/layout/__tests__/bottom-nav.test.tsx` — 3 tests (renders 5 items, active state, non-active state)
- `components/layout/__tests__/fab.test.tsx` — 2 tests (renders button, opens sheet with options)

---

## Task 5: Utility Functions ✅

**Commit:** `06b2904` — "feat: seat template generator, haversine distance, and cost split utility"

**What was built:**

**`lib/seat-templates.ts`**
- `Seat` type: `{ id, row, position, label, isDriver, x, y, status }`
- `SeatStatus` = `'available' | 'reserved' | 'occupied' | 'driver'`
- `generateSeatTemplate(vehicleType, capacity): Seat[]` — Generates seat layout from vehicle type + capacity. Vehicle type determines base row layout (e.g., sedan = [2, 3]). Capacity trims the layout. Returns absolute `x/y` percentages for SVG positioning.
- `seatMapToRecord(seats): Record<string, Seat>` — Converts array to keyed object for storing in Supabase JSONB

**`lib/haversine.ts`**
- `haversineDistance(lat1, lng1, lat2, lng2): number` — Returns distance in miles
- `isWithinRadius(driverLat, driverLng, riderLat, riderLng, radiusMiles): boolean`

**`lib/cost-split.ts`**
- `calculateCostShare(totalTripCost, acceptedRiderCount): number` — `totalTripCost / (acceptedRiderCount + 1)`, rounded to 2 decimal places. Returns 0 if cost is 0 or no riders yet.

**Tests:** Full coverage in `lib/__tests__/` — seat-templates (4 tests), haversine (5 tests), cost-split (5 tests).

---

## Next Steps

Tasks 1–5 are done. Continue with:

- **Task 10 (Seat Map):** Read `phase-1-task-3-vehicles-seatmap.md`
- **Tasks 11–13 (Rides):** Read `phase-1-task-4-rides.md`
- **Tasks 14–15 (Social):** Read `phase-1-task-5-social.md`
