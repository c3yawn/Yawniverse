-- Add cooldown column directly to creatures for easy querying
alter table creatures add column if not exists breed_cooldown_until timestamptz;

-- Atomic breeding transaction. Validates everything and creates offspring in one call.
create or replace function breed_creatures(
  p_parent_1_id uuid,
  p_parent_2_id uuid,
  p_user_id     uuid
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_p1              creatures%rowtype;
  v_p2              creatures%rowtype;
  v_hatchling_count integer;
  v_species_id      text;
  v_offspring_id    uuid;
  v_cooldown        timestamptz;
begin
  select * into v_p1 from creatures where id = p_parent_1_id;
  select * into v_p2 from creatures where id = p_parent_2_id;

  if v_p1.id is null or v_p2.id is null then
    raise exception 'creature_not_found';
  end if;

  if v_p1.owner_id != p_user_id or v_p2.owner_id != p_user_id then
    raise exception 'not_owner';
  end if;

  if v_p1.stage != 'adult' or v_p2.stage != 'adult' then
    raise exception 'not_adult';
  end if;

  if (v_p1.breed_cooldown_until is not null and v_p1.breed_cooldown_until > now()) or
     (v_p2.breed_cooldown_until is not null and v_p2.breed_cooldown_until > now()) then
    raise exception 'on_cooldown';
  end if;

  -- Enforce hatchling cap (same 5-limit as expeditions)
  select count(*) into v_hatchling_count
    from creatures
    where owner_id = p_user_id and stage = 'hatchling';

  if v_hatchling_count >= 5 then
    raise exception 'hatchling_cap';
  end if;

  -- Random 50/50 species from parents
  v_species_id := case when random() < 0.5 then v_p1.species_id else v_p2.species_id end;
  v_cooldown   := now() + interval '7 days';

  insert into creatures (
    species_id, owner_id, gender, stage,
    is_cave_born, generation, mother_id, father_id
  ) values (
    v_species_id,
    p_user_id,
    case when random() < 0.5 then 'male'::creature_gender else 'female'::creature_gender end,
    'hatchling',
    false,
    greatest(v_p1.generation, v_p2.generation) + 1,
    p_parent_1_id,
    p_parent_2_id
  )
  returning id into v_offspring_id;

  update creatures
    set breed_cooldown_until = v_cooldown
    where id in (p_parent_1_id, p_parent_2_id);

  insert into breeding_records (
    parent_1_id, parent_2_id, offspring_id, outcome,
    initiated_by, parent_1_cooldown_until, parent_2_cooldown_until
  ) values (
    p_parent_1_id, p_parent_2_id, v_offspring_id, 'egg_produced',
    p_user_id, v_cooldown, v_cooldown
  );

  return v_offspring_id;
end;
$$;
