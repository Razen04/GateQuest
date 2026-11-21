-- ─────────────────────────────────────────────────────────────────
--
-- 1. Document the notification_tags column so future contributors
--    understand the tag families and trigger ownership.
--
-- 2. Auto-fill verified_by = 'manual' when an admin runs
--    UPDATE donations SET verified = true without setting verified_by.
--    The Phase 2 webhook explicitly sets verified_by = 'auto'; this
--    trigger covers the manual path so all verified rows have a value.
-- ─────────────────────────────────────────────────────────────────
comment on column public.users.notification_tags is $$User metadata tags for notification targeting. Owners: branch:*, exam:* (refresh_user_goal_tags); role:* (permanent); donor:tier-* (on_donation_tier_change). Each trigger updates only its own family and preserves others. New families require updating trigger preservation logic and documenting them here.$$;

-- ─── 2. Auto-fill verified_by = 'manual' ──────────────────────────
-- The Phase 2 webhook sets verified_by = 'auto' explicitly.
-- Manual verification (admin runs UPDATE ... SET verified = true from
-- the SQL editor) leaves verified_by NULL. This trigger catches that.
--
-- It only fires when:
--   · verified flips false → true, AND
--   · verified_by is NULL on the NEW row
-- so it never overrides the webhook's explicit 'auto' value.
create or replace function public.autofill_verified_by ()
    returns trigger
    language plpgsql
    as $$
begin
    if new.verified = true and (old.verified is distinct from true) and new.verified_by is null then
        new.verified_by := 'manual';
    end if;
    return NEW;
end;
$$;

drop trigger if exists on_donation_autofill_verified_by on public.donations;

create trigger on_donation_autofill_verified_by
    before update on public.donations for each row
    execute function public.autofill_verified_by ();

