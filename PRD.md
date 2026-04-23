# Caravn — Master Product Spec
*Last updated: 2026-04-21*

---

## 1. Product Vision

Caravn is a mobile-first web app for event-centric carpooling. Drivers headed to concerts, games, and festivals fill empty seats; riders find affordable, pre-planned rides tied to the specific events they're attending. Unlike on-demand rideshare, every ride on Caravn is tied to an event, booked in advance, and coordinated through seat selection and driver approval.

**Core insight:** Events create predictable surge travel. Caravn unlocks unused car seats while building a community around shared experiences.

---

## 2. Target Users

**Driver Dana** — Attends events regularly, drives with 2–4 empty seats. Wants to offset costs, meet people, reduce parking hassle. Posts rides to events she's already driving to.

**Rider Ray** — Wants affordable, reliable transport to a specific event with advance certainty. Needs to find rides, pick a seat, and know exactly where to be and when.

One user can be both Driver and Rider — roles are determined by action, not account type.

---

## 3. Business Model

**Free rides:** Driver sets cost = $0. No platform fee, no payment flow, no cancellation enforcement. Frictionless. This is the onboarding wedge — lets drivers and riders build the habit before money is involved.

**Paid rides:** Driver sets a cost. Platform takes a small % fee (target: 5–10%) per completed ride. Payment via Stripe (Phase 2). Cancellation policy enforced on paid rides only.

**Monetization principle:** Make free rides so easy that drivers habitually use Caravn. Paid rides are the natural next step once trust is established.

---

## 4. Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 14+ App Router, TypeScript (strict) |
| Database | Supabase (Postgres) |
| Auth | Supabase Auth (email/password + phone OTP) |
| Styling | Tailwind CSS + shadcn/ui |
| Deployment | Vercel |
| Future Phase 2 | Stripe (payments), Google Maps API (commute-time pickup radius) |
| Future Phase 3 | Ticketmaster/SeatGeek API (event seeding), Claude/OpenAI (AI features) |

---

## 5. Navigation Structure

Mobile bottom tab bar with 5 items:

```
[ Events ] [ Rides ] [ ➕ ] [ Inbox ] [ Profile ]
```

- **Events** — Browse and search events; view rides attached to an event
- **Rides** — Personal ride management hub: your upcoming/active rides as driver or rider
- **➕ (FAB)** — Center floating action button; opens a bottom sheet with two options:
  - 🔍 **Find a Ride** — "I need a ride to an event"
  - 🚗 **Post a Ride** — "I have seats to offer"
- **Inbox** — Messaging hub: group ride chats + direct messages (like any messaging app)
- **Profile** — Your profile, vehicles, friends, settings

---

## 6. Onboarding Flow

**Action-first** — minimum friction to get into the app.

1. Sign up with email + password
2. Verify email → land directly on Events tab
3. Vehicle and phone are collected **just-in-time**:
   - Tap "Post a Ride" → prompted to add a vehicle (if none exists)
   - Tap "Find a Ride" → prompted to verify phone number (if not verified)
4. No upfront role declaration. Role emerges from what you do.

---

## 7. Core Features (MVP)

### 7.1 Authentication & Profiles

- Email/password signup + email verification
- Phone number verification via SMS OTP (required before applying to or posting rides)
- Profile fields: full name, username, avatar, phone, short bio
- No hard role field — role is inferred from activity (has vehicles = can drive, has verified phone = can ride)
- **Trust signal**: mutual connections count shown on driver profiles ("3 mutual connections")
- Friends system: send/accept friend requests. Mutual connections count is the only visible output at MVP (no activity feed, no friends-of-friends ride visibility yet)

### 7.2 Events Directory

- Events have: name, venue name, venue address, city, lat/lng, starts_at, ends_at, category (concert / sports / festival / conference / other), description, optional image
- Users create events manually (MVP). Schema includes `external_id` + `external_source` fields for future Ticketmaster/SeatGeek integration
- **Duplicate detection**: when creating an event, system calls `find_similar_events` Postgres function (pg_trgm fuzzy matching on name + venue, weighted by time proximity). If similar events found, shows "Did you mean X?" dialog. User can pick existing or create new.
- Events page: search by name, city, date, category. Results show ride count per event.
- Event detail page: event info + all open rides for that event
- **Ride completion auto-triggers off event**: rides auto-complete 3 hours after `events.ends_at`

### 7.3 Vehicle Registration & Seat Templates

- Drivers register vehicles: make, model, year, color, type (sedan / SUV / minivan / truck / coupe / hatchback / van), capacity
- System generates `seat_template` JSONB from vehicle type + capacity:
  - Base layouts: `sedan=[2,3]`, `suv=[2,3,2]`, `minivan=[2,3,3]`, `van=[2,3,3,3]`, etc.
  - Each seat has: id, row, label, isDriver, x/y position percentages for CSS layout
  - Driver seat always row 1 position 0 — non-selectable, visually distinct
- Drivers can register multiple vehicles; one marked as default
- Seat template previewed live during registration as capacity is changed

### 7.4 Ride Listings with Interactive Seat Map

**Creating a ride (4-step wizard):**
1. Select event (search existing or create new)
2. Select vehicle (from registered vehicles; shows seat preview)
3. Ride details: departure address, departure time, optional return time, cost per person (or $0 for free), notes
4. Preview + publish

