# Caravn Phase 1 — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete Caravn MVP — auth, events directory, vehicle registration, ride listings with interactive seat maps, ride applications, group messaging, and friends system.

**Architecture:** Next.js 14 App Router with Supabase for auth + Postgres. Mobile-first layout centered around a fixed bottom tab bar. Uber-like dark design system (near-black backgrounds, white CTAs, zinc palette) via Tailwind + shadcn/ui.

**Tech Stack:** Next.js 14 App Router · TypeScript (strict) · Supabase (Postgres + Auth + Realtime) · Tailwind CSS · shadcn/ui · Vitest · React Testing Library

---

## Phase Overview

| Phase | Description | Status |
|-------|-------------|--------|
| **1 — MVP** | Auth, events, vehicles, rides + seat maps, applications, group chat, friends | **This plan** |
| 2 — Payments & DMs | Stripe for paid rides, 1:1 direct messages, cancellation enforcement | Future |
| 3 — Discovery & Social | Ticketmaster/SeatGeek event seeding, Google Maps pickup radius, friends activity feed | Future |
| 4 — AI & Advanced | Claude/OpenAI recommendations, advanced filters, admin dashboard | Future |
| 5 — Platform Expansion | Email notifications, driver analytics, recurring rides | Future |

---

## File Map (Phase 1)

```
caravn/
├── app/
│   ├── layout.tsx                          # Root layout (fonts, global CSS)
│   ├── page.tsx                            # Redirect → /events
│   ├── (auth)/
│   │   ├── login/page.tsx                  # Login form
│   │   ├── signup/page.tsx                 # Signup form
│   │   └── verify-email/page.tsx           # "Check your email" screen
│   └── (app)/
│       ├── layout.tsx                      # App shell: bottom nav + FAB
│       ├── events/
│       │   ├── page.tsx                    # Events list + search
│       │   ├── [id]/page.tsx               # Event detail + attached rides
│       │   └── new/page.tsx                # Create event form
│       ├── rides/
│       │   ├── page.tsx                    # My rides (driver + passenger)
│       │   ├── [id]/page.tsx               # Ride detail + seat map
│       │   └── new/page.tsx                # Create ride wizard
│       ├── inbox/
│       │   ├── page.tsx                    # Chat list
│       │   └── [chatId]/page.tsx           # Chat view
│       └── profile/
│           ├── page.tsx                    # My profile
│           ├── edit/page.tsx               # Edit profile
│           ├── vehicles/
│           │   ├── page.tsx                # Vehicle list
│           │   └── new/page.tsx            # Add vehicle form
│           └── friends/page.tsx            # Friends list
├── components/
│   ├── layout/
│   │   ├── bottom-nav.tsx                  # 5-tab bottom navigation
│   │   └── fab.tsx                         # Center FAB + bottom sheet
│   ├── events/
│   │   ├── event-card.tsx
│   │   ├── event-search.tsx
│   │   └── create-event-form.tsx
│   ├── rides/
│   │   ├── ride-card.tsx
│   │   ├── seat-map.tsx                    # Interactive SVG seat map
│   │   ├── create-ride-wizard.tsx          # 4-step wizard
│   │   └── ride-application-form.tsx
│   ├── vehicles/
│   │   ├── vehicle-card.tsx
│   │   └── vehicle-form.tsx
│   ├── messaging/
│   │   ├── chat-list-item.tsx
│   │   └── chat-view.tsx
│   └── profile/
│       └── profile-header.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts                       # Browser Supabase client
│   │   └── server.ts                       # Server Supabase client
│   ├── seat-templates.ts                   # Generate seat layouts from vehicle type + capacity
│   ├── haversine.ts                        # Distance calculation for pickup radius
│   └── cost-split.ts                       # Cost recalculation formula
├── types/
│   └── database.ts                         # Supabase-generated + custom types
├── middleware.ts                            # Auth route protection
└── supabase/
    └── migrations/
        ├── 20260422000001_initial_schema.sql
        ├── 20260422000002_rls_policies.sql
        └── 20260422000003_functions_triggers.sql
```

---

### Task 1: Project Setup & Configuration

**Files:**
- Create: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `vitest.config.ts`, `.env.local.example`
- Modify: `app/globals.css`, `app/layout.tsx`

- [ ] **Step 1: Bootstrap Next.js app**

```bash
npx create-next-app@latest caravn \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --no-src-dir \
  --import-alias "@/*"
cd caravn
```

- [ ] **Step 2: Install dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr lucide-react
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/user-event @testing-library/jest-dom happy-dom
npx shadcn@latest init
```

shadcn init prompts: Style → Default, Base color → **Zinc**, CSS variables → Yes.

- [ ] **Step 3: Install shadcn components used in Phase 1**

```bash
npx shadcn@latest add button input label card sheet badge avatar tabs dialog textarea select
```

- [ ] **Step 4: Configure Vitest**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: { '@': resolve(__dirname, '.') },
  },
})
```

Create `vitest.setup.ts`:

```typescript
import '@testing-library/jest-dom'
```

Add to `package.json` scripts:

```json
"test": "vitest",
"test:run": "vitest run"
```

- [ ] **Step 5: Enable TypeScript strict mode**

Ensure `tsconfig.json` has:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true
  }
}
```

- [ ] **Step 6: Configure Tailwind for Uber-like dark theme**

Replace `tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
}

export default config
```

Replace the CSS variable block in `app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 4%;
    --foreground: 0 0% 98%;
    --card: 0 0% 10%;
    --card-foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --primary-foreground: 0 0% 4%;
    --muted: 0 0% 14%;
    --muted-foreground: 0 0% 55%;
    --border: 0 0% 18%;
    --input: 0 0% 14%;
    --radius: 0.75rem;
  }
}

body {
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
  -webkit-font-smoothing: antialiased;
  max-width: 480px;
  margin: 0 auto;
}
```

- [ ] **Step 7: Create environment variable template**

Create `.env.local.example`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Copy to `.env.local` and fill in values from Supabase dashboard → Settings → API.

- [ ] **Step 8: Verify build**

```bash
npm run build
```

Expected: build succeeds, zero TypeScript errors.

- [ ] **Step 9: Commit**

```bash
git init && git add -A
git commit -m "chore: bootstrap Next.js 14 app with Supabase, shadcn/ui, Vitest, Uber dark theme"
```

---

### Task 2: Database Schema + Migrations

**Files:**
- Create: `supabase/migrations/20260422000001_initial_schema.sql`
- Create: `supabase/migrations/20260422000002_rls_policies.sql`
- Create: `supabase/migrations/20260422000003_functions_triggers.sql`
- Create: `types/database.ts` (generated)

- [ ] **Step 1: Install Supabase CLI and initialise**

```bash
npm install -g supabase
supabase init
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

- [ ] **Step 2: Write the initial schema migration**

Create `supabase/migrations/20260422000001_initial_schema.sql`:

```sql
create extension if not exists "pg_trgm";

-- Profiles (extends auth.users 1:1)
create table profiles (
  id             uuid references auth.users(id) on delete cascade primary key,
  username       text unique not null,
  full_name      text not null,
  avatar_url     text,
  bio            text,
  phone          text unique,
  phone_verified boolean default false,
  created_at     timestamptz default now()
);

-- Events
create table events (
  id              uuid primary key default gen_random_uuid(),
  created_by      uuid references profiles(id) on delete set null,
  name            text not null,
  venue_name      text not null,
  venue_address   text not null,
  city            text not null,
  lat             numeric,
  lng             numeric,
  starts_at       timestamptz not null,
  ends_at         timestamptz not null,
  category        text check (category in ('concert','sports','festival','conference','other')) not null,
  description     text,
  image_url       text,
  external_id     text,
  external_source text,
  created_at      timestamptz default now()
);

-- Vehicles
create table vehicles (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid references profiles(id) on delete cascade not null,
  make          text not null,
  model         text not null,
  year          integer not null check (year >= 1990 and year <= extract(year from now())::integer + 1),
  color         text not null,
  type          text check (type in ('sedan','suv','minivan','truck','coupe','hatchback','van')) not null,
  capacity      integer not null check (capacity >= 2 and capacity <= 11),
  seat_template jsonb not null,
  is_default    boolean default false,
  created_at    timestamptz default now()
);

-- Rides
create table rides (
  id                  uuid primary key default gen_random_uuid(),
  driver_id           uuid references profiles(id) on delete cascade not null,
  event_id            uuid references events(id) on delete cascade not null,
  vehicle_id          uuid references vehicles(id) on delete restrict not null,
  status              text check (status in ('draft','active','full','cancelled','completed')) default 'draft' not null,
  departure_address   text not null,
  departure_time      timestamptz not null,
  return_time         timestamptz,
  return_ride_id      uuid references rides(id),
  cost_per_person     numeric default 0 check (cost_per_person >= 0),
  is_paid             boolean generated always as (cost_per_person > 0) stored,
  notes               text,
  seat_map            jsonb not null,
  pickup_radius_miles numeric check (pickup_radius_miles > 0),
  created_at          timestamptz default now()
);

-- Ride Applications
create table ride_applications (
  id                    uuid primary key default gen_random_uuid(),
  ride_id               uuid references rides(id) on delete cascade not null,
  rider_id              uuid references profiles(id) on delete cascade not null,
  status                text check (status in ('pending','accepted','rejected','cancelled')) default 'pending' not null,
  seat_ids              text[] not null,
  message               text,
  custom_pickup_address text,
  cost_share            numeric default 0,
  created_at            timestamptz default now(),
  unique (ride_id, rider_id)
);

-- Friendships
create table friendships (
  id           uuid primary key default gen_random_uuid(),
  requester_id uuid references profiles(id) on delete cascade not null,
  addressee_id uuid references profiles(id) on delete cascade not null,
  status       text check (status in ('pending','accepted','rejected')) default 'pending' not null,
  created_at   timestamptz default now(),
  unique (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);

-- Ride Chats (auto-created when ride is published)
create table ride_chats (
  id         uuid primary key default gen_random_uuid(),
  ride_id    uuid references rides(id) on delete cascade unique not null,
  created_at timestamptz default now()
);

-- Ride Chat Members
create table ride_chat_members (
  chat_id uuid references ride_chats(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  primary key (chat_id, user_id)
);

-- Messages
create table messages (
  id         uuid primary key default gen_random_uuid(),
  chat_id    uuid references ride_chats(id) on delete cascade not null,
  sender_id  uuid references profiles(id) on delete cascade not null,
  content    text not null check (length(content) > 0),
  created_at timestamptz default now()
);

-- Indexes
create index events_city_idx       on events (city);
create index events_starts_at_idx  on events (starts_at);
create index events_category_idx   on events (category);
create index events_name_trgm_idx  on events using gin (name gin_trgm_ops);
create index events_venue_trgm_idx on events using gin (venue_name gin_trgm_ops);
create index rides_event_id_idx    on rides (event_id);
create index rides_driver_id_idx   on rides (driver_id);
create index rides_status_idx      on rides (status);
create index applications_ride_idx on ride_applications (ride_id);
create index applications_rider_idx on ride_applications (rider_id);
create index messages_chat_idx     on messages (chat_id, created_at);
```

- [ ] **Step 3: Write RLS policies migration**

Create `supabase/migrations/20260422000002_rls_policies.sql`:

```sql
alter table profiles          enable row level security;
alter table events            enable row level security;
alter table vehicles          enable row level security;
alter table rides             enable row level security;
alter table ride_applications enable row level security;
alter table friendships       enable row level security;
alter table ride_chats        enable row level security;
alter table ride_chat_members enable row level security;
alter table messages          enable row level security;

-- PROFILES
create policy "profiles_select" on profiles for select to authenticated using (true);
create policy "profiles_insert" on profiles for insert to authenticated with check (auth.uid() = id);
create policy "profiles_update" on profiles for update to authenticated using (auth.uid() = id);

-- EVENTS
create policy "events_select" on events for select to authenticated using (true);
create policy "events_insert" on events for insert to authenticated with check (auth.uid() = created_by);
create policy "events_update" on events for update to authenticated using (auth.uid() = created_by);

-- VEHICLES
create policy "vehicles_select" on vehicles for select to authenticated using (true);
create policy "vehicles_all"    on vehicles for all    to authenticated using (auth.uid() = owner_id);

-- RIDES
create policy "rides_select" on rides for select to authenticated
  using (status in ('active','full','completed') or auth.uid() = driver_id);
create policy "rides_all" on rides for all to authenticated using (auth.uid() = driver_id);

-- RIDE APPLICATIONS
create policy "applications_select" on ride_applications for select to authenticated
  using (auth.uid() = rider_id or
         auth.uid() = (select driver_id from rides where id = ride_id));
create policy "applications_insert" on ride_applications for insert to authenticated
  with check (auth.uid() = rider_id);
create policy "applications_rider_update" on ride_applications for update to authenticated
  using (auth.uid() = rider_id) with check (status = 'cancelled');
create policy "applications_driver_update" on ride_applications for update to authenticated
  using (auth.uid() = (select driver_id from rides where id = ride_id))
  with check (status in ('accepted','rejected'));

-- FRIENDSHIPS
create policy "friendships_select" on friendships for select to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id);
create policy "friendships_insert" on friendships for insert to authenticated
  with check (auth.uid() = requester_id);
create policy "friendships_update" on friendships for update to authenticated
  using (auth.uid() = addressee_id) with check (status in ('accepted','rejected'));

-- RIDE CHATS
create policy "chats_select" on ride_chats for select to authenticated
  using (exists (select 1 from ride_chat_members where chat_id = ride_chats.id and user_id = auth.uid()));

-- RIDE CHAT MEMBERS
create policy "members_select" on ride_chat_members for select to authenticated
  using (exists (select 1 from ride_chat_members m where m.chat_id = ride_chat_members.chat_id and m.user_id = auth.uid()));

-- MESSAGES
create policy "messages_select" on messages for select to authenticated
  using (exists (select 1 from ride_chat_members where chat_id = messages.chat_id and user_id = auth.uid()));
create policy "messages_insert" on messages for insert to authenticated
  with check (auth.uid() = sender_id and
    exists (select 1 from ride_chat_members where chat_id = messages.chat_id and user_id = auth.uid()));
```

- [ ] **Step 4: Write functions + triggers migration**

Create `supabase/migrations/20260422000003_functions_triggers.sql`:

```sql
-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Auto-create group chat when ride status changes to active
create or replace function handle_ride_published()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare v_chat_id uuid;
begin
  if new.status = 'active' and (old.status is null or old.status = 'draft') then
    insert into public.ride_chats (ride_id) values (new.id) returning id into v_chat_id;
    insert into public.ride_chat_members (chat_id, user_id) values (v_chat_id, new.driver_id);
  end if;
  return new;
end;
$$;

create trigger on_ride_published
  after insert or update of status on rides
  for each row execute function handle_ride_published();

-- Add accepted rider to group chat + remove rejected/cancelled
create or replace function handle_application_accepted()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare v_chat_id uuid;
begin
  select id into v_chat_id from public.ride_chats where ride_id = new.ride_id;
  if new.status = 'accepted' and old.status = 'pending' then
    insert into public.ride_chat_members (chat_id, user_id)
    values (v_chat_id, new.rider_id) on conflict do nothing;
  elsif new.status in ('rejected','cancelled') then
    delete from public.ride_chat_members where chat_id = v_chat_id and user_id = new.rider_id;
  end if;
  return new;
end;
$$;

create trigger on_application_status_change
  after update of status on ride_applications
  for each row execute function handle_application_accepted();

-- Update seat_map JSONB when application status changes
create or replace function sync_seat_map_on_application()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  v_seat_map jsonb;
  v_seat_id  text;
  v_new_status text;
begin
  select seat_map into v_seat_map from public.rides where id = new.ride_id;

  v_new_status := case new.status
    when 'accepted'  then 'occupied'
    when 'pending'   then 'reserved'
    else 'available'
  end;

  foreach v_seat_id in array new.seat_ids loop
    v_seat_map := jsonb_set(v_seat_map, array[v_seat_id, 'status'], to_jsonb(v_new_status));
  end loop;

  update public.rides set seat_map = v_seat_map where id = new.ride_id;
  return new;
end;
$$;

create trigger on_application_change
  after insert or update of status on ride_applications
  for each row execute function sync_seat_map_on_application();

-- Fuzzy event duplicate detection (called client-side before creating an event)
create or replace function find_similar_events(
  p_name     text,
  p_venue    text,
  p_starts_at timestamptz
)
returns table (id uuid, name text, venue_name text, starts_at timestamptz, score float)
language sql stable
as $$
  select
    e.id, e.name, e.venue_name, e.starts_at,
    (
      similarity(e.name, p_name) * 0.5 +
      similarity(e.venue_name, p_venue) * 0.3 +
      case when abs(extract(epoch from e.starts_at - p_starts_at)) < 86400 then 0.2 else 0 end
    ) as score
  from events e
  where similarity(e.name, p_name) > 0.3 or similarity(e.venue_name, p_venue) > 0.4
  order by score desc
  limit 5;
$$;
```

