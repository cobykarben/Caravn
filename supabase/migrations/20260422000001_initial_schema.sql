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
