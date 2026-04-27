-- Grant table/sequence/function access to authenticated and anon roles.
-- Supabase sets these via ALTER DEFAULT PRIVILEGES at project creation, but
-- some project configs require explicit grants for tables created via migration.
grant usage on schema public to anon, authenticated;
grant all on all tables    in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;
grant execute on all functions in schema public to anon, authenticated;

alter default privileges in schema public
  grant all on tables    to anon, authenticated;
alter default privileges in schema public
  grant all on sequences to anon, authenticated;
alter default privileges in schema public
  grant execute on functions to anon, authenticated;

-- Backfill profiles for users who signed up before the handle_new_user
-- trigger was deployed (migration 3 was local-only until now).
insert into public.profiles (id, full_name, username)
select
  u.id,
  coalesce(nullif(trim(u.raw_user_meta_data->>'full_name'), ''), 'New User'),
  coalesce(
    nullif(trim(u.raw_user_meta_data->>'username'), ''),
    'user_' || substr(u.id::text, 1, 8)
  )
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
on conflict (id) do nothing;
