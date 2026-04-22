-- ============================================================
-- 001_initial_schema.sql
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor).
-- ============================================================

-- ------------------------------------------------------------
-- profiles
-- Public display info synced from auth.users on first sign-in.
-- ------------------------------------------------------------
create table if not exists profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url   text,
  updated_at   timestamptz default now()
);

alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on profiles for select using (true);

create policy "Users can upsert their own profile"
  on profiles for insert with check (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update using (auth.uid() = id);

-- ------------------------------------------------------------
-- campaign_members
-- Tracks who has joined each campaign and their role.
-- campaign_id references the static id from campaigns.js.
-- role: 'gm' | 'player'
-- ------------------------------------------------------------
create table if not exists campaign_members (
  id          uuid primary key default gen_random_uuid(),
  campaign_id text not null,
  user_id     uuid references auth.users(id) on delete cascade not null,
  role        text not null default 'player' check (role in ('gm', 'player')),
  joined_at   timestamptz default now(),
  unique(campaign_id, user_id)
);

alter table campaign_members enable row level security;

-- Anyone authenticated can read membership lists (needed to show character names)
create policy "Authenticated users can read memberships"
  on campaign_members for select using (auth.uid() is not null);

-- Users can only insert their own membership row
create policy "Users can join campaigns"
  on campaign_members for insert with check (auth.uid() = user_id);

-- Users can leave (delete their own row)
create policy "Users can leave campaigns"
  on campaign_members for delete using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- characters
-- One character sheet per user per campaign.
-- sheet_data is JSONB — structure is defined by systems.js.
-- ------------------------------------------------------------
create table if not exists characters (
  id          uuid primary key default gen_random_uuid(),
  campaign_id text not null,
  user_id     uuid references auth.users(id) on delete cascade not null,
  system_id   text not null,
  name        text not null check (char_length(name) between 1 and 100),
  sheet_data  jsonb not null default '{}',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique(campaign_id, user_id)
);

alter table characters enable row level security;

-- Campaign members can read all character sheets in campaigns they belong to
create policy "Members can read characters in their campaigns"
  on characters for select using (
    exists (
      select 1 from campaign_members
      where campaign_id = characters.campaign_id
      and user_id = auth.uid()
    )
  );

-- Users can insert their own character
create policy "Users can create their own character"
  on characters for insert with check (auth.uid() = user_id);

-- Users can update only their own character
create policy "Users can update their own character"
  on characters for update using (auth.uid() = user_id);

-- Users can delete their own character
create policy "Users can delete their own character"
  on characters for delete using (auth.uid() = user_id);

-- Keep updated_at current
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger characters_updated_at
  before update on characters
  for each row execute function update_updated_at();

-- ------------------------------------------------------------
-- messages
-- Persistent campaign chat. Immutable once inserted.
-- ------------------------------------------------------------
create table if not exists messages (
  id          uuid primary key default gen_random_uuid(),
  campaign_id text not null,
  user_id     uuid references auth.users(id) on delete cascade not null,
  content     text not null check (char_length(content) between 1 and 2000),
  created_at  timestamptz default now()
);

alter table messages enable row level security;

-- Only campaign members can read messages
create policy "Members can read campaign messages"
  on messages for select using (
    exists (
      select 1 from campaign_members
      where campaign_id = messages.campaign_id
      and user_id = auth.uid()
    )
  );

-- Members can send messages; user_id must match the authenticated user
create policy "Members can send messages"
  on messages for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from campaign_members
      where campaign_id = messages.campaign_id
      and user_id = auth.uid()
    )
  );

-- No updates or deletes — chat log is immutable

-- Enable Realtime for messages (run separately in Supabase dashboard if needed)
-- alter publication supabase_realtime add table messages;

-- ------------------------------------------------------------
-- campaign_maps
-- Stores map data per campaign.
-- map_type 'leaflet' → image_url + markers JSON
-- map_type 'hex-grid' → hex/route JSON (SWN sector maps)
-- ------------------------------------------------------------
create table if not exists campaign_maps (
  campaign_id text primary key,
  map_type    text not null check (map_type in ('leaflet', 'hex-grid')),
  image_url   text,
  data        jsonb not null default '{}',
  updated_at  timestamptz default now()
);

alter table campaign_maps enable row level security;

-- All campaign members can view the map
create policy "Members can view campaign map"
  on campaign_maps for select using (
    exists (
      select 1 from campaign_members
      where campaign_id = campaign_maps.campaign_id
      and user_id = auth.uid()
    )
  );

-- Only GMs can create or update the map
create policy "GMs can create campaign map"
  on campaign_maps for insert with check (
    exists (
      select 1 from campaign_members
      where campaign_id = campaign_maps.campaign_id
      and user_id = auth.uid()
      and role = 'gm'
    )
  );

create policy "GMs can update campaign map"
  on campaign_maps for update using (
    exists (
      select 1 from campaign_members
      where campaign_id = campaign_maps.campaign_id
      and user_id = auth.uid()
      and role = 'gm'
    )
  );

create trigger campaign_maps_updated_at
  before update on campaign_maps
  for each row execute function update_updated_at();

-- ------------------------------------------------------------
-- indexes for common query patterns
-- ------------------------------------------------------------
create index if not exists idx_campaign_members_campaign_id on campaign_members(campaign_id);
create index if not exists idx_campaign_members_user_id on campaign_members(user_id);
create index if not exists idx_characters_campaign_id on characters(campaign_id);
create index if not exists idx_messages_campaign_id_created on messages(campaign_id, created_at asc);
