-- ============================================================
-- 009_rename_species.sql
-- Apply final creature name changes from design session.
-- Run in Supabase SQL Editor: Dashboard → SQL Editor
-- ============================================================

update species set name = 'Sungrazer'  where id = 'duskstrider';
update species set name = 'Sandreaver' where id = 'ashwolf';
update species set name = 'Ridgecrown' where id = 'thornback';
update species set name = 'Lucerna'    where id = 'shardback';
update species set name = 'Kaminari'   where id = 'tempest_ray';
update species set name = 'Raijin'     where id = 'vortaxis';
update species set name = 'Hazama'     where id = 'cinderstalker';
update species set name = 'Scoria'     where id = 'emberclaw';
update species set name = 'Rimewarden' where id = 'glaciarch';
