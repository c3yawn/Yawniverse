-- Add egg→juvenile threshold (replaces the old hatchling→juvenile role)
insert into game_settings (key, value, description) values
  ('egg_views_threshold', 25, 'Views to progress from egg → juvenile')
on conflict (key) do nothing;

-- Update stage progression: egg → juvenile → adult (no hatchling step)
create or replace function check_stage_progression()
returns trigger
language plpgsql
security definer
as $$
declare
  v_egg_threshold      integer;
  v_juvenile_threshold integer;
begin
  select value into v_egg_threshold      from game_settings where key = 'egg_views_threshold';
  select value into v_juvenile_threshold from game_settings where key = 'juvenile_views_threshold';

  if NEW.stage = 'egg' and NEW.views >= v_egg_threshold then
    NEW.stage := 'juvenile';
  elsif NEW.stage = 'juvenile' and NEW.views >= v_juvenile_threshold then
    NEW.stage := 'adult';
    NEW.grew_up_at := now();
  end if;

  return NEW;
end;
$$;

-- Update breed_creatures: offspring start as eggs, cap checks egg stage
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

  insert into creatures (
    species_id, owner_id, gender, stage,
    is_cave_born, generation, mother_id, father_id
  ) values (
    v_species_id, p_user_id,
    case when random() < 0.5 then 'male'::creature_gender else 'female'::creature_gender end,
    'egg', false,
    greatest(v_p1.generation, v_p2.generation) + 1,
    p_parent_1_id, p_parent_2_id
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
