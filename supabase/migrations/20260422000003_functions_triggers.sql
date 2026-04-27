-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, username)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), 'New User'),
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Prevent invalid ride status transitions
create or replace function guard_ride_status_transition()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if old.status in ('cancelled', 'completed') and new.status <> old.status then
    raise exception 'Cannot change status of a % ride', old.status;
  end if;
  return new;
end;
$$;

create trigger on_ride_status_guard
  before update of status on rides
  for each row execute function guard_ride_status_transition();

-- Auto-create group chat when ride status changes to active
create or replace function handle_ride_published()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare v_chat_id uuid;
begin
  if new.status = 'active' and (old.status is null or old.status = 'draft') then
    insert into public.ride_chats (ride_id) values (new.id)
      on conflict (ride_id) do nothing
      returning id into v_chat_id;
    if v_chat_id is null then
      select id into v_chat_id from public.ride_chats where ride_id = new.id;
    end if;
    insert into public.ride_chat_members (chat_id, user_id) values (v_chat_id, new.driver_id)
      on conflict do nothing;
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
  v_status   text;
begin
  select seat_map into v_seat_map from public.rides where id = new.ride_id;

  -- for each seat in every non-cancelled application on this ride,
  -- derive its status from the highest-priority application touching it
  for v_seat_id in
    select distinct unnest(seat_ids)
    from public.ride_applications
    where ride_id = new.ride_id and status <> 'cancelled'
  loop
    -- priority: accepted > pending > (nothing)
    select case
      when bool_or(status = 'accepted') then 'occupied'
      when bool_or(status = 'pending')  then 'reserved'
      else 'available'
    end into v_status
    from public.ride_applications
    where ride_id = new.ride_id
      and status <> 'cancelled'
      and v_seat_id = any(seat_ids);

    v_seat_map := jsonb_set(v_seat_map, array[v_seat_id, 'status'], to_jsonb(v_status));
  end loop;

  -- reset any seat not covered by an active application back to available
  -- (handles the case where the current change freed up all applications for a seat)
  for v_seat_id in
    select key from jsonb_each(v_seat_map)
  loop
    if not exists (
      select 1 from public.ride_applications
      where ride_id = new.ride_id
        and status <> 'cancelled'
        and v_seat_id = any(seat_ids)
    ) then
      if v_seat_map->v_seat_id->>'status' not in ('driver', 'available') then
        v_seat_map := jsonb_set(v_seat_map, array[v_seat_id, 'status'], '"available"');
      end if;
    end if;
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
security definer set search_path = ''
as $$
  select
    e.id, e.name, e.venue_name, e.starts_at,
    (
      public.similarity(e.name, p_name) * 0.5 +
      public.similarity(e.venue_name, p_venue) * 0.3 +
      case when abs(extract(epoch from e.starts_at - p_starts_at)) < 86400 then 0.2 else 0 end
    ) as score
  from public.events e
  where public.similarity(e.name, p_name) > 0.3 or public.similarity(e.venue_name, p_venue) > 0.4
  order by score desc
  limit 5;
$$;