- [ ] **Step 5: Apply migrations**

```bash
supabase db push
```

Expected: "Finished supabase db push" with no errors.

- [ ] **Step 6: Generate TypeScript types**

```bash
supabase gen types typescript --linked > types/database.ts
```

Verify `types/database.ts` exports a `Database` type containing `Tables`, `Views`, and `Functions`.

- [ ] **Step 7: Commit**

```bash
git add supabase/ types/
git commit -m "feat: complete database schema, RLS policies, and functions/triggers"
```

---

### Task 3: Supabase Auth + Middleware

**Files:**
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `middleware.ts`
- Create: `app/page.tsx`
- Create: `app/auth/callback/route.ts`
- Create: `app/(auth)/login/page.tsx`
- Create: `app/(auth)/signup/page.tsx`
- Create: `app/(auth)/verify-email/page.tsx`

> **Google OAuth setup (do this before running the app):**
> 1. Supabase dashboard → Authentication → Providers → Google → Enable
> 2. Add your Google Client ID + Secret (from Google Cloud Console → APIs & Services → Credentials)
> 3. Copy the **Callback URL** shown in Supabase and paste it into Google Cloud Console → Authorized redirect URIs
> 4. The `handle_new_user` trigger auto-creates a profile; `full_name` comes from the Google account, `username` is auto-generated as `user_<8chars>` and can be edited later

- [ ] **Step 1: Write failing test for middleware redirect logic**

Create `lib/__tests__/middleware-logic.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'

const PROTECTED_PREFIXES = ['/events', '/rides', '/inbox', '/profile']
const PUBLIC_PATHS = ['/login', '/signup', '/verify-email']

function isProtected(path: string) {
  return PROTECTED_PREFIXES.some(p => path.startsWith(p))
}

function isPublicAuth(path: string) {
  return PUBLIC_PATHS.some(p => path.startsWith(p))
}

describe('middleware redirect logic', () => {
  it('protects /events', () => expect(isProtected('/events')).toBe(true))
  it('protects /rides/abc-123', () => expect(isProtected('/rides/abc-123')).toBe(true))
  it('protects /inbox', () => expect(isProtected('/inbox')).toBe(true))
  it('does not protect /login', () => expect(isProtected('/login')).toBe(false))
  it('recognises /signup as public auth page', () => expect(isPublicAuth('/signup')).toBe(true))
  it('does not treat /events as public auth page', () => expect(isPublicAuth('/events')).toBe(false))
})
```

- [ ] **Step 2: Run test — verify it passes**

```bash
npm run test:run lib/__tests__/middleware-logic.test.ts
```

Expected: PASS (6 tests) — this validates pure redirect logic before wiring into Next.js.

- [ ] **Step 3: Create browser Supabase client**

Create `lib/supabase/client.ts`:

```typescript
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 4: Create server Supabase client**

Create `lib/supabase/server.ts`:

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

- [ ] **Step 5: Create auth middleware**

Create `middleware.ts`:

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  const isAuthPage = ['/login', '/signup', '/verify-email'].some(p => pathname.startsWith(p))

  if (!user && !isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/events'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

- [ ] **Step 6: Create root redirect**

Create `app/page.tsx`:

```typescript
import { redirect } from 'next/navigation'

export default function RootPage() {
  redirect('/events')
}
```

- [ ] **Step 7: Create OAuth callback route**

Create `app/auth/callback/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/events'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Could+not+sign+in`)
}
```

- [ ] **Step 8: Create Login page**

Create `app/(auth)/login/page.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    router.push('/events')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-muted-foreground mt-2">Sign in to Caravn</p>
      </div>

      {/* Google — primary CTA */}
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full gap-3 mb-6"
        onClick={signInWithGoogle}
      >
        <GoogleIcon />
        Continue with Google
      </Button>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-background px-2 text-muted-foreground">or continue with email</span>
        </div>
      </div>

      <form onSubmit={handleLogin} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Don't have an account?{' '}
        <Link href="/signup" className="text-foreground underline underline-offset-4">
          Sign up
        </Link>
      </p>
    </div>
  )
}
```

- [ ] **Step 8: Create Signup page**

Create `app/(auth)/signup/page.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function signUpWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    router.push('/verify-email')
  }

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight">Create account</h1>
        <p className="text-muted-foreground mt-2">Join Caravn to find and share rides</p>
      </div>

      {/* Google — primary CTA */}
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full gap-3 mb-6"
        onClick={signUpWithGoogle}
      >
        <GoogleIcon />
        Continue with Google
      </Button>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-background px-2 text-muted-foreground">or sign up with email</span>
        </div>
      </div>

      <form onSubmit={handleSignup} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            type="text"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="Dana Miller"
            required
            autoComplete="name"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Min. 8 characters"
            minLength={8}
            required
            autoComplete="new-password"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="text-foreground underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </div>
  )
}
```

- [ ] **Step 9: Create verify-email screen**

Create `app/(auth)/verify-email/page.tsx`:

```typescript
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center px-6 py-12 text-center">
      <div className="text-5xl mb-6">✉️</div>
      <h1 className="text-2xl font-bold tracking-tight mb-3">Check your email</h1>
      <p className="text-muted-foreground mb-8 max-w-xs mx-auto">
        We sent a verification link to your inbox. Click it to activate your account.
      </p>
      <Button asChild variant="outline" className="mx-auto">
        <Link href="/login">Back to sign in</Link>
      </Button>
    </div>
  )
}
```

- [ ] **Step 10: Verify build**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 11: Commit**

```bash
git add app/ lib/ middleware.ts
git commit -m "feat: Supabase auth clients, middleware route protection, login/signup/verify pages"
```

---

### Task 4: App Shell + Bottom Navigation

**Files:**
- Create: `app/(app)/layout.tsx`
- Create: `components/layout/bottom-nav.tsx`
- Create: `components/layout/fab.tsx`
- Create: `app/(app)/events/page.tsx` (stub)
- Create: `app/(app)/rides/page.tsx` (stub)
- Create: `app/(app)/inbox/page.tsx` (stub)
- Create: `app/(app)/profile/page.tsx` (stub)

- [ ] **Step 1: Write failing test for BottomNav**

Create `components/layout/__tests__/bottom-nav.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { BottomNav } from '../bottom-nav'

vi.mock('next/navigation', () => ({
  usePathname: () => '/events',
}))

describe('BottomNav', () => {
  it('renders all 5 navigation items', () => {
    render(<BottomNav />)
    expect(screen.getByLabelText('Events')).toBeInTheDocument()
    expect(screen.getByLabelText('Rides')).toBeInTheDocument()
    expect(screen.getByLabelText('Add')).toBeInTheDocument()
    expect(screen.getByLabelText('Inbox')).toBeInTheDocument()
    expect(screen.getByLabelText('Profile')).toBeInTheDocument()
  })

  it('marks /events as active when pathname is /events', () => {
    render(<BottomNav />)
    expect(screen.getByLabelText('Events')).toHaveAttribute('aria-current', 'page')
  })

  it('does not mark Rides as active when on /events', () => {
    render(<BottomNav />)
    expect(screen.getByLabelText('Rides')).not.toHaveAttribute('aria-current', 'page')
  })
})
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npm run test:run components/layout/__tests__/bottom-nav.test.tsx
```

Expected: FAIL — "Cannot find module '../bottom-nav'"

- [ ] **Step 3: Create BottomNav component**

Create `components/layout/bottom-nav.tsx`:

```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CalendarDays, Car, MessageCircle, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/events',  label: 'Events',  icon: CalendarDays },
  { href: '/rides',   label: 'Rides',   icon: Car },
  { href: null,       label: 'Add',     icon: null },   // FAB slot
  { href: '/inbox',   label: 'Inbox',   icon: MessageCircle },
  { href: '/profile', label: 'Profile', icon: User },
] as const

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] border-t border-border bg-background z-40">
      <div className="flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.map(item => {
          if (!item.href) {
            return (
              <div key="fab-slot" className="w-14" aria-label="Add" />
            )
          }

          const isActive = pathname.startsWith(item.href)
          const Icon = item.icon!

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition-colors min-w-[44px]',
                isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 1.75} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
```

- [ ] **Step 4: Run test — verify it passes**

```bash
npm run test:run components/layout/__tests__/bottom-nav.test.tsx
```

Expected: PASS (3 tests)

- [ ] **Step 5: Write failing test for FAB**

Create `components/layout/__tests__/fab.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { FAB } from '../fab'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

describe('FAB', () => {
  it('renders the + button', () => {
    render(<FAB />)
    expect(screen.getByRole('button', { name: /open actions/i })).toBeInTheDocument()
  })

  it('opens bottom sheet with Find and Post options on tap', async () => {
    const user = userEvent.setup()
    render(<FAB />)
    await user.click(screen.getByRole('button', { name: /open actions/i }))
    expect(screen.getByText('Find a Ride')).toBeInTheDocument()
    expect(screen.getByText('Post a Ride')).toBeInTheDocument()
  })
})
```

- [ ] **Step 6: Run test — verify it fails**

```bash
npm run test:run components/layout/__tests__/fab.test.tsx
```

Expected: FAIL — "Cannot find module '../fab'"

- [ ] **Step 7: Create FAB component**

Create `components/layout/fab.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Car } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'

export function FAB() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  function handleFindRide() {
    setOpen(false)
    router.push('/rides?find=1')
  }

  function handlePostRide() {
    setOpen(false)
    router.push('/rides/new')
  }

  return (
    <>
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] h-16 z-50 pointer-events-none">
        <button
          onClick={() => setOpen(true)}
          aria-label="Open actions"
          className="absolute bottom-2 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-foreground text-background flex items-center justify-center shadow-xl transition-transform active:scale-95 pointer-events-auto"
        >
          <Plus className="h-6 w-6" strokeWidth={2.5} />
        </button>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl pb-10">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-left">What would you like to do?</SheetTitle>
          </SheetHeader>

          <div className="space-y-3">
            <Button
              variant="outline"
              size="lg"
              className="w-full justify-start gap-4 h-16 text-base"
              onClick={handleFindRide}
            >
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Search className="h-5 w-5" />
              </div>
              <div className="text-left">
                <div className="font-semibold">Find a Ride</div>
                <div className="text-xs text-muted-foreground font-normal">I need a ride to an event</div>
              </div>
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="w-full justify-start gap-4 h-16 text-base"
              onClick={handlePostRide}
            >
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Car className="h-5 w-5" />
              </div>
              <div className="text-left">
                <div className="font-semibold">Post a Ride</div>
                <div className="text-xs text-muted-foreground font-normal">I have seats to offer</div>
              </div>
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
```

- [ ] **Step 8: Run FAB test — verify it passes**

```bash
npm run test:run components/layout/__tests__/fab.test.tsx
```

Expected: PASS (2 tests)

- [ ] **Step 9: Create app shell layout**

Create `app/(app)/layout.tsx`:

```typescript
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BottomNav } from '@/components/layout/bottom-nav'
import { FAB } from '@/components/layout/fab'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="min-h-screen pb-20">
      {children}
      <BottomNav />
      <FAB />
    </div>
  )
}
```

- [ ] **Step 10: Create stub pages for each tab**

Create `app/(app)/events/page.tsx`:

```typescript
export default function EventsPage() {
  return (
    <div className="px-4 pt-6">
      <h1 className="text-2xl font-bold">Events</h1>
    </div>
  )
}
```

Create `app/(app)/rides/page.tsx`:

```typescript
export default function RidesPage() {
  return (
    <div className="px-4 pt-6">
      <h1 className="text-2xl font-bold">My Rides</h1>
    </div>
  )
}
```

Create `app/(app)/inbox/page.tsx`:

```typescript
export default function InboxPage() {
  return (
    <div className="px-4 pt-6">
      <h1 className="text-2xl font-bold">Inbox</h1>
    </div>
  )
}
```

Create `app/(app)/profile/page.tsx`:

```typescript
export default function ProfilePage() {
  return (
    <div className="px-4 pt-6">
      <h1 className="text-2xl font-bold">Profile</h1>
    </div>
  )
}
```

- [ ] **Step 11: Run all tests**

```bash
npm run test:run
```

Expected: PASS (all tests)

- [ ] **Step 12: Verify build**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 13: Commit**

```bash
git add app/ components/layout/
git commit -m "feat: app shell with Uber-style bottom nav, FAB with bottom sheet, and tab stubs"
```

---

---

### Task 5: Utility Functions (Seat Templates, Haversine, Cost Split)

**Files:**
- Create: `lib/seat-templates.ts`
- Create: `lib/haversine.ts`
- Create: `lib/cost-split.ts`
- Extend: `lib/__tests__/seat-templates.test.ts` (already started in Task 2)

The failing tests for seat-templates were written in Task 2 Step 2. Run them now to confirm they still fail before implementing.

- [ ] **Step 1: Confirm seat-template tests still fail**

```bash
npm run test:run lib/__tests__/seat-templates.test.ts
```

Expected: FAIL — "Cannot find module '../seat-templates'"

- [ ] **Step 2: Implement seat-templates.ts**

Create `lib/seat-templates.ts`:

```typescript
export type SeatStatus = 'available' | 'reserved' | 'occupied' | 'driver'

export type Seat = {
  id: string
  row: number
  position: number
  label: string
  isDriver: boolean
  x: number
  y: number
  status: SeatStatus
}

const VEHICLE_ROW_LAYOUTS: Record<string, number[]> = {
  sedan:    [2, 3],
  coupe:    [2, 2],
  hatchback:[2, 3],
  suv:      [2, 3, 2],
  minivan:  [2, 3, 3],
  van:      [2, 3, 3, 3],
  truck:    [2, 3],
}

const X_BY_COUNT: Record<number, number[]> = {
  1: [50],
  2: [25, 75],
  3: [15, 50, 85],
}

function yPositions(rowCount: number): number[] {
  if (rowCount === 2) return [22, 72]
  if (rowCount === 3) return [18, 50, 78]
  if (rowCount === 4) return [14, 38, 62, 84]
  return [50]
}

function seatLabel(rowIndex: number, position: number, seatsInRow: number): string {
  if (rowIndex === 0) return position === 0 ? 'Driver' : 'Front Passenger'
  const labels = seatsInRow === 3
    ? ['Rear Left', 'Rear Center', 'Rear Right']
    : ['Rear Left', 'Rear Right']
  return labels[position] ?? `Seat ${position + 1}`
}

export function generateSeatTemplate(vehicleType: string, capacity: number): Seat[] {
  const base = VEHICLE_ROW_LAYOUTS[vehicleType] ?? [2, 3]
  const layout = [...base]

  // trim layout to match capacity
  let total = layout.reduce((a, b) => a + b, 0)
  while (total > capacity && layout.length > 0) {
    const last = layout[layout.length - 1]!
    if (last > 1) {
      layout[layout.length - 1] = last - 1
    } else {
      layout.pop()
    }
    total = layout.reduce((a, b) => a + b, 0)
  }

  const ys = yPositions(layout.length)
  const seats: Seat[] = []

  layout.forEach((count, rowIndex) => {
    const xs = X_BY_COUNT[count] ?? X_BY_COUNT[2]!
    const y = ys[rowIndex] ?? 50

    for (let pos = 0; pos < count; pos++) {
      const isDriver = rowIndex === 0 && pos === 0
      seats.push({
        id: `r${rowIndex}s${pos}`,
        row: rowIndex,
        position: pos,
        label: seatLabel(rowIndex, pos, count),
        isDriver,
        x: xs[pos] ?? 50,
        y,
        status: isDriver ? 'driver' : 'available',
      })
    }
  })

  return seats
}

export function seatMapToRecord(seats: Seat[]): Record<string, Seat> {
  return Object.fromEntries(seats.map(s => [s.id, s]))
}
```

- [ ] **Step 3: Run seat-template tests — verify they pass**

```bash
npm run test:run lib/__tests__/seat-templates.test.ts
```

Expected: PASS (4 tests)

- [ ] **Step 4: Write haversine tests**

Create `lib/__tests__/haversine.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { haversineDistance, isWithinRadius } from '../haversine'