**Pickup options:**
- **Default pickup spot** (required): a fixed address all riders can find
- **Flexible radius** (optional, driver elects): driver sets a radius in miles (e.g., 2 mi). Riders within range can request a custom pickup address. System validates distance using Haversine formula. If outside range, rider must come to default spot. (Phase 3: swap Haversine for Google Maps commute-time check)

**Seat map:**
- Car layout visualization — top-down view with SVG car silhouette per vehicle type
- Seats positioned as tappable buttons using x/y percentage coordinates
- Color coding: green = available, yellow = reserved (pending application), gray = occupied, circular = driver
- Read-only for browsers; interactive (seat selector) during ride application

**Return trips:**
- Stored as two separate ride records (both linked by same driver_id + event_id)
- After booking a "to event" ride, system surfaces: "This driver also has a return ride" — one tap to apply

**Ride statuses:** `draft` → `active` → `full` / `cancelled` / `completed`

### 7.5 Ride Applications & Cost Split

**Applying to a ride:**
- Rider selects 1 or more seats (group booking: up to available seats in one application)
- Optional message to driver
- If driver has flexible pickup enabled: rider can enter custom pickup address (validated against radius)
- Cost quote shown before submitting

**Driver workflow:**
- Receives application notifications in Inbox
- Can accept or reject; accepted riders get their seat(s) locked
- Accepting recalculates cost share for all confirmed riders

**Cost split formula:**
```
cost_per_person = total_cost / (accepted_riders + 1)
```
Driver always pays equal share. Recalculated on every accept/reject. Free rides: cost = $0, no calculation needed.

**Application statuses:** `pending` → `accepted` / `rejected` / `cancelled`

**Cancellation:**
- Free rides: no policy. Cancellation allowed, no consequences.
- Paid rides (Phase 2): cancellations within 24 hours of departure incur a fee. Data model supports this from day one via `is_paid` flag on rides.

### 7.6 Messaging

**Group chat (MVP):**
- Auto-created when a ride is published
- All confirmed riders + driver are members
- Driver can post announcements ("Meeting at the north entrance at 7pm")
- Auto-deleted 7 days after ride completion
- Accessible from ride detail page + appears in Inbox tab

**Direct messages (Phase 2):**
- On-demand: initiated from ride detail page ("Chat with driver")
- Private 1:1 between rider and driver
- Also lives in Inbox tab

**Inbox tab:** Messaging hub showing all active group chats + DMs, sorted by most recent activity — same mental model as iMessage or WhatsApp.

**Non-chat notifications:** Application received, application accepted/rejected, ride cancelled, new group message (when app is closed) — delivered as push notifications + shown as a badge on Inbox tab.

---

## 8. Ride Lifecycle

```
Driver creates ride (draft)
    ↓
Driver publishes (active)
    ↓
Riders apply → Driver accepts/rejects
    ↓
Ride fills up (full) — no more applications
    ↓
Event ends + 3 hours → Auto-complete (completed)
    ↓
Review window opens (both parties rate each other)
    ↓
7 days later → Group chat deleted
```

---

## 9. Data Model Highlights

Key fields to note (beyond standard CRUD):

**rides**
- `is_paid BOOLEAN` — gates entire payment + cancellation policy
- `seat_map JSONB` — snapshot of vehicle template at ride creation time; updated by trigger when applications change
- `pickup_radius_miles NUMERIC` — nullable; null = no flexible pickup
- `return_ride_id UUID` — nullable FK to sibling return ride

**ride_applications**
- `seat_ids TEXT[]` — array of seat IDs from seat_map (supports group booking)
- `custom_pickup_address TEXT` — nullable; rider's requested pickup if driver has radius enabled
- `cost_share NUMERIC` — recalculated on every driver accept/reject

**events**
- `external_id TEXT` + `external_source TEXT` — for future API integration
- `starts_at` / `ends_at` — drives ride auto-completion

**profiles**
- `mutual_connections_count` computed via friends join — shown on driver profiles

---

## 10. Future Roadmap (prioritized)

**Phase 2 — Payments & DMs**
- Stripe integration for paid rides (payment intents, confirmation, refunds)
- Hard cancellation enforcement for paid rides
- Direct messages (1:1 rider↔driver chat)
- Post-ride cost adjustments with rider approval

**Phase 3 — Discovery & Social**
- Ticketmaster/SeatGeek API for event seeding
- Google Maps commute-time for pickup radius validation
- Contacts import for social graph bootstrap
- Friends' activity: "3 friends are going to this event, 1 has a ride posted"

**Phase 4 — AI & Advanced Features**
- Claude/OpenAI integration (e.g., smart ride recommendations, event suggestions)
- Advanced ride search filters (price, vehicle type, driver rating, departure time window)
- Admin moderation dashboard

**Phase 5 — Platform Expansion**
- Email notifications (application decisions, ride reminders)
- Driver analytics (earnings, ride history, occupancy rate)
- Recurring rides (drivers who commute to a venue regularly)

---

## 11. Open Questions / Decisions Deferred

- Platform fee exact % (5%? 10%? Dynamic?) — decide before Stripe integration
- Push notification provider (web push vs. OneSignal vs. other)
- Age verification requirements (legal review needed before launch)
- Terms of service + liability language (especially for paid rides)
- Dispute resolution process for no-shows, driver cancellations day-of
