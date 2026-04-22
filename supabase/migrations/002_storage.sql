-- ============================================================
-- 002_storage.sql
-- Run in Supabase SQL Editor after 001_initial_schema.sql.
-- Creates the campaign-maps storage bucket and RLS policies.
-- ============================================================

-- Create the bucket (public so images are readable without auth)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'campaign-maps',
  'campaign-maps',
  true,
  10485760,  -- 10 MB per file
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- Anyone can read (bucket is public, enforced at bucket level too)
create policy "Public read on campaign-maps"
  on storage.objects for select
  using (bucket_id = 'campaign-maps');

-- Only GMs can upload. Files must be stored under {campaignId}/{filename}.
-- split_part(name, '/', 1) extracts the campaign ID from the path.
create policy "GMs can upload to campaign-maps"
  on storage.objects for insert
  with check (
    bucket_id = 'campaign-maps'
    and auth.uid() is not null
    and exists (
      select 1 from public.campaign_members
      where campaign_id = split_part(name, '/', 1)
      and user_id = auth.uid()
      and role = 'gm'
    )
  );

create policy "GMs can update campaign-maps files"
  on storage.objects for update
  using (
    bucket_id = 'campaign-maps'
    and auth.uid() is not null
    and exists (
      select 1 from public.campaign_members
      where campaign_id = split_part(name, '/', 1)
      and user_id = auth.uid()
      and role = 'gm'
    )
  );

create policy "GMs can delete campaign-maps files"
  on storage.objects for delete
  using (
    bucket_id = 'campaign-maps'
    and auth.uid() is not null
    and exists (
      select 1 from public.campaign_members
      where campaign_id = split_part(name, '/', 1)
      and user_id = auth.uid()
      and role = 'gm'
    )
  );