describe('haversineDistance', () => {
  it('returns 0 for same coordinates', () => {
    expect(haversineDistance(41.8781, -87.6298, 41.8781, -87.6298)).toBe(0)
  })

  it('calculates NYC to LA as roughly 2445 miles', () => {
    const dist = haversineDistance(40.7128, -74.006, 34.0522, -118.2437)
    expect(dist).toBeGreaterThan(2440)
    expect(dist).toBeLessThan(2460)
  })

  it('calculates short city distance correctly', () => {
    // Chicago Loop to Wrigley Field ≈ 6.3 miles
    const dist = haversineDistance(41.8827, -87.6233, 41.9484, -87.6553)
    expect(dist).toBeGreaterThan(5.5)
    expect(dist).toBeLessThan(7)
  })
})

describe('isWithinRadius', () => {
  it('returns true when point is within radius', () => {
    // 1 mile radius, ~0.5 mile apart
    expect(isWithinRadius(41.8781, -87.6298, 41.8853, -87.6298, 1)).toBe(true)
  })

  it('returns false when point is outside radius', () => {
    expect(isWithinRadius(41.8781, -87.6298, 41.9484, -87.6553, 2)).toBe(false)
  })
})
```

- [ ] **Step 5: Run haversine tests — verify they fail**

```bash
npm run test:run lib/__tests__/haversine.test.ts
```

Expected: FAIL — "Cannot find module '../haversine'"

- [ ] **Step 6: Implement haversine.ts**

Create `lib/haversine.ts`:

```typescript
const EARTH_RADIUS_MILES = 3958.8

export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return EARTH_RADIUS_MILES * 2 * Math.asin(Math.sqrt(a))
}

export function isWithinRadius(
  driverLat: number, driverLng: number,
  riderLat: number, riderLng: number,
  radiusMiles: number,
): boolean {
  return haversineDistance(driverLat, driverLng, riderLat, riderLng) <= radiusMiles
}
```

- [ ] **Step 7: Run haversine tests — verify they pass**

```bash
npm run test:run lib/__tests__/haversine.test.ts
```

Expected: PASS (5 tests)

- [ ] **Step 8: Write cost-split tests**

Create `lib/__tests__/cost-split.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { calculateCostShare } from '../cost-split'

describe('calculateCostShare', () => {
  it('returns 0 for free rides', () => {
    expect(calculateCostShare(0, 3)).toBe(0)
  })

  it('splits cost equally including driver (1 rider = 2-way split)', () => {
    expect(calculateCostShare(60, 1)).toBe(30)
  })

  it('splits cost equally including driver (3 riders = 4-way split)', () => {
    expect(calculateCostShare(60, 3)).toBe(15)
  })

  it('rounds to 2 decimal places', () => {
    // $10 / 3 people = $3.33
    expect(calculateCostShare(10, 2)).toBe(3.33)
  })

  it('returns 0 when no riders accepted yet', () => {
    expect(calculateCostShare(60, 0)).toBe(0)
  })
})
```

- [ ] **Step 9: Run cost-split tests — verify they fail**

```bash
npm run test:run lib/__tests__/cost-split.test.ts
```

Expected: FAIL — "Cannot find module '../cost-split'"

- [ ] **Step 10: Implement cost-split.ts**

Create `lib/cost-split.ts`:

```typescript
// rides.cost_per_person = total trip cost set by the driver
// Each participant (driver + accepted riders) splits equally
export function calculateCostShare(totalTripCost: number, acceptedRiderCount: number): number {
  if (totalTripCost === 0 || acceptedRiderCount === 0) return 0
  return Math.round((totalTripCost / (acceptedRiderCount + 1)) * 100) / 100
}
```

- [ ] **Step 11: Run cost-split tests — verify they pass**

```bash
npm run test:run lib/__tests__/cost-split.test.ts
```

Expected: PASS (5 tests)

- [ ] **Step 12: Run full test suite**

```bash
npm run test:run
```

Expected: PASS (all tests)

- [ ] **Step 13: Commit**

```bash
git add lib/
git commit -m "feat: seat template generator, haversine distance, and cost split utility"
```

---

### Task 6: Profile Page + Phone Verification

**Files:**
- Modify: `app/(app)/profile/page.tsx` (replace stub)
- Create: `app/(app)/profile/edit/page.tsx`
- Create: `app/(app)/profile/verify-phone/page.tsx`
- Create: `components/profile/profile-header.tsx`

- [ ] **Step 1: Write failing test for ProfileHeader**

Create `components/profile/__tests__/profile-header.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ProfileHeader } from '../profile-header'

