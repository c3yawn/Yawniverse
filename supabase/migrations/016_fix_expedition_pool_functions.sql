-- Fix ambiguous column reference 'slot' in expedition pool functions.
-- Caused by RETURNS TABLE column named 'slot' conflicting with the same
-- column name in the expedition_pool table body references.

create or replace function get_expedition_pool(p_world_id text)
returns table (slot smallint, species_id text, gender text, created_at timestamptz)
language plpgsql security definer as $$
declare
  i smallint;
begin
  for i in 1..3 loop
    insert into expedition_pool as ep (world_id, slot, species_id, gender)
    values (
      p_world_id, i,
      random_species_for_world(p_world_id),
      case when random() < 0.5 then 'male'::creature_gender else 'female'::creature_gender end
    )
    on conflict on constraint expedition_pool_pkey do nothing;
  end loop;

  update expedition_pool as ep_upd
  set species_id = random_species_for_world(p_world_id),
      gender     = case when random() < 0.5 then 'male'::creature_gender else 'female'::creature_gender end,
      created_at = now()
  where ep_upd.world_id  = p_world_id
    and ep_upd.created_at < now() - interval '5 minutes';

  return query
    select ep.slot, ep.species_id, ep.gender::text, ep.created_at
    from expedition_pool ep
    where ep.world_id = p_world_id
    order by ep.slot;
end;
$$;

create or replace function replace_expedition_slot(p_world_id text, p_slot smallint)
returns table (slot smallint, species_id text, gender text, created_at timestamptz)
language plpgsql security definer as $$
begin
  update expedition_pool as ep_upd
  set species_id = random_species_for_world(p_world_id),
      gender     = case when random() < 0.5 then 'male'::creature_gender else 'female'::creature_gender end,
      created_at = now()
  where ep_upd.world_id = p_world_id
    and ep_upd.slot     = p_slot;

  return query
    select ep.slot, ep.species_id, ep.gender::text, ep.created_at
    from expedition_pool ep
    where ep.world_id  = p_world_id
      and ep.slot      = p_slot;
end;
$$;
