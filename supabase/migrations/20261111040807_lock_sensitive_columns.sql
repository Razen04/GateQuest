-- ─────────────────────────────────────────────────────────────────
-- Column-level lockdown on users + donations
--
-- Closes the two live attack vectors on the donor tier system:
--
--   1. Users.notification_tags update → inject donor:tier-3 + role:donor
--      → unlock every perk for free.
--
--   2. Donations INSERT with verified=true + actual_amount=5000
--      → trigger awards tier-3 automatically.
--
-- Both are currently possible because RLS is row-level, not
-- column-level. This migration adds column-level GRANT/REVOKE on
-- top of the existing RLS policies.
--
-- SECURITY DEFINER triggers (recompute_user_tier, refresh_user_goal_tags,
-- guard_ai_custom_prompt) and edge functions (service_role) bypass
-- column grants entirely — server automation paths are unaffected.
-- ─────────────────────────────────────────────────────────────────
-- ═══════════════ USERS ═══════════════════════════════════════════
revoke update on public.users from authenticated, anon;

grant update (name, avatar, banner, show_name, college, "targetYear", settings, username, -- guarded by trigger below
    about, is_public, onboarding_completed) on public.users to authenticated;

-- ═══════════════ DONATIONS ═══════════════════════════════════════
revoke insert, update, delete on public.donations from authenticated, anon;

grant insert (user_id, anonymous, message, suggested_amount, actual_amount, utr) on public.donations to authenticated;

-- ═══════════════ GUARD: username immutable after set ════════════
create or replace function public.guard_username_immutable ()
    returns trigger
    language plpgsql
    as $$
begin
    if old.username is not null and new.username is distinct from old.username then
        raise exception 'username cannot be changed once set'
            using ERRCODE = '42501';
    end if;
    return NEW;
end;
$$;

drop trigger if exists guard_username_immutable on public.users;

create trigger guard_username_immutable
    before update on public.users for each row
    execute function public.guard_username_immutable ();

-- ═══════════════ GUARD: aiCustomPrompt tier check ═══════════════
-- Even though we GRANT UPDATE (settings), a tier-0 user should not be
-- able to persist aiCustomPrompt. The trigger silently strips the
-- change if the user isn't tier-1+. Other settings pass through.
create or replace function public.get_my_tier ()
    returns smallint
    language sql
    stable
    security definer
    set search_path = public
    as $$
    select
        COALESCE(
            case when 'donor:tier-3' = any (notification_tags) then
                3
            when 'donor:tier-2' = any (notification_tags) then
                2
            when 'donor:tier-1' = any (notification_tags) then
                1
            else
                0
            end, 0)::smallint
    from
        users
    where
        id = auth.uid ();
$$;

grant execute on function public.get_my_tier () to authenticated;

create or replace function public.guard_ai_custom_prompt ()
    returns trigger
    language plpgsql
    security definer
    set search_path = public
    as $$
declare
    v_new_prompt text;
    v_old_prompt text;
begin
    v_new_prompt := new.settings ->> 'aiCustomPrompt';
    v_old_prompt := old.settings ->> 'aiCustomPrompt';
    -- No change attempted → allow
    if v_new_prompt is not distinct from v_old_prompt then
        return NEW;
    end if;
    -- Tier-1 or above → allow
    if public.get_my_tier () >= 1 then
        return NEW;
    end if;
    -- Non-donor trying to change it → strip, keep old value
    new.settings := jsonb_set(new.settings, '{aiCustomPrompt}', COALESCE(old.settings -> 'aiCustomPrompt', '""'::jsonb));
    return NEW;
end;
$$;

drop trigger if exists guard_ai_custom_prompt on public.users;

create trigger guard_ai_custom_prompt
    before update on public.users for each row
    execute function public.guard_ai_custom_prompt ();

