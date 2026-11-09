-- Avatar storage bucket + RLS policies
-- Create public bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('avatars', 'avatars', true, 3145728, -- 3 MB hard cap
        array['image/jpg', 'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/webm'])
on conflict (id)
    do update set
        public = EXCLUDED.public,
        file_size_limit = EXCLUDED.file_size_limit,
        allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Anyone can read (avatars are public)
drop policy if exists "avatars_public_read" on storage.objects;

create policy "avatars_public_read" on storage.objects
    for select to anon, authenticated
    using (bucket_id = 'avatars');

-- Users can upload only into their own folder
drop policy if exists "avatars_own_upload" on storage.objects;

create policy "avatars_own_upload" on storage.objects
    for insert to authenticated
    with check (bucket_id = 'avatars'
    and (storage.foldername (name))[1] = auth.uid ()::text);

-- Users can delete only from their own folder
drop policy if exists "avatars_own_delete" on storage.objects;

create policy "avatars_own_delete" on storage.objects
    for delete to authenticated
    using (bucket_id = 'avatars'
        and (storage.foldername (name))[1] = auth.uid ()::text);

-- Files are immutable — must upload new, delete old
drop policy if exists "avatars_no_update" on storage.objects;

create policy "avatars_no_update" on storage.objects
    for update to authenticated
    using (false);

-- Banners bucket (bigger limit than avatars — wider images)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('banners', 'banners', true, 5242880, -- 5 MB hard cap
        array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/webm'])
on conflict (id)
    do update set
        public = EXCLUDED.public,
        file_size_limit = EXCLUDED.file_size_limit,
        allowed_mime_types = EXCLUDED.allowed_mime_types;

drop policy if exists "banners_public_read" on storage.objects;

drop policy if exists "banners_own_upload" on storage.objects;

drop policy if exists "banners_own_delete" on storage.objects;

drop policy if exists "banners_no_update" on storage.objects;

create policy "banners_public_read" on storage.objects
    for select to anon, authenticated
    using (bucket_id = 'banners');

create policy "banners_own_upload" on storage.objects
    for insert to authenticated
    with check (bucket_id = 'banners'
    and (storage.foldername (name))[1] = auth.uid ()::text);

create policy "banners_own_delete" on storage.objects
    for delete to authenticated
    using (bucket_id = 'banners'
        and (storage.foldername (name))[1] = auth.uid ()::text);

create policy "banners_no_update" on storage.objects
    for update to authenticated
    using (false);

-- banner column to users (nullable)
alter table public.users
    add column if not exists banner text;

