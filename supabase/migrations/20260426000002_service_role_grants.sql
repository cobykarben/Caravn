-- Grant service_role full access to all tables so the admin client
-- (used by AI tool handlers) can query via PostgREST.
-- service_role already bypasses RLS but needs explicit PostgREST grants.
grant usage on schema public to service_role;
grant all on all tables    in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;

alter default privileges in schema public
  grant all on tables    to service_role;
alter default privileges in schema public
  grant all on sequences to service_role;
alter default privileges in schema public
  grant execute on functions to service_role;
