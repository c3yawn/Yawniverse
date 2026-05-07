-- Rename species IDs to match display names and sprite filenames.
-- Drops and recreates FK constraints to allow PK updates.

begin;

-- Drop FK constraints that reference species(id)
alter table species_biomes drop constraint species_biomes_species_id_fkey;
alter table creatures       drop constraint creatures_species_id_fkey;

-- Update child tables first
update species_biomes set species_id = 'sandreaver'   where species_id = 'ashwolf';
update species_biomes set species_id = 'ridgecrown'   where species_id = 'thornback';
update species_biomes set species_id = 'lucerna'      where species_id = 'shardback';
update species_biomes set species_id = 'kaminari'     where species_id = 'tempest_ray';
update species_biomes set species_id = 'raijin'       where species_id = 'vortaxis';
update species_biomes set species_id = 'hazama'       where species_id = 'cinderstalker';
update species_biomes set species_id = 'scoria'       where species_id = 'emberclaw';
update species_biomes set species_id = 'rimewarden'   where species_id = 'glaciarch';

update creatures set species_id = 'sandreaver'   where species_id = 'ashwolf';
update creatures set species_id = 'ridgecrown'   where species_id = 'thornback';
update creatures set species_id = 'lucerna'      where species_id = 'shardback';
update creatures set species_id = 'kaminari'     where species_id = 'tempest_ray';
update creatures set species_id = 'raijin'       where species_id = 'vortaxis';
update creatures set species_id = 'hazama'       where species_id = 'cinderstalker';
update creatures set species_id = 'scoria'       where species_id = 'emberclaw';
update creatures set species_id = 'rimewarden'   where species_id = 'glaciarch';

-- Update the species PKs
update species set id = 'sandreaver'   where id = 'ashwolf';
update species set id = 'ridgecrown'   where id = 'thornback';
update species set id = 'lucerna'      where id = 'shardback';
update species set id = 'kaminari'     where id = 'tempest_ray';
update species set id = 'raijin'       where id = 'vortaxis';
update species set id = 'hazama'       where id = 'cinderstalker';
update species set id = 'scoria'       where id = 'emberclaw';
update species set id = 'rimewarden'   where id = 'glaciarch';

-- Restore FK constraints
alter table species_biomes add constraint species_biomes_species_id_fkey
  foreign key (species_id) references species(id) on delete cascade;

alter table creatures add constraint creatures_species_id_fkey
  foreign key (species_id) references species(id);

commit;
