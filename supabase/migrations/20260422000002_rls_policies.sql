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
