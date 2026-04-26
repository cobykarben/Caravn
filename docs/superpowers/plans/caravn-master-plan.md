# Caravn — Master Plan

## Product Vision

Caravn is a mobile-first ride-sharing app for event-goers. Users create or discover events (concerts, sports, festivals), post rides with interactive seat maps, apply for seats, chat with their rideshare group, and build a friend network of fellow attendees.

**Design language:** Uber-like dark theme — near-black backgrounds, white CTAs, zinc palette. Mobile-first, max-width 480px, fixed bottom tab bar.

**Stack:** Next.js 14 App Router · TypeScript (strict) · Supabase (Postgres + Auth + Realtime) · Tailwind CSS · shadcn/ui · Vitest · React Testing Library

---

## Phases

| Phase | Description | Status |
|-------|-------------|--------|
| **1 — MVP** | Auth, events, vehicles, rides + seat maps, applications, group chat, friends | **✅ Complete (15/15 tasks done)** |
| 2 — Payments & DMs | Stripe for paid rides, 1:1 direct messages, cancellation enforcement | Future |
| 3 — Discovery & Social | Ticketmaster/SeatGeek event seeding, Google Maps pickup radius, friends activity feed | Future |
| 4 — AI & Advanced | Claude/OpenAI recommendations, advanced filters, admin dashboard | Future |
| 5 — Platform Expansion | Email notifications, driver analytics, recurring rides | Future |

---

## Phase 1 Current Status

**15 of 15 tasks complete.** Full MVP is built and passing. 97 tests, 0 TypeScript errors, 20 routes.

| Group | Tasks | Status |
|-------|-------|--------|
| Foundation | Tasks 1–5 | ✅ All done |
| Profile & Events | Tasks 6–8 | ✅ All done |
| Vehicles & Seat Map | Tasks 9–10 | ✅ All done |
| Rides | Tasks 11–13 | ✅ All done |
| Social | Tasks 14–15 | ✅ All done |

---

## Task Files (Phase 1)

Use these focused files — read only the one relevant to what you're building:

| File | Covers | Status |
|------|--------|--------|
| [phase-1-task-1-foundation.md](phase-1-task-1-foundation.md) | Tasks 1–5: Setup, DB, Auth, App Shell, Utilities | ✅ Done |
| [phase-1-task-2-profile-events.md](phase-1-task-2-profile-events.md) | Tasks 6–8: Profile, Events Directory, Event Detail | ✅ Done |
| [phase-1-task-3-vehicles-seatmap.md](phase-1-task-3-vehicles-seatmap.md) | Tasks 9–10: Vehicles + Interactive Seat Map | ✅ Done |
| [phase-1-task-4-rides.md](phase-1-task-4-rides.md) | Tasks 11–13: Ride Wizard, Ride Detail, My Rides | ✅ Done |
| [phase-1-task-5-social.md](phase-1-task-5-social.md) | Tasks 14–15: Group Chat, Friends | ✅ Done |
| [phase-1-overview.md](phase-1-overview.md) | Full task table + file map | Reference |
| [completed-progress-log.md](completed-progress-log.md) | Chronological build log with commit hashes | Reference |

---

## How to Use These Files

Tell Claude:

> "Read `docs/superpowers/plans/phase-1-task-4-rides.md` only. Implement the next unchecked item. Do not read the full master plan."

Each task file has:
- Objective
- Files to create/modify
- Failing tests to write first (TDD)
- Implementation code
- Acceptance criteria (build passes, tests pass)
- Suggested next prompt

---

## Architecture Notes

- **Auth:** Supabase email/password + Google OAuth. Middleware at `middleware.ts` protects all `/app/*` routes.
- **DB:** All tables have RLS enabled. Three migration files: `initial_schema`, `rls_policies`, `functions_triggers`.
- **Seat map:** Stored as JSONB `seat_map` on the `rides` table. A DB trigger (`sync_seat_map_on_application`) updates seat statuses when application status changes.
- **Group chat:** Auto-created by `handle_ride_published` trigger when ride status → `active`. Members added/removed by `handle_application_accepted` trigger.
- **Realtime:** Chat view subscribes to `postgres_changes` on `messages` filtered by `chat_id`.
