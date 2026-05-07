-- Shared expedition pool: 3 slots per world, check-on-read 5-minute refresh.

create table expedition_pool (
  world_id    text not null references biomes(id) on delete cascade,
  slot        smallint not null check (slot between 1 and 3),
  species_id  text not null references species(id),
  gender      creature_gender not null,
  created_at  timestamptz not null default now(),
  primary key (world_id, slot)
);

alter table expedition_pool enable row level security;
create policy "expedition_pool_public_read" on expedition_pool for select using (true);

-- Weighted random species selection for a world (Gumbel-max trick)
create or replace function random_species_for_world(p_world_id text)
returns text language sql security definer as $$
  select species_id
  from species_biomes
  where biome_id = p_world_id
  order by -log(random()) / spawn_weight
  limit 1;
$$;

-- Get pool for a world: initialise missing slots, refresh stale ones, return all 3
create or replace function get_expedition_pool(p_world_id text)
returns table (slot smallint, species_id text, gender text, created_at timestamptz)
language plpgsql security definer as $$
declare
  i smallint;
begin
  -- Initialise missing slots
  for i in 1..3 loop
    insert into expedition_pool (world_id, slot, species_id, gender)
    values (
      p_world_id, i,
      random_species_for_world(p_world_id),
      case when random() < 0.5 then 'male'::creature_gender else 'female'::creature_gender end
    )
    on conflict (world_id, slot) do nothing;
  end loop;

  -- Refresh slots older than 5 minutes
  update expedition_pool
  set species_id = random_species_for_world(p_world_id),
      gender     = case when random() < 0.5 then 'male'::creature_gender else 'female'::creature_gender end,
      created_at = now()
  where world_id  = p_world_id
    and created_at < now() - interval '5 minutes';

  return query
    select ep.slot, ep.species_id, ep.gender::text, ep.created_at
    from expedition_pool ep
    where ep.world_id = p_world_id
    order by ep.slot;
end;
$$;

-- Replace a single slot after adoption, return the new slot row
create or replace function replace_expedition_slot(p_world_id text, p_slot smallint)
returns table (slot smallint, species_id text, gender text, created_at timestamptz)
language plpgsql security definer as $$
begin
  update expedition_pool
  set species_id = random_species_for_world(p_world_id),
      gender     = case when random() < 0.5 then 'male'::creature_gender else 'female'::creature_gender end,
      created_at = now()
  where world_id = p_world_id
    and slot     = p_slot;

  return query
    select ep.slot, ep.species_id, ep.gender::text, ep.created_at
    from expedition_pool ep
    where ep.world_id = p_world_id
      and ep.slot     = p_slot;
end;
$$;
