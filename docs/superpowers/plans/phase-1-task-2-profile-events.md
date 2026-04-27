# Phase 1 · Tasks 6–8: Profile, Events Directory, Event Detail

**Status: ✅ All done**

These tasks are complete. This file is a reference summary — code is in the repo. Jump to a pending task file to continue building.

---

## Task 6: Profile Page + Phone Verification ✅

**Commit:** `2f9923a` — "feat: profile page, edit profile form, and phone verification flow"

**What was built:**

- `components/profile/profile-header.tsx` — Avatar (AvatarFallback with first initial), full name, `@username`, bio, phone-verified badge (green) or "Verify phone" link
- `app/(app)/profile/page.tsx` — Server component; fetches profile, renders `<ProfileHeader>`. Settings links for Edit Profile, My Vehicles, Friends. Sign-out form (server action calling `supabase.auth.signOut()`).
- `app/(app)/profile/edit/page.tsx` — Client component; loads profile on mount, saves with `supabase.from('profiles').update()`
- `app/(app)/profile/verify-phone/page.tsx` — Two-step flow: (1) enter phone → `supabase.auth.updateUser({ phone })`, (2) enter OTP → `supabase.auth.verifyOtp({ type: 'phone_change' })` → updates `profiles` table with `phone` + `phone_verified: true`

**Tests:** `components/profile/__tests__/profile-header.test.tsx` — 4 tests (renders name/username, bio, verified badge, unverified link).

---

## Task 7: Events Directory ✅

**Commit:** `5e5fb17` — "feat: events directory with search, EventCard component, and server-side filtering"

**What was built:**

- `components/events/event-card.tsx` — Card with event name, category badge, date/time, venue + city, ride count (green "4 rides available" or muted "No rides yet — be the first!")
- `components/events/event-search.tsx` — Client component; reads/writes `?q=` URL param using `useSearchParams` + `useRouter`. Debounce is implicit (server re-renders on navigation).
- `app/(app)/events/page.tsx` — Server component; accepts `searchParams` (q, city, category). Queries events with `starts_at >= now()`. Counts rides via `rides(id)` join. Orders by `starts_at` ascending.

**Key pattern:** `searchParams` is a `Promise<{q, city, category}>` in Next.js 14 — must be `await`ed.

**Tests:** `components/events/__tests__/event-card.test.tsx` — 5 tests (name, venue/city, ride count, 0 rides, category badge).

---

## Task 8: Event Detail + Create Event (with Duplicate Detection) ✅

**Commit:** `1d6303c` — "feat: event detail page, create event form with fuzzy duplicate detection, RideCard stub"

**What was built:**

- `app/(app)/events/[id]/page.tsx` — Server component; shows event header (name, category badge, date, venue, description), then "Rides (N)" section with a `<RideCard>` for each active/full ride, plus a "Post ride" button linking to `/rides/new?event={id}`.
- `app/(app)/events/new/page.tsx` — Wraps `<CreateEventForm>`.
- `components/events/create-event-form.tsx` — Client component with all event fields. On submit, calls `supabase.rpc('find_similar_events', { p_name, p_venue, p_starts_at })`. If similar events found, opens a `<Dialog>` listing them — user can select an existing one (navigates to it) or "Create anyway". Server-side insert on confirmation.
- `components/rides/ride-card.tsx` — **Stub** created here (full implementation comes in Task 12). Shows departure time, available seat count badge, "Full" badge when status=full, cost line.

**Tests:** `components/events/__tests__/create-event-form.test.tsx` — 2 tests (all fields present, submit button present). Supabase client is mocked.

---

## Next Steps

Tasks 6–8 done. The next pending task is:

**Task 10 (Interactive Seat Map):** Read `phase-1-task-3-vehicles-seatmap.md`