describe('ProfileHeader', () => {
  const profile = {
    full_name: 'Dana Miller',
    username: 'danamiller',
    bio: 'Love live music and road trips',
    phone_verified: true,
    avatar_url: null,
  }

  it('renders full name and username', () => {
    render(<ProfileHeader profile={profile} />)
    expect(screen.getByText('Dana Miller')).toBeInTheDocument()
    expect(screen.getByText('@danamiller')).toBeInTheDocument()
  })

  it('renders bio when present', () => {
    render(<ProfileHeader profile={profile} />)
    expect(screen.getByText('Love live music and road trips')).toBeInTheDocument()
  })

  it('shows phone verified badge when phone_verified is true', () => {
    render(<ProfileHeader profile={profile} />)
    expect(screen.getByText('Phone verified')).toBeInTheDocument()
  })

  it('shows verify phone prompt when phone not verified', () => {
    render(<ProfileHeader profile={{ ...profile, phone_verified: false }} />)
    expect(screen.getByText('Verify phone')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npm run test:run components/profile/__tests__/profile-header.test.tsx
```

Expected: FAIL — "Cannot find module '../profile-header'"

- [ ] **Step 3: Create ProfileHeader component**

Create `components/profile/profile-header.tsx`:

```typescript
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

type Props = {
  profile: {
    full_name: string
    username: string
    bio: string | null
    phone_verified: boolean
    avatar_url: string | null
  }
}

export function ProfileHeader({ profile }: Props) {
  return (
    <div className="flex flex-col items-center text-center pt-8 pb-6 px-4">
      <Avatar className="w-20 h-20 mb-4">
        {profile.avatar_url && <AvatarImage src={profile.avatar_url} />}
        <AvatarFallback className="text-2xl bg-muted">
          {profile.full_name.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <h1 className="text-xl font-bold">{profile.full_name}</h1>
      <p className="text-muted-foreground text-sm mb-3">@{profile.username}</p>

      {profile.bio && (
        <p className="text-sm text-muted-foreground max-w-xs mb-3">{profile.bio}</p>
      )}

      {profile.phone_verified ? (
        <Badge variant="outline" className="text-xs text-green-400 border-green-800">
          Phone verified
        </Badge>
      ) : (
        <Link
          href="/profile/verify-phone"
          className="text-xs text-muted-foreground underline underline-offset-4"
        >
          Verify phone
        </Link>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run test — verify it passes**

```bash
npm run test:run components/profile/__tests__/profile-header.test.tsx
```

Expected: PASS (4 tests)

- [ ] **Step 5: Replace profile page stub with real page**

Replace `app/(app)/profile/page.tsx`:

```typescript
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ProfileHeader } from '@/components/profile/profile-header'
import { Button } from '@/components/ui/button'
import { ChevronRight, Car, Users, LogOut } from 'lucide-react'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, username, bio, phone_verified, avatar_url')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  async function signOut() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="pb-8">
      <ProfileHeader profile={profile} />

      <div className="px-4 space-y-2 mt-2">
        <Link
          href="/profile/edit"
          className="flex items-center justify-between w-full px-4 py-3.5 rounded-xl bg-card border border-border"
        >
          <span className="text-sm font-medium">Edit Profile</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>

        <Link
          href="/profile/vehicles"
          className="flex items-center justify-between w-full px-4 py-3.5 rounded-xl bg-card border border-border"
        >
          <div className="flex items-center gap-3">
            <Car className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">My Vehicles</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>

        <Link
          href="/profile/friends"
          className="flex items-center justify-between w-full px-4 py-3.5 rounded-xl bg-card border border-border"
        >
          <div className="flex items-center gap-3">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Friends</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>

        <form action={signOut} className="mt-6">
          <Button type="submit" variant="outline" className="w-full gap-2 text-red-400 border-red-900 hover:text-red-300">
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Create edit profile page**

Create `app/(app)/profile/edit/page.tsx`:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export default function EditProfilePage() {
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('profiles')
        .select('full_name, username, bio')
        .eq('id', user.id)
        .single()

      if (data) {
        setFullName(data.full_name)
        setUsername(data.username)
        setBio(data.bio ?? '')
      }
    }
    load()
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, username, bio: bio || null })
      .eq('id', user.id)

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/profile')
    router.refresh()
  }

  return (
    <div className="px-4 pt-6">
      <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>

      <form onSubmit={handleSave} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value={username}
            onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder="Tell riders a bit about yourself"
            rows={3}
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Saving…' : 'Save changes'}
        </Button>
      </form>
    </div>
  )
}
```

- [ ] **Step 7: Create phone verification page**

Create `app/(app)/profile/verify-phone/page.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function VerifyPhonePage() {
  const [step, setStep] = useState<'enter-phone' | 'enter-otp'>('enter-phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Normalise to E.164 (basic: assume US if no country code)
    const normalised = phone.startsWith('+') ? phone : `+1${phone.replace(/\D/g, '')}`

    const { error } = await supabase.auth.updateUser({ phone: normalised })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setStep('enter-otp')
    setLoading(false)
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const normalised = phone.startsWith('+') ? phone : `+1${phone.replace(/\D/g, '')}`

    const { error: verifyError } = await supabase.auth.verifyOtp({
      phone: normalised,
      token: otp,
      type: 'phone_change',
    })

    if (verifyError) {
      setError(verifyError.message)
      setLoading(false)
      return
    }

    // Mark phone as verified in profiles table
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('profiles')
        .update({ phone: normalised, phone_verified: true })
        .eq('id', user.id)
    }

    router.push('/profile')
    router.refresh()
  }

  if (step === 'enter-otp') {
    return (
      <div className="px-4 pt-6">
        <h1 className="text-2xl font-bold mb-2">Enter code</h1>
        <p className="text-muted-foreground text-sm mb-6">
          We sent a 6-digit code to {phone}
        </p>

        <form onSubmit={verifyOtp} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="otp">Verification code</Label>
            <Input
              id="otp"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              required
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading || otp.length < 6}>
            {loading ? 'Verifying…' : 'Verify'}
          </Button>

          <button
            type="button"
            onClick={() => setStep('enter-phone')}
            className="w-full text-sm text-muted-foreground underline underline-offset-4"
          >
            Use a different number
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="px-4 pt-6">
      <h1 className="text-2xl font-bold mb-2">Verify your phone</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Required to apply for or post rides
      </p>

      <form onSubmit={sendOtp} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone number</Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="+1 (555) 000-0000"
            required
            autoComplete="tel"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Sending code…' : 'Send code'}
        </Button>
      </form>
    </div>
  )
}
```

- [ ] **Step 8: Verify build**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 9: Commit**

```bash
git add app/(app)/profile/ components/profile/
git commit -m "feat: profile page, edit profile form, and phone verification flow"
```

---

### Task 7: Events Directory (List + Search)

**Files:**
- Modify: `app/(app)/events/page.tsx` (replace stub)
- Create: `components/events/event-card.tsx`
- Create: `components/events/event-search.tsx`

- [ ] **Step 1: Write failing test for EventCard**

Create `components/events/__tests__/event-card.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { EventCard } from '../event-card'

const event = {
  id: 'evt-1',
  name: 'Taylor Swift — Eras Tour',
  venue_name: 'Wrigley Field',
  city: 'Chicago',
  starts_at: '2026-07-15T19:00:00Z',
  category: 'concert' as const,
  image_url: null,
  ride_count: 4,
}

describe('EventCard', () => {
  it('renders event name', () => {
    render(<EventCard event={event} />)
    expect(screen.getByText('Taylor Swift — Eras Tour')).toBeInTheDocument()
  })

  it('renders venue and city', () => {
    render(<EventCard event={event} />)
    expect(screen.getByText(/Wrigley Field/)).toBeInTheDocument()
    expect(screen.getByText(/Chicago/)).toBeInTheDocument()
  })

  it('renders ride count', () => {
    render(<EventCard event={event} />)
    expect(screen.getByText(/4 rides/)).toBeInTheDocument()
  })

  it('renders 0 rides text when no rides', () => {
    render(<EventCard event={{ ...event, ride_count: 0 }} />)
    expect(screen.getByText(/No rides yet/)).toBeInTheDocument()
  })

  it('renders category badge', () => {
    render(<EventCard event={event} />)
    expect(screen.getByText('concert')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npm run test:run components/events/__tests__/event-card.test.tsx
```

Expected: FAIL — "Cannot find module '../event-card'"

- [ ] **Step 3: Create EventCard component**

Create `components/events/event-card.tsx`:

```typescript
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { CalendarDays, MapPin } from 'lucide-react'

type EventCardProps = {
  event: {
    id: string
    name: string
    venue_name: string
    city: string
    starts_at: string
    category: string
    image_url: string | null
    ride_count: number
  }
}

export function EventCard({ event }: EventCardProps) {
  const date = new Date(event.starts_at)
  const dateStr = date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })

  return (
    <Link
      href={`/events/${event.id}`}
      className="block bg-card border border-border rounded-xl p-4 active:opacity-80 transition-opacity"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-semibold text-base leading-snug flex-1">{event.name}</h3>
        <Badge variant="outline" className="text-xs shrink-0 capitalize">
          {event.category}
        </Badge>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5 shrink-0" />
          <span>{dateStr} · {timeStr}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span>{event.venue_name} · {event.city}</span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-border">
        <span className="text-xs font-medium">
          {event.ride_count > 0 ? (
            <span className="text-green-400">{event.ride_count} ride{event.ride_count !== 1 ? 's' : ''} available</span>
          ) : (
            <span className="text-muted-foreground">No rides yet — be the first!</span>
          )}
        </span>
      </div>
    </Link>
  )
}
```

- [ ] **Step 4: Run EventCard test — verify it passes**

```bash
npm run test:run components/events/__tests__/event-card.test.tsx
```

Expected: PASS (5 tests)

- [ ] **Step 5: Create EventSearch component**

Create `components/events/event-search.tsx`:

```typescript
'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

export function EventSearch() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams],
  )

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        defaultValue={searchParams.get('q') ?? ''}
        onChange={e => updateParam('q', e.target.value)}
        placeholder="Search events, venues…"
        className="pl-9"
      />
    </div>
  )
}
```

- [ ] **Step 6: Replace events page stub with real page**

Replace `app/(app)/events/page.tsx`:

```typescript
import { Suspense } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { EventCard } from '@/components/events/event-card'
import { EventSearch } from '@/components/events/event-search'

type SearchParams = {
  q?: string
  city?: string
  category?: string
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const { q, city, category } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('events')
    .select('id, name, venue_name, city, starts_at, category, image_url, rides(id)')
    .gte('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true })
    .limit(50)

  if (city) query = query.ilike('city', `%${city}%`)
  if (category) query = query.eq('category', category)
  if (q) {
    query = query.or(`name.ilike.%${q}%,venue_name.ilike.%${q}%,city.ilike.%${q}%`)
  }

  const { data: rawEvents } = await query

  const events = (rawEvents ?? []).map(e => ({
    ...e,
    ride_count: Array.isArray(e.rides) ? e.rides.length : 0,
  }))

  return (
    <div className="px-4 pt-6 pb-4">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold">Events</h1>
        <Link
          href="/events/new"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add event
        </Link>
      </div>

      <Suspense fallback={null}>
        <div className="mb-4">
          <EventSearch />
        </div>
      </Suspense>

      {events.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-sm">
            {q || city || category ? 'No events match your search.' : 'No upcoming events yet.'}
          </p>
          <Link href="/events/new" className="text-sm underline underline-offset-4 mt-2 inline-block">
            Create the first one
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map(event => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 7: Run all tests**

```bash
npm run test:run
```

Expected: PASS (all tests)

- [ ] **Step 8: Verify build**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 9: Commit**

```bash
git add app/(app)/events/ components/events/
git commit -m "feat: events directory with search, EventCard component, and server-side filtering"
```

---

### Task 8: Event Detail + Create Event (with Duplicate Detection)

**Files:**
- Create: `app/(app)/events/[id]/page.tsx`
- Create: `app/(app)/events/new/page.tsx`
- Create: `components/events/create-event-form.tsx`

- [ ] **Step 1: Create event detail page**

Create `app/(app)/events/[id]/page.tsx`:

```typescript
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { CalendarDays, MapPin, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RideCard } from '@/components/rides/ride-card'

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single()

  if (!event) notFound()

  const { data: rides } = await supabase
    .from('rides')
    .select(`
      id, departure_address, departure_time, cost_per_person, is_paid,
      seat_map, status, notes, pickup_radius_miles,
      driver:profiles!driver_id(id, full_name, username, avatar_url, phone_verified),
      vehicle:vehicles!vehicle_id(make, model, year, color, type, capacity)
    `)
    .eq('event_id', id)
    .in('status', ['active', 'full'])
    .order('departure_time', { ascending: true })

  const startDate = new Date(event.starts_at)
  const dateStr = startDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
  const timeStr = startDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="px-4 pt-6 pb-5 border-b border-border">
        <div className="flex items-start justify-between gap-3 mb-4">
          <h1 className="text-xl font-bold leading-snug flex-1">{event.name}</h1>
          <Badge variant="outline" className="capitalize shrink-0">{event.category}</Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4 shrink-0" />
            <span>{dateStr} at {timeStr}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span>{event.venue_name} · {event.city}</span>
          </div>
        </div>

        {event.description && (
          <p className="mt-4 text-sm text-muted-foreground">{event.description}</p>
        )}
      </div>

      {/* Rides section */}
      <div className="px-4 pt-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">
            Rides ({rides?.length ?? 0})
          </h2>
          <Button asChild size="sm" variant="outline" className="gap-1.5">
            <Link href={`/rides/new?event=${event.id}`}>
              <Plus className="h-3.5 w-3.5" />
              Post ride
            </Link>
          </Button>
        </div>

        {!rides || rides.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border rounded-xl">
            <p className="text-sm text-muted-foreground mb-3">No rides posted yet</p>
            <Button asChild size="sm">
              <Link href={`/rides/new?event=${event.id}`}>Post the first ride</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {rides.map(ride => (
              <RideCard key={ride.id} ride={ride as any} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

Note: `RideCard` is a stub that will be implemented in Task 9. Create a placeholder now:

Create `components/rides/ride-card.tsx`:

```typescript
import Link from 'next/link'
import { Car } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

type RideCardProps = {
  ride: {
    id: string
    departure_address: string
    departure_time: string
    cost_per_person: number
    is_paid: boolean
    status: string
    seat_map: Record<string, { status: string; isDriver: boolean }>
  }
}

export function RideCard({ ride }: RideCardProps) {
  const availableSeats = Object.values(ride.seat_map).filter(
    s => !s.isDriver && s.status === 'available'
  ).length

  const timeStr = new Date(ride.departure_time).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })

  return (
    <Link
      href={`/rides/${ride.id}`}
      className="block bg-card border border-border rounded-xl p-4 active:opacity-80 transition-opacity"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <Car className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium">Departs {timeStr}</span>
        </div>
        <Badge variant={ride.status === 'full' ? 'secondary' : 'outline'} className="text-xs">
          {ride.status === 'full' ? 'Full' : `${availableSeats} seat${availableSeats !== 1 ? 's' : ''}`}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground ml-6">{ride.departure_address}</p>
      <p className="text-xs font-medium mt-2 ml-6">
        {ride.is_paid ? `$${ride.cost_per_person} / person` : 'Free ride'}
      </p>
    </Link>
  )
}
```

- [ ] **Step 2: Write failing test for CreateEventForm**

Create `components/events/__tests__/create-event-form.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { CreateEventForm } from '../create-event-form'

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ data: [{ id: 'new-evt-1' }], error: null }),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'new-evt-1' }, error: null }),
    })),
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
  }),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

describe('CreateEventForm', () => {
  it('renders all required fields', () => {
    render(<CreateEventForm />)
    expect(screen.getByLabelText(/event name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/venue name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/venue address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/city/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/start date/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/end date/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument()
  })

  it('submit button is present', () => {
    render(<CreateEventForm />)
    expect(screen.getByRole('button', { name: /create event/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 3: Run test — verify it fails**

```bash
npm run test:run components/events/__tests__/create-event-form.test.tsx
```

Expected: FAIL — "Cannot find module '../create-event-form'"

- [ ] **Step 4: Create CreateEventForm component**

Create `components/events/create-event-form.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

type SimilarEvent = {
  id: string
  name: string
  venue_name: string
  starts_at: string
  score: number
}

const CATEGORIES = ['concert', 'sports', 'festival', 'conference', 'other'] as const

export function CreateEventForm() {
  const [name, setName] = useState('')
  const [venueName, setVenueName] = useState('')
  const [venueAddress, setVenueAddress] = useState('')
  const [city, setCity] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [category, setCategory] = useState<typeof CATEGORIES[number]>('concert')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [similarEvents, setSimilarEvents] = useState<SimilarEvent[]>([])
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false)
  const [pendingSubmit, setPendingSubmit] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function checkDuplicatesAndSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data: similar } = await supabase.rpc('find_similar_events', {
      p_name: name,
      p_venue: venueName,
      p_starts_at: startsAt,
    })

    if (similar && similar.length > 0) {
      setSimilarEvents(similar as SimilarEvent[])
      setShowDuplicateDialog(true)
      setLoading(false)
      return
    }

    await createEvent()
  }

  async function createEvent() {
    setLoading(true)
    setShowDuplicateDialog(false)
    setPendingSubmit(false)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('events')
      .insert({
        created_by: user.id,
        name,
        venue_name: venueName,
        venue_address: venueAddress,
        city,
        starts_at: startsAt,
        ends_at: endsAt,
        category,
        description: description || null,
      })
      .select('id')
      .single()

    if (error || !data) {
      setError(error?.message ?? 'Failed to create event')
      setLoading(false)
      return
    }

    router.push(`/events/${data.id}`)
  }

  function useExistingEvent(id: string) {
    setShowDuplicateDialog(false)
    router.push(`/events/${id}`)
  }

  return (
    <>
      <form onSubmit={checkDuplicatesAndSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="name">Event name</Label>
          <Input
            id="name"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Taylor Swift — Eras Tour"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="venueName">Venue name</Label>
          <Input
            id="venueName"
            value={venueName}
            onChange={e => setVenueName(e.target.value)}
            placeholder="Wrigley Field"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="venueAddress">Venue address</Label>
          <Input
            id="venueAddress"
            value={venueAddress}
            onChange={e => setVenueAddress(e.target.value)}
            placeholder="1060 W Addison St"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={city}
            onChange={e => setCity(e.target.value)}
            placeholder="Chicago"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="startsAt">Start date & time</Label>
            <Input
              id="startsAt"
              type="datetime-local"
              value={startsAt}
              onChange={e => setStartsAt(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="endsAt">End date & time</Label>
            <Input
              id="endsAt"
              type="datetime-local"
              value={endsAt}
              onChange={e => setEndsAt(e.target.value)}
              min={startsAt}
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="category">Category</Label>
          <Select value={category} onValueChange={v => setCategory(v as typeof CATEGORIES[number])}>
            <SelectTrigger id="category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(c => (
                <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Description (optional)</Label>
          <Textarea
            id="description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Any details about the event…"
            rows={3}
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? 'Checking…' : 'Create event'}
        </Button>
      </form>

      <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Similar events found</DialogTitle>
            <DialogDescription>
              These events look similar to what you're adding. Use an existing one or create a new entry.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 my-2">
            {similarEvents.map(evt => (
              <button
                key={evt.id}
                onClick={() => useExistingEvent(evt.id)}
                className="w-full text-left p-3 rounded-lg border border-border hover:bg-muted transition-colors"
              >
                <p className="text-sm font-medium">{evt.name}</p>
                <p className="text-xs text-muted-foreground">{evt.venue_name}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(evt.starts_at).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                  })}
                </p>
              </button>
            ))}
          </div>

          <Button onClick={createEvent} variant="outline" className="w-full" disabled={loading}>
            {loading ? 'Creating…' : 'Create anyway'}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  )
}
```

- [ ] **Step 5: Create the new event page**

Create `app/(app)/events/new/page.tsx`:

```typescript
import { CreateEventForm } from '@/components/events/create-event-form'

export default function NewEventPage() {
  return (
    <div className="px-4 pt-6 pb-8">
      <h1 className="text-2xl font-bold mb-6">Add Event</h1>
      <CreateEventForm />
    </div>
  )
}
```

- [ ] **Step 6: Run CreateEventForm test — verify it passes**

```bash
npm run test:run components/events/__tests__/create-event-form.test.tsx
```

Expected: PASS (2 tests)

- [ ] **Step 7: Run full test suite**

```bash
npm run test:run
```

Expected: PASS (all tests)

- [ ] **Step 8: Verify build**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 9: Commit**

```bash
git add app/(app)/events/ components/events/ components/rides/ride-card.tsx
git commit -m "feat: event detail page, create event form with fuzzy duplicate detection, RideCard stub"
```

---

---

### Task 9: Vehicle Registration + Live Seat Preview

**Files:**
- Create: `components/vehicles/vehicle-card.tsx`
- Create: `components/vehicles/vehicle-form.tsx`
- Modify: `app/(app)/profile/vehicles/page.tsx` (replace stub)
- Create: `app/(app)/profile/vehicles/new/page.tsx`

- [ ] **Step 1: Write failing test for VehicleCard**

Create `components/vehicles/__tests__/vehicle-card.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { VehicleCard } from '../vehicle-card'

const vehicle = {
  id: 'v1',
  make: 'Toyota',
  model: 'Camry',
  year: 2022,
  color: 'Silver',
  type: 'sedan',
  capacity: 5,
  is_default: false,
}

describe('VehicleCard', () => {
  it('renders year, make, model', () => {
    render(<VehicleCard vehicle={vehicle} />)
    expect(screen.getByText('2022 Toyota Camry')).toBeInTheDocument()
  })

  it('renders color, type, capacity', () => {
    render(<VehicleCard vehicle={vehicle} />)
    expect(screen.getByText(/Silver/)).toBeInTheDocument()
    expect(screen.getByText(/sedan/)).toBeInTheDocument()
    expect(screen.getByText(/5 seats/)).toBeInTheDocument()
  })

  it('shows Default badge when is_default is true', () => {
    render(<VehicleCard vehicle={{ ...vehicle, is_default: true }} />)
    expect(screen.getByText('Default')).toBeInTheDocument()
  })

  it('does not show Default badge when is_default is false', () => {
    render(<VehicleCard vehicle={vehicle} />)
    expect(screen.queryByText('Default')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npm run test:run components/vehicles/__tests__/vehicle-card.test.tsx
```

Expected: FAIL — "Cannot find module '../vehicle-card'"

- [ ] **Step 3: Create VehicleCard component**

Create `components/vehicles/vehicle-card.tsx`:

```typescript
import { Car } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

type VehicleCardProps = {
  vehicle: {
    id: string
    make: string
    model: string
    year: number
    color: string
    type: string
    capacity: number
    is_default: boolean
  }
  onSetDefault?: (id: string) => void
}

export function VehicleCard({ vehicle, onSetDefault }: VehicleCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
            <Car className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-sm">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              {vehicle.color} · {vehicle.type} · {vehicle.capacity} seats
            </p>
          </div>
        </div>
        {vehicle.is_default && (
          <Badge variant="outline" className="text-xs shrink-0">Default</Badge>
        )}
      </div>

      {onSetDefault && !vehicle.is_default && (
        <button
          onClick={() => onSetDefault(vehicle.id)}
          className="mt-3 text-xs text-muted-foreground underline underline-offset-4"
        >
          Set as default
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run VehicleCard test — verify it passes**

```bash
npm run test:run components/vehicles/__tests__/vehicle-card.test.tsx
```

Expected: PASS (4 tests)

- [ ] **Step 5: Write failing test for VehicleForm**

Create `components/vehicles/__tests__/vehicle-form.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { VehicleForm } from '../vehicle-form'

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn().mockResolvedValue({ error: null }),
    })),
  }),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}))

describe('VehicleForm', () => {
  it('renders all required fields', () => {
    render(<VehicleForm />)
    expect(screen.getByLabelText(/make/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/model/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/year/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/color/i)).toBeInTheDocument()
  })

  it('shows seat preview section', () => {
    render(<VehicleForm />)
    expect(screen.getByText(/seat preview/i)).toBeInTheDocument()
  })

  it('renders submit button', () => {
    render(<VehicleForm />)
    expect(screen.getByRole('button', { name: /save vehicle/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 6: Run test — verify it fails**

```bash
npm run test:run components/vehicles/__tests__/vehicle-form.test.tsx
```

Expected: FAIL — "Cannot find module '../vehicle-form'"

- [ ] **Step 7: Create VehicleForm component**

Create `components/vehicles/vehicle-form.tsx`:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { generateSeatTemplate, type Seat } from '@/lib/seat-templates'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

const VEHICLE_TYPES = ['sedan', 'suv', 'minivan', 'truck', 'coupe', 'hatchback', 'van'] as const
type VehicleType = typeof VEHICLE_TYPES[number]

const MAX_CAPACITY: Record<VehicleType, number> = {
  sedan: 5, coupe: 4, hatchback: 5, suv: 7, minivan: 8, van: 11, truck: 5,
}

function SeatPreview({ seats }: { seats: Seat[] }) {
  const rows = [...new Set(seats.map(s => s.row))].sort((a, b) => a - b)
  const passengerCount = seats.filter(s => !s.isDriver).length

  return (
    <div className="bg-muted/50 border border-border rounded-xl p-4">
      <p className="text-xs text-muted-foreground mb-3 text-center">Seat preview</p>
      <div className="flex flex-col items-center gap-2">
        {rows.map(row => {
          const rowSeats = seats.filter(s => s.row === row)
          return (
            <div key={row} className="flex gap-2">
              {rowSeats.map(seat => (
                <div
                  key={seat.id}
                  title={seat.label}
                  className={cn(
                    'w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-bold',
                    seat.isDriver
                      ? 'bg-foreground border-foreground text-background'
                      : 'bg-transparent border-muted-foreground/40 text-muted-foreground',
                  )}
                >
                  {seat.isDriver ? '▲' : ''}
                </div>
              ))}
            </div>
          )
        })}
      </div>
      <p className="text-xs text-muted-foreground mt-3 text-center">
        {passengerCount} passenger seat{passengerCount !== 1 ? 's' : ''}
      </p>
    </div>
  )
}

export function VehicleForm() {
  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState(new Date().getFullYear().toString())
  const [color, setColor] = useState('')
  const [type, setType] = useState<VehicleType>('sedan')
  const [capacity, setCapacity] = useState(5)
  const [previewSeats, setPreviewSeats] = useState<Seat[]>(() => generateSeatTemplate('sedan', 5))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    setPreviewSeats(generateSeatTemplate(type, capacity))
  }, [type, capacity])

  useEffect(() => {
    setCapacity(c => Math.min(c, MAX_CAPACITY[type]))
  }, [type])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const seatTemplate = generateSeatTemplate(type, capacity)

    const { data: existing } = await supabase
      .from('vehicles')
      .select('id')
      .eq('owner_id', user.id)

    const isDefault = !existing || existing.length === 0

    const { error } = await supabase.from('vehicles').insert({
      owner_id: user.id,
      make,
      model,
      year: parseInt(year),
      color,
      type,
      capacity,
      seat_template: seatTemplate,
      is_default: isDefault,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/profile/vehicles')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="make">Make</Label>
          <Input
            id="make"
            value={make}
            onChange={e => setMake(e.target.value)}
            placeholder="Toyota"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="model">Model</Label>
          <Input
            id="model"
            value={model}
            onChange={e => setModel(e.target.value)}
            placeholder="Camry"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="year">Year</Label>
          <Input
            id="year"
            type="number"
            value={year}
            onChange={e => setYear(e.target.value)}
            min={1990}
            max={new Date().getFullYear() + 1}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="color">Color</Label>
          <Input
            id="color"
            value={color}
            onChange={e => setColor(e.target.value)}
            placeholder="Silver"
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="type">Vehicle type</Label>
        <Select value={type} onValueChange={v => setType(v as VehicleType)}>
          <SelectTrigger id="type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {VEHICLE_TYPES.map(t => (
              <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="capacity">Total seats (including driver)</Label>
        <Input
          id="capacity"
          type="number"
          value={capacity}
          onChange={e =>
            setCapacity(Math.max(2, Math.min(parseInt(e.target.value) || 2, MAX_CAPACITY[type])))
          }
          min={2}
          max={MAX_CAPACITY[type]}
          required
        />
      </div>

      <SeatPreview seats={previewSeats} />

      {error && <p className="text-sm text-red-400">{error}</p>}

      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? 'Saving…' : 'Save vehicle'}
      </Button>
    </form>
  )
}
```

- [ ] **Step 8: Run VehicleForm test — verify it passes**

```bash
npm run test:run components/vehicles/__tests__/vehicle-form.test.tsx
```

Expected: PASS (3 tests)

- [ ] **Step 9: Create vehicle list page**

Replace `app/(app)/profile/vehicles/page.tsx`:

```typescript
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { VehicleCard } from '@/components/vehicles/vehicle-card'
import { Button } from '@/components/ui/button'

type Vehicle = {
  id: string
  make: string
  model: string
  year: number
  color: string
  type: string
  capacity: number
  is_default: boolean
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('vehicles')
        .select('id, make, model, year, color, type, capacity, is_default')
        .eq('owner_id', user.id)
        .order('is_default', { ascending: false })
      setVehicles(data ?? [])
    }
    load()
  }, [])

  async function setDefault(vehicleId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('vehicles').update({ is_default: false }).eq('owner_id', user.id)
    await supabase.from('vehicles').update({ is_default: true }).eq('id', vehicleId)
    setVehicles(prev => prev.map(v => ({ ...v, is_default: v.id === vehicleId })))
  }

  return (
    <div className="px-4 pt-6 pb-8">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold">My Vehicles</h1>
        <Button asChild size="sm" variant="outline" className="gap-1.5">
          <Link href="/profile/vehicles/new">
            <Plus className="h-4 w-4" />
            Add
          </Link>
        </Button>
      </div>

      {vehicles.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-xl">
          <p className="text-sm text-muted-foreground mb-3">No vehicles yet</p>
          <Button asChild size="sm">
            <Link href="/profile/vehicles/new">Add your first vehicle</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {vehicles.map(v => (
            <VehicleCard key={v.id} vehicle={v} onSetDefault={setDefault} />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 10: Create add vehicle page**

Create `app/(app)/profile/vehicles/new/page.tsx`:

```typescript
import { VehicleForm } from '@/components/vehicles/vehicle-form'

export default function NewVehiclePage() {
  return (
    <div className="px-4 pt-6 pb-8">
      <h1 className="text-2xl font-bold mb-6">Add Vehicle</h1>
      <VehicleForm />
    </div>
  )
}
```

- [ ] **Step 11: Run all tests**

```bash
npm run test:run
```

Expected: PASS (all tests)

- [ ] **Step 12: Verify build**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 13: Commit**

```bash
git add components/vehicles/ app/(app)/profile/vehicles/
git commit -m "feat: vehicle registration with live seat preview, vehicle list with set-default"
```

---

### Task 10: Interactive Seat Map Component

**Files:**
- Modify: `components/rides/seat-map.tsx` (full implementation, replaces placeholder)
- Create: `components/rides/__tests__/seat-map.test.tsx`
- Modify: `lib/seat-templates.ts` (add `seatRecordToArray` helper)
- Modify: `lib/__tests__/seat-templates.test.ts` (add round-trip test)

- [ ] **Step 1: Write failing tests for SeatMap**

Create `components/rides/__tests__/seat-map.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { SeatMap } from '../seat-map'
import { generateSeatTemplate } from '@/lib/seat-templates'

const seats = generateSeatTemplate('sedan', 5)

describe('SeatMap', () => {
  it('renders a button for every seat', () => {
    render(<SeatMap seats={seats} readOnly />)
    expect(screen.getAllByRole('button')).toHaveLength(5)
  })

  it('driver seat is labelled Driver', () => {
    render(<SeatMap seats={seats} readOnly />)
    expect(screen.getByRole('button', { name: /driver/i })).toBeInTheDocument()
  })

  it('calls onSeatToggle when an available seat is clicked', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    render(<SeatMap seats={seats} onSeatToggle={onToggle} />)
    const passenger = screen.getAllByRole('button').find(
      b => !b.getAttribute('aria-label')?.toLowerCase().includes('driver')
    )!
    await user.click(passenger)
    expect(onToggle).toHaveBeenCalledOnce()
  })

  it('does not call onSeatToggle when readOnly', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    render(<SeatMap seats={seats} onSeatToggle={onToggle} readOnly />)
    const passenger = screen.getAllByRole('button').find(
      b => !b.getAttribute('aria-label')?.toLowerCase().includes('driver')
    )!
    await user.click(passenger)
    expect(onToggle).not.toHaveBeenCalled()
  })

  it('marks selected seats with aria-pressed=true', () => {
    const firstPassenger = seats.find(s => !s.isDriver)!
    render(<SeatMap seats={seats} selectedSeatIds={[firstPassenger.id]} />)
    const btn = screen.getByRole('button', { name: new RegExp(firstPassenger.label, 'i') })
    expect(btn).toHaveAttribute('aria-pressed', 'true')
  })

  it('disables occupied seats', () => {
    const withOccupied = seats.map(s =>
      s.isDriver ? s : { ...s, status: 'occupied' as const }
    )
    render(<SeatMap seats={withOccupied} />)
    const passengers = screen.getAllByRole('button').filter(
      b => !b.getAttribute('aria-label')?.toLowerCase().includes('driver')
    )
    passengers.forEach(b => expect(b).toBeDisabled())
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm run test:run components/rides/__tests__/seat-map.test.tsx
```

Expected: FAIL — existing `seat-map.tsx` doesn't match this interface yet.

- [ ] **Step 3: Implement SeatMap**

Replace `components/rides/seat-map.tsx`:

```typescript
'use client'

import { cn } from '@/lib/utils'
import type { Seat, SeatStatus } from '@/lib/seat-templates'

type ExtendedSeat = Omit<Seat, 'status'> & { status: SeatStatus }

type SeatMapProps = {
  seats: ExtendedSeat[]
  selectedSeatIds?: string[]
  onSeatToggle?: (seatId: string) => void
  readOnly?: boolean
}

function getSeatStyle(seat: ExtendedSeat, isSelected: boolean): string {
  if (isSelected)                 return 'bg-foreground border-foreground text-background scale-110'
  if (seat.isDriver)              return 'bg-foreground border-foreground text-background cursor-default'
  if (seat.status === 'occupied') return 'bg-zinc-800 border-zinc-700 text-zinc-600 cursor-not-allowed'
  if (seat.status === 'reserved') return 'bg-yellow-500/15 border-yellow-600 text-yellow-500 cursor-not-allowed opacity-80'
  return 'bg-green-500/15 border-green-500 text-green-400 hover:bg-green-500/25 active:scale-95'
}

export function SeatMap({
  seats,
  selectedSeatIds = [],
  onSeatToggle,
  readOnly = false,
}: SeatMapProps) {
  function handleClick(seat: ExtendedSeat) {
    if (readOnly || seat.isDriver || seat.status !== 'available') return
    onSeatToggle?.(seat.id)
  }

  return (
    <div className="relative w-full max-w-[200px] mx-auto" style={{ aspectRatio: '1 / 2.2' }}>
      {/* Car silhouette SVG */}
      <svg viewBox="0 0 100 220" className="absolute inset-0 w-full h-full" aria-hidden="true">
        <rect x="8" y="18" width="84" height="184" rx="24"
          fill="none" stroke="hsl(var(--border))" strokeWidth="2" />
        <rect x="20" y="36" width="60" height="36" rx="6"
          fill="none" stroke="hsl(var(--border))" strokeWidth="1.5" opacity="0.5" />
        <rect x="20" y="148" width="60" height="36" rx="6"
          fill="none" stroke="hsl(var(--border))" strokeWidth="1.5" opacity="0.5" />
        <rect x="24" y="10" width="52" height="9" rx="4" fill="hsl(var(--muted))" />
        <rect x="24" y="201" width="52" height="9" rx="4" fill="hsl(var(--muted))" />
      </svg>

      {/* Seat buttons */}
      {seats.map(seat => {
        const isSelected = selectedSeatIds.includes(seat.id)
        const isClickable = !readOnly && !seat.isDriver && seat.status === 'available'

        return (
          <button
            key={seat.id}
            onClick={() => handleClick(seat)}
            disabled={!isClickable && !seat.isDriver}
            aria-label={`${seat.label}${isSelected ? ' (selected)' : ''}`}
            aria-pressed={isSelected}
            title={seat.label}
            style={{
              position: 'absolute',
              left: `${seat.x}%`,
              top: `${seat.y}%`,
              transform: 'translate(-50%, -50%)',
              width: '30px',
              height: '30px',
            }}
            className={cn(
              'rounded-full border-2 text-[11px] font-bold transition-all',
              getSeatStyle(seat, isSelected),
            )}
          >
            {seat.isDriver ? '▲' : isSelected ? '✓' : null}
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 4: Run SeatMap tests — verify they pass**

```bash
npm run test:run components/rides/__tests__/seat-map.test.tsx
```

Expected: PASS (6 tests)

- [ ] **Step 5: Add seatRecordToArray helper to seat-templates.ts**

Append to `lib/seat-templates.ts`:

```typescript
export function seatRecordToArray(seatMap: Record<string, Seat>): Seat[] {
  return Object.values(seatMap).sort((a, b) =>
    a.row !== b.row ? a.row - b.row : a.position - b.position
  )
}
```

- [ ] **Step 6: Add round-trip test to seat-templates test file**

Append to `lib/__tests__/seat-templates.test.ts`:

```typescript
import { generateSeatTemplate, seatMapToRecord, seatRecordToArray } from '../seat-templates'

describe('seatRecordToArray', () => {
  it('round-trips through seatMapToRecord preserving row/position order', () => {
    const original = generateSeatTemplate('sedan', 5)
    const record = seatMapToRecord(original)
    const result = seatRecordToArray(record)
    expect(result.map(s => s.id)).toEqual(original.map(s => s.id))
  })
})
```

- [ ] **Step 7: Run all tests**

```bash
npm run test:run
```

Expected: PASS (all tests)

- [ ] **Step 8: Verify build**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 9: Commit**

```bash
git add components/rides/seat-map.tsx components/rides/__tests__/ lib/seat-templates.ts lib/__tests__/seat-templates.test.ts
git commit -m "feat: interactive SVG seat map with color-coded status, seat selection, and read-only mode"
```

---

---

### Task 11: Create Ride Wizard (4-step)

**Files:**
- Create: `components/rides/create-ride-wizard.tsx`
- Create: `components/rides/__tests__/create-ride-wizard.test.tsx`
- Modify: `app/(app)/rides/new/page.tsx` (replace stub)

The wizard collects data across 4 steps — event, vehicle, ride details + pickup radius, preview + publish — held in local React state. Publishing inserts the ride directly with `status: 'active'`, which fires the `on_ride_published` trigger and auto-creates the group chat.

- [ ] **Step 1: Write failing tests for the wizard**

Create `components/rides/__tests__/create-ride-wizard.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { CreateRideWizard } from '../create-ride-wizard'
import type { Seat } from '@/lib/seat-templates'

const mockEvent = {
  id: 'evt-1',
  name: 'Taylor Swift — Eras Tour',
  venue_name: 'Wrigley Field',
  city: 'Chicago',
  starts_at: '2026-07-15T19:00:00Z',
}

const mockSeats: Seat[] = [
  { id: 'r0s0', row: 0, position: 0, label: 'Driver',           isDriver: true,  x: 25, y: 22, status: 'driver'    },
  { id: 'r0s1', row: 0, position: 1, label: 'Front Passenger',  isDriver: false, x: 75, y: 22, status: 'available' },
  { id: 'r1s0', row: 1, position: 0, label: 'Rear Left',        isDriver: false, x: 15, y: 72, status: 'available' },
  { id: 'r1s1', row: 1, position: 1, label: 'Rear Center',      isDriver: false, x: 50, y: 72, status: 'available' },
  { id: 'r1s2', row: 1, position: 2, label: 'Rear Right',       isDriver: false, x: 85, y: 72, status: 'available' },
]

const mockVehicle = {
  id: 'v1',
  make: 'Toyota',
  model: 'Camry',
  year: 2022,
  color: 'Silver',
  type: 'sedan' as const,
  capacity: 5,
  seat_template: mockSeats,
  is_default: true,
}

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }),
    },
    from: vi.fn(() => {
      const chain: Record<string, unknown> = {}
      const resolved = { data: [], error: null }
      const methods = ['select','eq','neq','ilike','or','order','limit','gte','in']
      methods.forEach(m => { chain[m] = vi.fn(() => chain) })
      chain['insert'] = vi.fn(() => ({
        select: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: { id: 'ride-new-1' }, error: null }) })),
      }))
      chain['update'] = vi.fn(() => chain)
      Object.assign(chain, { then: (cb: (v: typeof resolved) => void) => Promise.resolve().then(() => cb(resolved)) })
      return chain
    }),
  })),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => ({ get: vi.fn().mockReturnValue(null) }),
}))

describe('CreateRideWizard — step indicators', () => {
  it('renders all 4 step numbers', () => {
    render(<CreateRideWizard />)
    ;['1','2','3','4'].forEach(n =>
      expect(screen.getAllByText(n).length).toBeGreaterThanOrEqual(1)
    )
  })

  it('starts on step 1 — event selection', () => {
    render(<CreateRideWizard />)
    expect(screen.getByText(/select event/i)).toBeInTheDocument()
  })
})

describe('CreateRideWizard — step 1 (event selection)', () => {
  it('renders event search input', () => {
    render(<CreateRideWizard />)
    expect(screen.getByPlaceholderText(/search events/i)).toBeInTheDocument()
  })

  it('Next is disabled when no event is selected', () => {
    render(<CreateRideWizard />)
    expect(screen.getByRole('button', { name: /^next$/i })).toBeDisabled()
  })

  it('Next is enabled when a preselected event is provided', () => {
    render(<CreateRideWizard preselectedEvent={mockEvent} />)
    expect(screen.getByRole('button', { name: /^next$/i })).not.toBeDisabled()
  })

  it('shows selected event name when preselected', () => {
    render(<CreateRideWizard preselectedEvent={mockEvent} />)
    expect(screen.getByText('Taylor Swift — Eras Tour')).toBeInTheDocument()
  })
})

describe('CreateRideWizard — step 2 (vehicle selection)', () => {
  async function goToStep2() {
    const user = userEvent.setup()
    render(<CreateRideWizard preselectedEvent={mockEvent} />)
    await user.click(screen.getByRole('button', { name: /^next$/i }))
    return user
  }

  it('advances to step 2 when Next is clicked with event selected', async () => {
    await goToStep2()
    expect(screen.getByText(/select vehicle/i)).toBeInTheDocument()
  })

  it('Back button returns to step 1', async () => {
    const user = await goToStep2()
    await user.click(screen.getByRole('button', { name: /^back$/i }))
    expect(screen.getByText(/select event/i)).toBeInTheDocument()
  })

  it('Next is disabled when no vehicle is selected', async () => {
    await goToStep2()
    expect(screen.getByRole('button', { name: /^next$/i })).toBeDisabled()
  })
})

describe('CreateRideWizard — step 3 (ride details)', () => {
  async function goToStep3() {
    const user = userEvent.setup()
    render(<CreateRideWizard preselectedEvent={mockEvent} preselectedVehicle={mockVehicle} />)
    await user.click(screen.getByRole('button', { name: /^next$/i })) // step 1 → 2
    await user.click(screen.getByRole('button', { name: /^next$/i })) // step 2 → 3
    return user
  }

  it('advances to step 3 with vehicle preselected', async () => {
    await goToStep3()
    expect(screen.getByText(/ride details/i)).toBeInTheDocument()
  })

  it('renders departure address and time inputs', async () => {
    await goToStep3()
    expect(screen.getByLabelText(/departure address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/departure time/i)).toBeInTheDocument()
  })

  it('renders cost per person input defaulting to 0', async () => {
    await goToStep3()
    const costInput = screen.getByLabelText(/cost per person/i) as HTMLInputElement
    expect(costInput.value).toBe('0')
  })

  it('renders optional pickup radius toggle', async () => {
    await goToStep3()
    expect(screen.getByLabelText(/flexible pickup/i)).toBeInTheDocument()
  })

  it('Next is disabled when required fields are empty', async () => {
    await goToStep3()
    expect(screen.getByRole('button', { name: /^next$/i })).toBeDisabled()
  })

  it('Next is enabled when departure address and time are filled', async () => {
    const user = await goToStep3()
    await user.type(screen.getByLabelText(/departure address/i), '123 Main St, Chicago')
    await user.type(screen.getByLabelText(/departure time/i), '2026-07-15T17:00')
    expect(screen.getByRole('button', { name: /^next$/i })).not.toBeDisabled()
  })
})

describe('CreateRideWizard — step 4 (preview + publish)', () => {
  async function goToStep4() {
    const user = userEvent.setup()
    render(<CreateRideWizard preselectedEvent={mockEvent} preselectedVehicle={mockVehicle} />)
    await user.click(screen.getByRole('button', { name: /^next$/i })) // → step 2
    await user.click(screen.getByRole('button', { name: /^next$/i })) // → step 3
    await user.type(screen.getByLabelText(/departure address/i), '123 Main St')
    await user.type(screen.getByLabelText(/departure time/i), '2026-07-15T17:00')
    await user.click(screen.getByRole('button', { name: /^next$/i })) // → step 4
    return user
  }

  it('shows review heading and Publish Ride button', async () => {
    await goToStep4()
    expect(screen.getByText(/review & publish/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /publish ride/i })).toBeInTheDocument()
  })

  it('shows selected event name in review', async () => {
    await goToStep4()
    expect(screen.getByText('Taylor Swift — Eras Tour')).toBeInTheDocument()
  })

  it('shows vehicle info in review', async () => {
    await goToStep4()
    expect(screen.getByText(/2022 Toyota Camry/i)).toBeInTheDocument()
  })

  it('shows departure address in review', async () => {
    await goToStep4()
    expect(screen.getByText('123 Main St')).toBeInTheDocument()
  })

  it('Back button in step 4 returns to step 3', async () => {
    const user = await goToStep4()
    await user.click(screen.getByRole('button', { name: /^back$/i }))
    expect(screen.getByText(/ride details/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npm run test:run components/rides/__tests__/create-ride-wizard.test.tsx
```

Expected: FAIL — "Cannot find module '../create-ride-wizard'"

- [ ] **Step 3: Implement CreateRideWizard**

Create `components/rides/create-ride-wizard.tsx`:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Car, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { seatMapToRecord, type Seat } from '@/lib/seat-templates'
import { SeatMap } from '@/components/rides/seat-map'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

type WizardEvent = {
  id: string
  name: string
  venue_name: string
  city: string
  starts_at: string
}

type WizardVehicle = {
  id: string
  make: string
  model: string
  year: number
  color: string
  type: string
  capacity: number
  seat_template: Seat[]
  is_default: boolean
}

type WizardStep = 1 | 2 | 3 | 4

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: WizardStep }) {
  const labels = ['Event', 'Vehicle', 'Details', 'Review']
  return (
    <div className="flex items-center gap-2 mb-6">
      {labels.map((label, i) => {
        const step = (i + 1) as WizardStep
        const isActive = step === current
        const isDone = step < current
        return (
          <div key={step} className="flex items-center gap-2 flex-1">
            <div className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 shrink-0',
              isDone  ? 'bg-foreground border-foreground text-background' :
              isActive ? 'border-foreground text-foreground bg-transparent' :
                         'border-border text-muted-foreground bg-transparent'
            )}>
              {isDone ? <Check className="h-3.5 w-3.5" /> : step}
            </div>
            <span className={cn(
              'text-xs hidden sm:block',
              isActive ? 'text-foreground font-medium' : 'text-muted-foreground'
            )}>{label}</span>
            {i < labels.length - 1 && (
              <div className={cn('h-px flex-1', isDone ? 'bg-foreground' : 'bg-border')} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Step 1: Event selection ──────────────────────────────────────────────────

function Step1Event({
  selected,
  onSelect,
}: {
  selected: WizardEvent | null
  onSelect: (e: WizardEvent) => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<WizardEvent[]>([])
  const [searching, setSearching] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (query.length < 2) { setResults([]); return }
    const timer = setTimeout(async () => {
      setSearching(true)
      const { data } = await supabase
        .from('events')
        .select('id, name, venue_name, city, starts_at')
        .or(`name.ilike.%${query}%,venue_name.ilike.%${query}%,city.ilike.%${query}%`)
        .gte('starts_at', new Date().toISOString())
        .order('starts_at', { ascending: true })
        .limit(8)
      setResults(data ?? [])
      setSearching(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Select Event</h2>

      {selected && (
        <div className="mb-4 p-3 rounded-xl border border-foreground/30 bg-card">
          <p className="text-sm font-semibold">{selected.name}</p>
          <p className="text-xs text-muted-foreground">{selected.venue_name} · {selected.city}</p>
          <button
            onClick={() => { setQuery(''); setResults([]) }}
            className="text-xs text-muted-foreground underline underline-offset-4 mt-1"
          >
            Change event
          </button>
        </div>
      )}

      {!selected && (
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search events, venues, cities…"
            className="pl-9"
          />
        </div>
      )}

      {!selected && results.length > 0 && (
        <div className="space-y-2">
          {results.map(evt => (
            <button
              key={evt.id}
              onClick={() => { onSelect(evt); setQuery(''); setResults([]) }}
              className="w-full text-left p-3 rounded-xl border border-border bg-card hover:bg-muted transition-colors"
            >
              <p className="text-sm font-semibold">{evt.name}</p>
              <p className="text-xs text-muted-foreground">
                {evt.venue_name} · {evt.city} ·{' '}
                {new Date(evt.starts_at).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric',
                })}
              </p>
            </button>
          ))}
        </div>
      )}

      {!selected && !searching && query.length >= 2 && results.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No events found. You can{' '}
          <a href="/events/new" className="underline underline-offset-4">create one</a>.
        </p>
      )}
    </div>
  )
}

// ─── Step 2: Vehicle selection ────────────────────────────────────────────────

function Step2Vehicle({
  selected,
  onSelect,
}: {
  selected: WizardVehicle | null
  onSelect: (v: WizardVehicle) => void
}) {
  const [vehicles, setVehicles] = useState<WizardVehicle[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('vehicles')
        .select('id, make, model, year, color, type, capacity, seat_template, is_default')
        .eq('owner_id', user.id)
        .order('is_default', { ascending: false })
      setVehicles((data ?? []) as WizardVehicle[])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <p className="text-sm text-muted-foreground py-8 text-center">Loading vehicles…</p>

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Select Vehicle</h2>

      {vehicles.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-xl">
          <p className="text-sm text-muted-foreground mb-3">No vehicles registered</p>
          <Button asChild size="sm">
            <a href="/profile/vehicles/new">Add a vehicle first</a>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {vehicles.map(v => {
            const isSelected = selected?.id === v.id
            return (
              <button
                key={v.id}
                onClick={() => onSelect(v)}
                className={cn(
                  'w-full text-left p-4 rounded-xl border-2 transition-colors',
                  isSelected ? 'border-foreground bg-card' : 'border-border bg-card hover:bg-muted',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Car className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm font-semibold">
                        {v.year} {v.make} {v.model}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {v.color} · {v.type} · {v.capacity} seats
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {v.is_default && (
                      <Badge variant="outline" className="text-xs">Default</Badge>
                    )}
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-foreground flex items-center justify-center">
                        <Check className="h-3 w-3 text-background" />
                      </div>
                    )}
                  </div>
                </div>

                {isSelected && (
                  <div className="mt-4">
                    <SeatMap seats={v.seat_template} readOnly />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Step 3: Ride details ─────────────────────────────────────────────────────

type RideDetails = {
  departureAddress: string
  departureTime: string
  returnTime: string
  costPerPerson: number
  notes: string
  pickupRadiusMiles: number | null
}

function Step3Details({
  details,
  onChange,
}: {
  details: RideDetails
  onChange: (d: Partial<RideDetails>) => void
}) {
  const [flexPickup, setFlexPickup] = useState(details.pickupRadiusMiles !== null)

  function toggleFlexPickup(checked: boolean) {
    setFlexPickup(checked)
    onChange({ pickupRadiusMiles: checked ? 2 : null })
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Ride Details</h2>

      <div className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="departureAddress">Departure address</Label>
          <Input
            id="departureAddress"
            value={details.departureAddress}
            onChange={e => onChange({ departureAddress: e.target.value })}
            placeholder="123 Main St, Chicago, IL"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="departureTime">Departure time</Label>
          <Input
            id="departureTime"
            type="datetime-local"
            value={details.departureTime}
            onChange={e => onChange({ departureTime: e.target.value })}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="returnTime">Return time (optional)</Label>
          <Input
            id="returnTime"
            type="datetime-local"
            value={details.returnTime}
            onChange={e => onChange({ returnTime: e.target.value })}
            min={details.departureTime}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="costPerPerson">Cost per person ($)</Label>
          <Input
            id="costPerPerson"
            type="number"
            min={0}
            step={0.01}
            value={details.costPerPerson}
            onChange={e => onChange({ costPerPerson: parseFloat(e.target.value) || 0 })}
          />
          <p className="text-xs text-muted-foreground">Set to $0 for a free ride</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notes">Notes (optional)</Label>
          <Textarea
            id="notes"
            value={details.notes}
            onChange={e => onChange({ notes: e.target.value })}
            placeholder="Meeting point details, luggage rules, etc."
            rows={3}
          />
        </div>

        <div className="space-y-3 p-4 rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="flexPickup" className="text-sm font-medium cursor-pointer">
                Flexible pickup
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Allow riders to request a custom pickup within a radius
              </p>
            </div>
            <input
              id="flexPickup"
              type="checkbox"
              checked={flexPickup}
              onChange={e => toggleFlexPickup(e.target.checked)}
              className="w-4 h-4 accent-foreground cursor-pointer"
              aria-label="Flexible pickup"
            />
          </div>

          {flexPickup && (
            <div className="space-y-1.5 pt-1 border-t border-border">
              <Label htmlFor="pickupRadius">Pickup radius (miles)</Label>
              <Input
                id="pickupRadius"
                type="number"
                min={0.5}
                max={25}
                step={0.5}
                value={details.pickupRadiusMiles ?? 2}
                onChange={e =>
                  onChange({ pickupRadiusMiles: parseFloat(e.target.value) || 2 })
                }
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Step 4: Review + publish ─────────────────────────────────────────────────

function Step4Review({
  event,
  vehicle,
  details,
  onPublish,
  publishing,
}: {
  event: WizardEvent
  vehicle: WizardVehicle
  details: RideDetails
  onPublish: () => void
  publishing: boolean
}) {
  const seatMap = seatMapToRecord(vehicle.seat_template)
  const availableCount = Object.values(seatMap).filter(s => !s.isDriver).length

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Review &amp; Publish</h2>

      <div className="space-y-3 mb-6">
        <div className="p-4 rounded-xl border border-border bg-card space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Event</p>
          <p className="text-sm font-semibold">{event.name}</p>
          <p className="text-xs text-muted-foreground">{event.venue_name} · {event.city}</p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Vehicle</p>
          <p className="text-sm font-semibold">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </p>
          <p className="text-xs text-muted-foreground capitalize">
            {vehicle.color} · {vehicle.type} · {availableCount} passenger seat{availableCount !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Pickup</p>
          <p className="text-sm">{details.departureAddress}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(details.departureTime).toLocaleString('en-US', {
              weekday: 'short', month: 'short', day: 'numeric',
              hour: 'numeric', minute: '2-digit',
            })}
          </p>
          {details.pickupRadiusMiles && (
            <p className="text-xs text-muted-foreground">
              Flexible pickup within {details.pickupRadiusMiles} mi
            </p>
          )}
        </div>

        <div className="p-4 rounded-xl border border-border bg-card space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Cost</p>
          <p className="text-sm font-semibold">
            {details.costPerPerson === 0
              ? 'Free ride'
              : `$${details.costPerPerson.toFixed(2)} / person`}
          </p>
        </div>

        {details.returnTime && (
          <div className="p-4 rounded-xl border border-border bg-card space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Return</p>
            <p className="text-xs text-muted-foreground">
              {new Date(details.returnTime).toLocaleString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric',
                hour: 'numeric', minute: '2-digit',
              })}
            </p>
          </div>
        )}

        {details.notes && (
          <div className="p-4 rounded-xl border border-border bg-card space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Notes</p>
            <p className="text-sm">{details.notes}</p>
          </div>
        )}
      </div>

      <div className="mb-6">
        <p className="text-xs text-muted-foreground mb-3 text-center">Seat layout</p>
        <SeatMap seats={vehicle.seat_template} readOnly />
      </div>

      <Button
        onClick={onPublish}
        disabled={publishing}
        className="w-full"
        size="lg"
      >
        {publishing ? 'Publishing…' : 'Publish Ride'}
      </Button>
    </div>
  )
}

// ─── Wizard shell ─────────────────────────────────────────────────────────────

type Props = {
  preselectedEvent?: WizardEvent
  preselectedVehicle?: WizardVehicle
}

export function CreateRideWizard({ preselectedEvent, preselectedVehicle }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [step, setStep] = useState<WizardStep>(1)
  const [event, setEvent] = useState<WizardEvent | null>(preselectedEvent ?? null)
  const [vehicle, setVehicle] = useState<WizardVehicle | null>(preselectedVehicle ?? null)
  const [details, setDetails] = useState<RideDetails>({
    departureAddress: '',
    departureTime: '',
    returnTime: '',
    costPerPerson: 0,
    notes: '',
    pickupRadiusMiles: null,
  })
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  // Pre-fill event from ?event= URL param
  useEffect(() => {
    if (preselectedEvent || event) return
    const eventId = searchParams.get('event')
    if (!eventId) return
    supabase
      .from('events')
      .select('id, name, venue_name, city, starts_at')
      .eq('id', eventId)
      .single()
      .then(({ data }) => { if (data) setEvent(data as WizardEvent) })
  }, [])

  const step3Complete = details.departureAddress.trim() !== '' && details.departureTime !== ''

  function next() { setStep(s => (s < 4 ? (s + 1) as WizardStep : s) ) }
  function back() { setStep(s => (s > 1 ? (s - 1) as WizardStep : s) ) }

  async function publish() {
    if (!event || !vehicle) return
    setPublishing(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setPublishing(false); return }

    const seatMap = seatMapToRecord(vehicle.seat_template)

    const { data, error: insertError } = await supabase
      .from('rides')
      .insert({
        driver_id: user.id,
        event_id: event.id,
        vehicle_id: vehicle.id,
        status: 'active',
        departure_address: details.departureAddress,
        departure_time: details.departureTime,
        return_time: details.returnTime || null,
        cost_per_person: details.costPerPerson,
        notes: details.notes || null,
        seat_map: seatMap,
        pickup_radius_miles: details.pickupRadiusMiles,
      })
      .select('id')
      .single()

    if (insertError || !data) {
      setError(insertError?.message ?? 'Failed to publish ride')
      setPublishing(false)
      return
    }

    router.push(`/rides/${data.id}`)
  }

  return (
    <div>
      <StepIndicator current={step} />

      {step === 1 && (
        <>
          <Step1Event selected={event} onSelect={setEvent} />
          <div className="mt-6 flex justify-end">
            <Button onClick={next} disabled={!event}>Next</Button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <Step2Vehicle selected={vehicle} onSelect={setVehicle} />
          <div className="mt-6 flex justify-between">
            <Button variant="outline" onClick={back}>Back</Button>
            <Button onClick={next} disabled={!vehicle}>Next</Button>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <Step3Details
            details={details}
            onChange={patch => setDetails(d => ({ ...d, ...patch }))}
          />
          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
          <div className="mt-6 flex justify-between">
            <Button variant="outline" onClick={back}>Back</Button>
            <Button onClick={next} disabled={!step3Complete}>Next</Button>
          </div>
        </>
      )}

      {step === 4 && event && vehicle && (
        <>
          <Step4Review
            event={event}
            vehicle={vehicle}
            details={details}
            onPublish={publish}
            publishing={publishing}
          />
          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
          <div className="mt-4">
            <Button variant="outline" onClick={back} className="w-full">Back</Button>
          </div>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm run test:run components/rides/__tests__/create-ride-wizard.test.tsx
```

Expected: PASS (all tests)

- [ ] **Step 5: Replace rides/new stub with the wizard page**

Replace `app/(app)/rides/new/page.tsx`:

```typescript
import { Suspense } from 'react'
import { CreateRideWizard } from '@/components/rides/create-ride-wizard'

export default function NewRidePage() {
  return (
    <div className="px-4 pt-6 pb-10">
      <h1 className="text-2xl font-bold mb-6">Post a Ride</h1>
      <Suspense fallback={null}>
        <CreateRideWizard />
      </Suspense>
    </div>
  )
}
```

Note: `Suspense` is required because `CreateRideWizard` calls `useSearchParams()`, which must be wrapped for server-side rendering.

- [ ] **Step 6: Run full test suite**

```bash
npm run test:run
```

Expected: PASS (all tests)

- [ ] **Step 7: Verify build**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 8: Commit**

```bash
git add components/rides/create-ride-wizard.tsx components/rides/__tests__/create-ride-wizard.test.tsx app/(app)/rides/new/page.tsx
git commit -m "feat: 4-step create ride wizard (event → vehicle → details → publish)"
```

---

### Task 12: Ride Detail Page + Application Form

**Files:**
- Create: `app/(app)/rides/[id]/page.tsx`
- Replace: `components/rides/ride-card.tsx` (stub → full implementation)
- Create: `components/rides/ride-application-form.tsx`
- Create: `components/rides/__tests__/ride-application-form.test.tsx`

The ride detail page is a server component that determines the viewer's role (driver / accepted rider / pending rider / visitor) and renders accordingly. Accept/reject runs through server actions wired to HTML forms — no client round-trip needed. The application form is a separate client component.

- [ ] **Step 1: Write failing tests for RideApplicationForm**

Create `components/rides/__tests__/ride-application-form.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { RideApplicationForm } from '../ride-application-form'
import type { Seat } from '@/lib/seat-templates'

const seats: Seat[] = [
  { id: 'r0s0', row: 0, position: 0, label: 'Driver',          isDriver: true,  x: 25, y: 22, status: 'driver'    },
  { id: 'r0s1', row: 0, position: 1, label: 'Front Passenger', isDriver: false, x: 75, y: 22, status: 'available' },
  { id: 'r1s0', row: 1, position: 0, label: 'Rear Left',       isDriver: false, x: 15, y: 72, status: 'available' },
  { id: 'r1s1', row: 1, position: 1, label: 'Rear Center',     isDriver: false, x: 50, y: 72, status: 'available' },
  { id: 'r1s2', row: 1, position: 2, label: 'Rear Right',      isDriver: false, x: 85, y: 72, status: 'available' },
]

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
    })),
  })),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

const freeRide = { id: 'r1', cost_per_person: 0, is_paid: false, pickup_radius_miles: null, seats, accepted_count: 0 }
const paidRide = { id: 'r2', cost_per_person: 60, is_paid: true, pickup_radius_miles: null, seats, accepted_count: 1 }
const flexRide  = { id: 'r3', cost_per_person: 0, is_paid: false, pickup_radius_miles: 2, seats, accepted_count: 0 }

describe('RideApplicationForm', () => {
  it('renders the seat map', () => {
    render(<RideApplicationForm ride={freeRide} />)
    expect(screen.getByRole('button', { name: /driver/i })).toBeInTheDocument()
  })

  it('Submit is disabled when no seats are selected', () => {
    render(<RideApplicationForm ride={freeRide} />)
    expect(screen.getByRole('button', { name: /request seat/i })).toBeDisabled()
  })

  it('Submit is enabled after selecting an available seat', async () => {
    const user = userEvent.setup()
    render(<RideApplicationForm ride={freeRide} />)
    await user.click(screen.getByRole('button', { name: /front passenger/i }))
    expect(screen.getByRole('button', { name: /request seat/i })).not.toBeDisabled()
  })

  it('shows "Free ride" for rides with cost_per_person = 0', () => {
    render(<RideApplicationForm ride={freeRide} />)
    expect(screen.getByText(/free ride/i)).toBeInTheDocument()
  })

  it('shows estimated cost per person for paid rides', () => {
    // $60 / (1 accepted + 1 driver + 1 new rider) = $20
    render(<RideApplicationForm ride={paidRide} />)
    expect(screen.getByText(/\$20\.00/)).toBeInTheDocument()
  })

  it('shows custom pickup address field when driver has flexible pickup radius', () => {
    render(<RideApplicationForm ride={flexRide} />)
    expect(screen.getByLabelText(/custom pickup/i)).toBeInTheDocument()
  })

  it('does not show custom pickup when pickup_radius_miles is null', () => {
    render(<RideApplicationForm ride={freeRide} />)
    expect(screen.queryByLabelText(/custom pickup/i)).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npm run test:run components/rides/__tests__/ride-application-form.test.tsx
```

Expected: FAIL — "Cannot find module '../ride-application-form'"

- [ ] **Step 3: Implement RideApplicationForm**

Create `components/rides/ride-application-form.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { calculateCostShare } from '@/lib/cost-split'
import { SeatMap } from '@/components/rides/seat-map'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { Seat } from '@/lib/seat-templates'

type Props = {
  ride: {
    id: string
    cost_per_person: number
    is_paid: boolean
    pickup_radius_miles: number | null
    seats: Seat[]
    accepted_count: number
  }
}

export function RideApplicationForm({ ride }: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [customPickup, setCustomPickup] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  function toggleSeat(id: string) {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  // Cost estimate: total / (accepted + driver + this new rider's seats)
  const estimatedCost = ride.is_paid
    ? calculateCostShare(ride.cost_per_person, ride.accepted_count + selectedIds.length)
    : 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (selectedIds.length === 0) return
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not signed in'); setLoading(false); return }

    const { error: insertError } = await supabase.from('ride_applications').insert({
      ride_id: ride.id,
      rider_id: user.id,
      status: 'pending',
      seat_ids: selectedIds,
      message: message.trim() || null,
      custom_pickup_address: customPickup.trim() || null,
      cost_share: estimatedCost,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    setSubmitted(true)
    router.refresh()
  }

  if (submitted) {
    return (
      <div className="p-4 rounded-xl border border-border bg-card text-center py-8">
        <p className="text-sm font-semibold mb-1">Request sent!</p>
        <p className="text-xs text-muted-foreground">
          The driver will review your request. You'll be notified when they respond.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <p className="text-sm font-medium mb-3">Select your seat{selectedIds.length > 1 ? 's' : ''}</p>
        <SeatMap
          seats={ride.seats}
          selectedSeatIds={selectedIds}
          onSeatToggle={toggleSeat}
        />
      </div>

      <div className="p-3 rounded-xl border border-border bg-card text-center">
        {ride.is_paid ? (
          <p className="text-sm">
            Estimated cost:{' '}
            <span className="font-semibold">${estimatedCost.toFixed(2)} / person</span>
            <span className="text-muted-foreground text-xs ml-1">(recalculated on acceptance)</span>
          </p>
        ) : (
          <p className="text-sm font-semibold text-green-400">Free ride</p>
        )}
      </div>

      {ride.pickup_radius_miles !== null && (
        <div className="space-y-1.5">
          <Label htmlFor="customPickup">
            Custom pickup address (within {ride.pickup_radius_miles} mi)
          </Label>
          <Input
            id="customPickup"
            value={customPickup}
            onChange={e => setCustomPickup(e.target.value)}
            placeholder="Your preferred pickup address"
          />
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="message">Message to driver (optional)</Label>
        <Textarea
          id="message"
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Hi, looking forward to this!"
          rows={2}
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={selectedIds.length === 0 || loading}
      >
        {loading ? 'Sending…' : `Request seat${selectedIds.length > 1 ? 's' : ''}`}
      </Button>
    </form>
  )
}
```

- [ ] **Step 4: Run test — verify it passes**

```bash
npm run test:run components/rides/__tests__/ride-application-form.test.tsx
```

Expected: PASS (7 tests)

- [ ] **Step 5: Replace RideCard stub with full implementation**

Replace `components/rides/ride-card.tsx`:

```typescript
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { CalendarDays, MapPin } from 'lucide-react'
import type { Seat } from '@/lib/seat-templates'

type RideCardProps = {
  ride: {
    id: string
    departure_address: string
    departure_time: string
    cost_per_person: number
    is_paid: boolean
    status: string
    seat_map: Record<string, Seat>
    driver?: {
      full_name: string
      username: string
      avatar_url: string | null
    } | null
  }
}

export function RideCard({ ride }: RideCardProps) {
  const seats = Object.values(ride.seat_map)
  const availableSeats = seats.filter(s => !s.isDriver && s.status === 'available').length
  const isFull = ride.status === 'full'

  const timeStr = new Date(ride.departure_time).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
  const dateStr = new Date(ride.departure_time).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  return (
    <Link
      href={`/rides/${ride.id}`}
      className="block bg-card border border-border rounded-xl p-4 active:opacity-80 transition-opacity"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          {ride.driver && (
            <Avatar className="w-8 h-8 shrink-0">
              {ride.driver.avatar_url && <AvatarImage src={ride.driver.avatar_url} />}
              <AvatarFallback className="text-xs bg-muted">
                {ride.driver.full_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
          )}
          <div>
            <p className="text-sm font-semibold leading-tight">
              {ride.driver?.full_name ?? 'Driver'}
            </p>
            {ride.driver && (
              <p className="text-xs text-muted-foreground">@{ride.driver.username}</p>
            )}
          </div>
        </div>
        <Badge variant={isFull ? 'secondary' : 'outline'} className="text-xs shrink-0">
          {isFull ? 'Full' : `${availableSeats} seat${availableSeats !== 1 ? 's' : ''}`}
        </Badge>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5 shrink-0" />
          <span>{dateStr} · {timeStr}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{ride.departure_address}</span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-border">
        <span className="text-xs font-medium">
          {ride.is_paid
            ? `$${ride.cost_per_person.toFixed(2)} total trip cost · split equally`
            : <span className="text-green-400">Free ride</span>
          }
        </span>
      </div>
    </Link>
  )
}
```

- [ ] **Step 6: Create ride detail page**

Create `app/(app)/rides/[id]/page.tsx`:

```typescript
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { CalendarDays, MapPin, MessageCircle, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { RideApplicationForm } from '@/components/rides/ride-application-form'
import { SeatMap } from '@/components/rides/seat-map'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { seatRecordToArray } from '@/lib/seat-templates'

export default async function RideDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: rideId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: ride } = await supabase
    .from('rides')
    .select(`
      id, status, departure_address, departure_time, return_time,
      cost_per_person, is_paid, notes, pickup_radius_miles, seat_map,
      driver:profiles!driver_id(id, full_name, username, avatar_url, phone_verified),
      vehicle:vehicles!vehicle_id(make, model, year, color, type, capacity),
      event:events!event_id(id, name, venue_name, city, starts_at),
      ride_applications(id, rider_id, status, seat_ids, message, cost_share,
        rider:profiles!rider_id(id, full_name, username, avatar_url))
    `)
    .eq('id', rideId)
    .single()

  if (!ride) notFound()

  const applications = (ride.ride_applications ?? []) as Array<{
    id: string; rider_id: string; status: string; seat_ids: string[]
    message: string | null; cost_share: number
    rider: { id: string; full_name: string; username: string; avatar_url: string | null } | null
  }>

  const isDriver      = ride.driver && (ride.driver as any).id === user.id
  const myApplication = applications.find(a => a.rider_id === user.id)
  const isAccepted    = myApplication?.status === 'accepted'
  const isPending     = myApplication?.status === 'pending'
  const acceptedCount = applications.filter(a => a.status === 'accepted').length

  const seats = seatRecordToArray(ride.seat_map as any)

  // ─── Server actions ───────────────────────────────────────────────────────

  async function acceptApplication(formData: FormData) {
    'use server'
    const appId = formData.get('appId') as string
    const sb = await createClient()
    await sb.from('ride_applications').update({ status: 'accepted' }).eq('id', appId)
    revalidatePath(`/rides/${rideId}`)
  }

  async function rejectApplication(formData: FormData) {
    'use server'
    const appId = formData.get('appId') as string
    const sb = await createClient()
    await sb.from('ride_applications').update({ status: 'rejected' }).eq('id', appId)
    revalidatePath(`/rides/${rideId}`)
  }

  async function cancelRide() {
    'use server'
    const sb = await createClient()
    await sb.from('rides').update({ status: 'cancelled' }).eq('id', rideId)
    revalidatePath(`/rides/${rideId}`)
  }

  // ─── Derived display values ───────────────────────────────────────────────

  const driver  = ride.driver as any
  const vehicle = ride.vehicle as any
  const event   = ride.event as any

  const departureStr = new Date(ride.departure_time).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })

  const statusColors: Record<string, string> = {
    active: 'text-green-400 border-green-800',
    full: 'text-yellow-400 border-yellow-800',
    cancelled: 'text-red-400 border-red-800',
    completed: 'text-muted-foreground border-border',
  }

  const { data: chat } = await supabase
    .from('ride_chats')
    .select('id')
    .eq('ride_id', rideId)
    .single()

  return (
    <div className="pb-10">
      {/* Event banner */}
      {event && (
        <Link
          href={`/events/${event.id}`}
          className="block px-4 pt-5 pb-3 border-b border-border"
        >
          <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1.5">
            <CalendarDays className="h-3 w-3" />
            {event.name}
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <MapPin className="h-3 w-3" />
            {event.venue_name} · {event.city}
          </p>
        </Link>
      )}

      {/* Driver + status */}
      <div className="px-4 pt-4 pb-4 border-b border-border">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              {driver?.avatar_url && <AvatarImage src={driver.avatar_url} />}
              <AvatarFallback className="bg-muted">
                {driver?.full_name?.charAt(0) ?? '?'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold">{driver?.full_name}</p>
              <p className="text-xs text-muted-foreground">@{driver?.username}</p>
            </div>
          </div>
          <Badge variant="outline" className={`text-xs ${statusColors[ride.status] ?? ''}`}>
            {ride.status}
          </Badge>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4 shrink-0" />
            <span>{departureStr}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span>{ride.departure_address}</span>
          </div>
          {ride.pickup_radius_miles && (
            <p className="text-xs text-muted-foreground ml-6">
              Flexible pickup within {ride.pickup_radius_miles} mi
            </p>
          )}
          {vehicle && (
            <p className="text-xs text-muted-foreground capitalize ml-6">
              {vehicle.year} {vehicle.make} {vehicle.model} · {vehicle.color}
            </p>
          )}
        </div>

        <div className="mt-3">
          <p className="text-sm font-semibold">
            {ride.is_paid
              ? `$${ride.cost_per_person.toFixed(2)} total trip cost · split equally`
              : <span className="text-green-400">Free ride</span>
            }
          </p>
        </div>

        {ride.notes && (
          <p className="mt-3 text-xs text-muted-foreground border-t border-border pt-3">
            {ride.notes}
          </p>
        )}
      </div>

      {/* Seat map */}
      <div className="px-4 pt-5 pb-4 border-b border-border">
        <p className="text-sm font-semibold mb-4">Seats</p>
        <SeatMap seats={seats} readOnly />
        <p className="text-xs text-muted-foreground text-center mt-3">
          {acceptedCount} of {seats.filter(s => !s.isDriver).length} passenger seat{seats.filter(s => !s.isDriver).length !== 1 ? 's' : ''} filled
        </p>
      </div>

      {/* Group chat link */}
      {chat && (isDriver || isAccepted) && (
        <div className="px-4 pt-4 pb-4 border-b border-border">
          <Button asChild variant="outline" className="w-full gap-2">
            <Link href={`/inbox/${chat.id}`}>
              <MessageCircle className="h-4 w-4" />
              Group Chat
            </Link>
          </Button>
        </div>
      )}

      {/* ── Driver view: pending applications ── */}
      {isDriver && (
        <div className="px-4 pt-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-4 w-4" />
            <p className="text-sm font-semibold">
              Requests ({applications.filter(a => a.status === 'pending').length} pending)
            </p>
          </div>

          {applications.length === 0 ? (
            <p className="text-sm text-muted-foreground">No requests yet.</p>
          ) : (
            <div className="space-y-3">
              {applications.map(app => (
                <div key={app.id} className="p-4 rounded-xl border border-border bg-card">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="w-8 h-8">
                        {app.rider?.avatar_url && <AvatarImage src={app.rider.avatar_url} />}
                        <AvatarFallback className="text-xs bg-muted">
                          {app.rider?.full_name?.charAt(0) ?? '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold">{app.rider?.full_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {app.seat_ids.length} seat{app.seat_ids.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs capitalize">{app.status}</Badge>
                  </div>

                  {app.message && (
                    <p className="mt-2 text-xs text-muted-foreground italic">"{app.message}"</p>
                  )}

                  {app.status === 'pending' && (
                    <div className="mt-3 flex gap-2">
                      <form action={acceptApplication} className="flex-1">
                        <input type="hidden" name="appId" value={app.id} />
                        <Button type="submit" size="sm" className="w-full">Accept</Button>
                      </form>
                      <form action={rejectApplication} className="flex-1">
                        <input type="hidden" name="appId" value={app.id} />
                        <Button type="submit" variant="outline" size="sm" className="w-full">
                          Decline
                        </Button>
                      </form>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {ride.status === 'active' && (
            <form action={cancelRide} className="mt-6">
              <Button
                type="submit"
                variant="outline"
                className="w-full text-red-400 border-red-900 hover:text-red-300"
              >
                Cancel ride
              </Button>
            </form>
          )}
        </div>
      )}

      {/* ── Rider view: accepted ── */}
      {!isDriver && isAccepted && (
        <div className="px-4 pt-5">
          <div className="p-4 rounded-xl border border-green-800 bg-green-500/10 text-center">
            <p className="text-sm font-semibold text-green-400">You're confirmed!</p>
            <p className="text-xs text-muted-foreground mt-1">
              Seat{myApplication!.seat_ids.length > 1 ? 's' : ''}: {myApplication!.seat_ids.join(', ')}
            </p>
            {ride.is_paid && (
              <p className="text-xs text-muted-foreground mt-1">
                Your share: ${myApplication!.cost_share.toFixed(2)}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Rider view: pending ── */}
      {!isDriver && isPending && (
        <div className="px-4 pt-5">
          <div className="p-4 rounded-xl border border-yellow-800 bg-yellow-500/10 text-center">
            <p className="text-sm font-semibold text-yellow-400">Request pending</p>
            <p className="text-xs text-muted-foreground mt-1">
              Waiting for the driver to respond.
            </p>
          </div>
        </div>
      )}

      {/* ── Visitor view: apply ── */}
      {!isDriver && !myApplication && ride.status === 'active' && (
        <div className="px-4 pt-5">
          <p className="text-sm font-semibold mb-4">Request a seat</p>
          <RideApplicationForm
            ride={{
              id: ride.id,
              cost_per_person: ride.cost_per_person,
              is_paid: ride.is_paid ?? false,
              pickup_radius_miles: ride.pickup_radius_miles,
              seats,
              accepted_count: acceptedCount,
            }}
          />
        </div>
      )}

      {!isDriver && !myApplication && ride.status === 'full' && (
        <div className="px-4 pt-5">
          <div className="p-4 rounded-xl border border-border bg-card text-center">
            <p className="text-sm text-muted-foreground">This ride is full.</p>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 7: Run full test suite**

```bash
npm run test:run
```

Expected: PASS (all tests)

- [ ] **Step 8: Verify build**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 9: Commit**

```bash
git add app/(app)/rides/\[id\]/ components/rides/ride-application-form.tsx components/rides/ride-card.tsx components/rides/__tests__/ride-application-form.test.tsx
git commit -m "feat: ride detail page with seat map, driver accept/reject, and rider application form"
```

---

### Task 13: My Rides Page

**Files:**
- Modify: `app/(app)/rides/page.tsx` (replace stub)

The My Rides page is a server component showing two sections: rides the user is driving, and rides they've been accepted on as a passenger. No new components — it reuses `RideCard`.

- [ ] **Step 1: Replace rides page stub**

Replace `app/(app)/rides/page.tsx`:

```typescript
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { RideCard } from '@/components/rides/ride-card'

export default async function RidesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Rides where the user is driving
  const { data: drivingRides } = await supabase
    .from('rides')
    .select(`
      id, status, departure_address, departure_time, cost_per_person, is_paid, seat_map,
      driver:profiles!driver_id(id, full_name, username, avatar_url)
    `)
    .eq('driver_id', user.id)
    .in('status', ['active', 'full', 'draft'])
    .order('departure_time', { ascending: true })

  // Rides where the user has an accepted application
  const { data: ridingApplications } = await supabase
    .from('ride_applications')
    .select(`
      ride:rides!ride_id(
        id, status, departure_address, departure_time, cost_per_person, is_paid, seat_map,
        driver:profiles!driver_id(id, full_name, username, avatar_url)
      )
    `)
    .eq('rider_id', user.id)
    .eq('status', 'accepted')

  const ridingRides = (ridingApplications ?? [])
    .map(a => a.ride)
    .filter(Boolean) as NonNullable<(typeof ridingApplications)[number]['ride']>[]

  const isEmpty = (!drivingRides || drivingRides.length === 0) && ridingRides.length === 0

  return (
    <div className="px-4 pt-6 pb-8">
      <h1 className="text-2xl font-bold mb-6">My Rides</h1>

      {isEmpty ? (
        <div className="text-center py-16 border border-dashed border-border rounded-xl">
          <p className="text-sm text-muted-foreground mb-2">No upcoming rides</p>
          <p className="text-xs text-muted-foreground">
            Use the + button to find or post a ride.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Driving section */}
          {drivingRides && drivingRides.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                Driving
              </h2>
              <div className="space-y-3">
                {drivingRides.map(ride => (
                  <RideCard key={ride.id} ride={ride as any} />
                ))}
              </div>
            </section>
          )}

          {/* Riding section */}
          {ridingRides.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                Riding
              </h2>
              <div className="space-y-3">
                {ridingRides.map(ride => (
                  <RideCard key={ride.id} ride={ride as any} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Run full test suite**

```bash
npm run test:run
```

Expected: PASS (all tests)

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add app/(app)/rides/page.tsx
git commit -m "feat: My Rides page with driving and riding sections"
```

---

### Task 14: Group Messaging (Inbox + Chat View)

**Files:**
- Replace: `app/(app)/inbox/page.tsx` (stub → full)
- Create: `app/(app)/inbox/[chatId]/page.tsx`
- Create: `components/messaging/chat-list-item.tsx`
- Create: `components/messaging/chat-view.tsx`
- Create: `components/messaging/__tests__/chat-list-item.test.tsx`
- Create: `components/messaging/__tests__/chat-view.test.tsx`

The chat view uses Supabase Realtime: it subscribes to `postgres_changes` on the `messages` table filtered by `chat_id`. Messages load on mount then append live. The inbox page is a server component; the chat view is a client component.

- [ ] **Step 1: Write failing tests for ChatListItem**

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

- [ ] **Step 2: Run test — verify it fails**

```bash
npm run test:run components/messaging/__tests__/chat-list-item.test.tsx
```

Expected: FAIL — "Cannot find module '../chat-list-item'"

- [ ] **Step 3: Create ChatListItem component**

Create `components/messaging/chat-list-item.tsx`:

```typescript
import Link from 'next/link'
import { MessageCircle } from 'lucide-react'

type Props = {
  chat: {
    id: string
    ride: {
      id: string
      departure_time: string
      event: { name: string }
    }
    lastMessage: {
      content: string
      sender_name: string
      created_at: string
    } | null
  }
}

export function ChatListItem({ chat }: Props) {
  const dateStr = new Date(chat.ride.departure_time).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  return (
    <Link
      href={`/inbox/${chat.id}`}
      className="flex items-start gap-3 p-4 border-b border-border hover:bg-muted/50 transition-colors"
    >
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

- [ ] **Step 4: Run ChatListItem test — verify it passes**

```bash
npm run test:run components/messaging/__tests__/chat-list-item.test.tsx
```

Expected: PASS (5 tests)

- [ ] **Step 5: Write failing tests for ChatView**

Create `components/messaging/__tests__/chat-view.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { ChatView } from '../chat-view'

const messages = [
  { id: 'm1', content: 'Hello everyone!', created_at: '2026-07-10T10:00:00Z',
    sender: { id: 'u2', full_name: 'Dana', avatar_url: null } },
  { id: 'm2', content: 'Can\'t wait for the show', created_at: '2026-07-10T10:01:00Z',
    sender: { id: 'u3', full_name: 'Ray', avatar_url: null } },
]

const mockChannel = {
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn().mockReturnThis(),
}

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
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

- [ ] **Step 6: Run test — verify it fails**

```bash
npm run test:run components/messaging/__tests__/chat-view.test.tsx
```

Expected: FAIL — "Cannot find module '../chat-view'"

- [ ] **Step 7: Create ChatView component**

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
  id: string
  content: string
  created_at: string
  sender: {
    id: string
    full_name: string
    avatar_url: string | null
  }
}

type Props = {
  chatId: string
  currentUserId: string
  initialMessages: Message[]
}

export function ChatView({ chatId, currentUserId, initialMessages }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const channel = supabase
      .channel(`chat-${chatId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
        async payload => {
          const { data } = await supabase
            .from('messages')
            .select('id, content, created_at, sender:profiles!sender_id(id, full_name, avatar_url)')
            .eq('id', (payload.new as { id: string }).id)
            .single()
          if (data) setMessages(prev => [...prev, data as Message])
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [chatId])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    const content = text.trim()
    if (!content) return
    setSending(true)
    setText('')

    await supabase.from('messages').insert({
      chat_id: chatId,
      sender_id: currentUserId,
      content,
    })
    setSending(false)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Messages */}
      <div role="log" className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map(msg => {
          const isOwn = msg.sender.id === currentUserId
          return (
            <div
              key={msg.id}
              className={cn('flex gap-2.5', isOwn ? 'flex-row-reverse' : 'flex-row')}
            >
              {!isOwn && (
                <Avatar className="w-7 h-7 shrink-0 mt-0.5">
                  {msg.sender.avatar_url && <AvatarImage src={msg.sender.avatar_url} />}
                  <AvatarFallback className="text-[10px] bg-muted">
                    {msg.sender.full_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              )}
              <div className={cn('max-w-[75%]', isOwn ? 'items-end' : 'items-start')}>
                {!isOwn && (
                  <p className="text-[10px] text-muted-foreground mb-1 ml-1">
                    {msg.sender.full_name}
                  </p>
                )}
                <div
                  className={cn(
                    'px-3 py-2 rounded-2xl text-sm',
                    isOwn
                      ? 'bg-foreground text-background rounded-tr-sm'
                      : 'bg-muted text-foreground rounded-tl-sm',
                  )}
                >
                  {msg.content}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 mx-1">
                  {new Date(msg.created_at).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={sendMessage}
        className="flex gap-2 px-4 py-3 border-t border-border bg-background"
      >
        <Input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Message…"
          className="flex-1"
          autoComplete="off"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!text.trim() || sending}
          aria-label="Send"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
```

- [ ] **Step 8: Run ChatView test — verify it passes**

```bash
npm run test:run components/messaging/__tests__/chat-view.test.tsx
```

Expected: PASS (6 tests)

- [ ] **Step 9: Replace inbox page stub with chat list**

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
    .select(`
      chat:ride_chats!chat_id(
        id,
        ride:rides!ride_id(
          id, departure_time,
          event:events!event_id(name)
        ),
        messages(id, content, created_at,
          sender:profiles!sender_id(full_name))
      )
    `)
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
      const msgs = (chat!.messages ?? []).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      const last = msgs[0] ?? null
      return {
        id: chat!.id,
        ride: chat!.ride!,
        lastMessage: last
          ? { content: last.content, sender_name: last.sender?.full_name ?? 'Someone', created_at: last.created_at }
          : null,
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
          <p className="text-xs text-muted-foreground mt-1">
            Chats appear here once you join a ride.
          </p>
        </div>
      ) : (
        <div>
          {chats.map(chat => (
            <ChatListItem key={chat.id} chat={chat as any} />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 10: Create chat detail page**

Create `app/(app)/inbox/[chatId]/page.tsx`:

```typescript
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ChatView } from '@/components/messaging/chat-view'

export default async function ChatPage({
  params,
}: {
  params: Promise<{ chatId: string }>
}) {
  const { chatId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verify the user is a member of this chat
  const { data: membership } = await supabase
    .from('ride_chat_members')
    .select('chat_id')
    .eq('chat_id', chatId)
    .eq('user_id', user.id)
    .single()

  if (!membership) notFound()

  // Fetch chat metadata
  const { data: chat } = await supabase
    .from('ride_chats')
    .select(`
      id,
      ride:rides!ride_id(
        id, departure_time,
        event:events!event_id(name)
      )
    `)
    .eq('id', chatId)
    .single()

  if (!chat) notFound()

  // Fetch initial messages (most recent 50, ordered oldest-first for display)
  const { data: rawMessages } = await supabase
    .from('messages')
    .select('id, content, created_at, sender:profiles!sender_id(id, full_name, avatar_url)')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: false })
    .limit(50)

  const messages = (rawMessages ?? []).reverse()

  const ride = chat.ride as any
  const eventName = ride?.event?.name ?? 'Ride Chat'
  const departureStr = ride?.departure_time
    ? new Date(ride.departure_time).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric',
      })
    : ''

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-3 border-b border-border shrink-0">
        <Link href="/inbox" className="text-muted-foreground">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{eventName}</p>
          {departureStr && (
            <p className="text-xs text-muted-foreground">{departureStr}</p>
          )}
        </div>
      </div>

      <ChatView
        chatId={chatId}
        currentUserId={user.id}
        initialMessages={messages as any}
      />
    </div>
  )
}
```

- [ ] **Step 11: Run all tests**

```bash
npm run test:run
```

Expected: PASS (all tests)

- [ ] **Step 12: Verify build**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 13: Commit**

```bash
git add app/(app)/inbox/ components/messaging/
git commit -m "feat: group messaging — inbox chat list and real-time chat view"
```

---

### Task 15: Friends System

**Files:**
- Create: `app/(app)/profile/friends/page.tsx`
- Create: `components/profile/user-search.tsx`
- Create: `components/profile/__tests__/user-search.test.tsx`

From the PRD: send/accept friend requests; mutual connections count is the only visible output at MVP. The friends page handles three concerns: incoming requests (accept/decline via server actions), existing friends list, and a client-side user search to send new requests. The `friendships` table is bidirectional — a friendship between A and B can be stored as `(A→B, accepted)` or `(B→A, accepted)`.

- [ ] **Step 1: Write failing tests for UserSearch**

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
        Object.assign(chain, {
          then: (cb: any) => Promise.resolve(cb({ data: [mockUser], error: null })),
        })
      } else {
        Object.assign(chain, {
          then: (cb: any) => Promise.resolve(cb({ data: null, error: null })),
        })
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

- [ ] **Step 2: Run test — verify it fails**

```bash
npm run test:run components/profile/__tests__/user-search.test.tsx
```

Expected: FAIL — "Cannot find module '../user-search'"

- [ ] **Step 3: Implement UserSearch**

Create `components/profile/user-search.tsx`:

```typescript
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
      setResults(data ?? [])
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
```

- [ ] **Step 4: Run test — verify it passes**

```bash
npm run test:run components/profile/__tests__/user-search.test.tsx
```

Expected: PASS (6 tests)

- [ ] **Step 5: Create friends page**

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

  // Incoming requests (user is addressee, status = pending)
  const { data: incomingRaw } = await supabase
    .from('friendships')
    .select('id, requester:profiles!requester_id(id, full_name, username, avatar_url)')
    .eq('addressee_id', user.id)
    .eq('status', 'pending')

  const incoming = (incomingRaw ?? []) as Array<{
    id: string
    requester: { id: string; full_name: string; username: string; avatar_url: string | null } | null
  }>

  // Accepted friends (either direction)
  const { data: friendsRaw } = await supabase
    .from('friendships')
    .select('id, requester_id, addressee_id, requester:profiles!requester_id(id, full_name, username, avatar_url), addressee:profiles!addressee_id(id, full_name, username, avatar_url)')
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
    .eq('status', 'accepted')

  const friends = (friendsRaw ?? []).map(f => {
    const isRequester = (f as any).requester_id === user.id
    return isRequester ? (f as any).addressee : (f as any).requester
  }).filter(Boolean) as Array<{ id: string; full_name: string; username: string; avatar_url: string | null }>

  // Pending outgoing (for UserSearch to know which are already pending)
  const { data: outgoingRaw } = await supabase
    .from('friendships')
    .select('addressee_id')
    .eq('requester_id', user.id)
    .eq('status', 'pending')

  const pendingIds = (outgoingRaw ?? []).map(r => r.addressee_id)
  const friendIds  = friends.map(f => f.id)

  // ─── Server actions ───────────────────────────────────────────────────────

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
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/profile" className="text-muted-foreground">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">Friends</h1>
      </div>

      {/* Incoming requests */}
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
                    {req.requester?.avatar_url && <AvatarImage src={req.requester.avatar_url} />}
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

      {/* Friends list */}
      <section className="mb-8">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Friends ({friends.length})
        </h2>

        {friends.length === 0 ? (
          <p className="text-sm text-muted-foreground">No friends yet. Search below to add some.</p>
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

      {/* Find friends */}
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
```

- [ ] **Step 6: Run full test suite**

```bash
npm run test:run
```

Expected: PASS (all tests)

- [ ] **Step 7: Verify build**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 8: Commit**

```bash
git add app/(app)/profile/friends/ components/profile/user-search.tsx components/profile/__tests__/user-search.test.tsx
git commit -m "feat: friends system — send/accept requests, friends list, user search"
```

---

## Phase 1 Complete ✓

All 15 tasks implemented. The full MVP is now planned end-to-end:

| Task | Feature |
|------|---------|
| 1 | Project setup, dark theme, Vitest |
| 2 | Database schema, RLS, triggers |
| 3 | Auth (login/signup/verify-email), middleware |
| 4 | App shell, bottom nav, FAB |
| 5 | Seat templates, Haversine, cost split |
| 6 | Profile page, edit profile, phone verification |
| 7 | Events directory with search |
| 8 | Event detail, create event with fuzzy duplicate detection |
| 9 | Vehicle registration with live seat preview |
| 10 | Interactive SVG seat map |
| 11 | 4-step create ride wizard |
| 12 | Ride detail, application form, driver accept/reject |
| 13 | My Rides page (driving + riding sections) |
| 14 | Group messaging with Supabase Realtime |
| 15 | Friends system — send/accept, user search |
