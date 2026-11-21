-- ─────────────────────────────────────────────────────────────────
-- Gate avatar/banner uploads behind donor tier
--
--   Static (jpg/jpeg/png/webp)   →  tier-1+ (Bronze, ≥₹50)
--   Animated (gif/webm)          →  tier-2+ (Gold, ≥₹169)
--
-- Uses get_my_tier() which reads
-- notification_tags — the same source of truth the client uses via
-- getDonorTier(tags). Single source of truth, no drift.
--
-- Read / delete / no-update policies are unchanged. Only INSERT is
-- gated. Existing avatars and banners on users continue to render
-- for everyone (read path is not restricted).
-- ─────────────────────────────────────────────────────────────────
-- ─── avatars bucket ─────────────────────────────────────────────
drop policy if exists "avatars_own_upload" on storage.objects;

create policy "avatars_own_upload" on storage.objects
    for insert to authenticated
    with check (bucket_id = 'avatars'
    and (storage.foldername (name))[1] = auth.uid ()::text
    and ((lower(name) ~ '\.(jpg|jpeg|png|webp)$'
    and public.get_my_tier () >= 1)
    or (lower(name) ~ '\.(gif|webm)$'
    and public.get_my_tier () >= 2)));

-- ─── banners bucket ─────────────────────────────────────────────
drop policy if exists "banners_own_upload" on storage.objects;

create policy "banners_own_upload" on storage.objects
    for insert to authenticated
    with check (bucket_id = 'banners'
    and (storage.foldername (name))[1] = auth.uid ()::text
    and ((lower(name) ~ '\.(jpg|jpeg|png|webp)$'
    and public.get_my_tier () >= 1)
    or (lower(name) ~ '\.(gif|webm)$'
    and public.get_my_tier () >= 2)));

-- ─── Deprecate user_can_upload_animated ─────────────────────────
-- Old function read SUM(actual_amount) from donations directly.
-- Now that tags are the single source of truth (kept in sync by
-- recompute_user_tier), delegate to get_my_tier() so client-side
-- checks (call sites in AvatarUploadButton) stay consistent with
-- the RLS policy above.
create or replace function public.user_can_upload_animated ()
    returns boolean
    language sql
    stable
    security definer
    set search_path = public
    as $$
    select
        public.get_my_tier () >= 2;
$$;

grant execute on function public.user_can_upload_animated () to authenticated;
