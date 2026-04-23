-- ============================================================
-- 005_steam_tracker_auth.sql
-- Run in Supabase SQL Editor: Dashboard → SQL Editor
-- Tightens RLS on steam_game_status: anon read-only, authenticated write
-- ============================================================

drop policy if exists "Allow all on steam_game_status" on steam_game_status;

create policy "Anon read steam_game_status"
  on steam_game_status
  for select
  to anon, authenticated
  using (true);

create policy "Authenticated write steam_game_status"
  on steam_game_status
  for all
  to authenticated
  using (true)
  with check (true);
