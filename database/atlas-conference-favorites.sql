-- ATLAS ELE: private conference favourites, deploy only in a dedicated ATLAS ELE Supabase project.
-- No data is stored in GitHub. The app must authenticate via Supabase Auth.
create table if not exists public.conference_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id text not null check (length(event_id) between 1 and 160),
  notify_registration boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (user_id, event_id)
);
alter table public.conference_favorites enable row level security;
revoke all on public.conference_favorites from anon;
grant select,insert,update,delete on public.conference_favorites to authenticated;
-- App authorization is assigned by trusted server-side admin, NEVER user_metadata.
create policy "Owner reads own favorites" on public.conference_favorites
  for select to authenticated
  using ((select auth.uid()) = user_id and (select auth.jwt()->'app_metadata'->>'atlas_role') = 'admin');
create policy "Owner inserts own favorites" on public.conference_favorites
  for insert to authenticated
  with check ((select auth.uid()) = user_id and (select auth.jwt()->'app_metadata'->>'atlas_role') = 'admin');
create policy "Owner updates own favorites" on public.conference_favorites
  for update to authenticated
  using ((select auth.uid()) = user_id and (select auth.jwt()->'app_metadata'->>'atlas_role') = 'admin')
  with check ((select auth.uid()) = user_id and (select auth.jwt()->'app_metadata'->>'atlas_role') = 'admin');
create policy "Owner deletes own favorites" on public.conference_favorites
  for delete to authenticated
  using ((select auth.uid()) = user_id and (select auth.jwt()->'app_metadata'->>'atlas_role') = 'admin');

-- Event metadata is public and separate from the owner's favorites.
-- Registration alerts need a server-side scheduled checker, confirmed registration URL,
-- opt-in destination and deduplication; they are NOT enabled by this migration.
