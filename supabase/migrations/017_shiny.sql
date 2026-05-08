-- Add shiny flag to creatures
alter table creatures add column if not exists is_shiny boolean not null default false;

-- Update breed_creatures to roll for shiny (1/256 chance, breeding-only)
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
  v_p1           creatures%rowtype;
  v_p2           creatures%rowtype;
  v_egg_count    integer;
  v_species_id   text;
  v_offspring_id uuid;
  v_cooldown     timestamptz;
  v_is_shiny     boolean;
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

  select count(*) into v_egg_count
    from creatures where owner_id = p_user_id and stage = 'egg';

  if v_egg_count >= 5 then
    raise exception 'egg_cap';
  end if;

  v_species_id := case when random() < 0.5 then v_p1.species_id else v_p2.species_id end;
  v_cooldown   := now() + interval '7 days';
  v_is_shiny   := random() < (1.0 / 256.0);

  insert into creatures (
    species_id, owner_id, gender, stage,
    is_cave_born, generation, mother_id, father_id, is_shiny
  ) values (
    v_species_id, p_user_id,
    case when random() < 0.5 then 'male'::creature_gender else 'female'::creature_gender end,
    'egg', false,
    greatest(v_p1.generation, v_p2.generation) + 1,
    p_parent_1_id, p_parent_2_id,
    v_is_shiny
  )
  returning id into v_offspring_id;

  update creatures set breed_cooldown_until = v_cooldown
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
