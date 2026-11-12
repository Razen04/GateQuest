-- ─────────────────────────────────────────────────────────────────
-- When a donation flips to verified = true (either from the automated
-- webhook OR from an admin running UPDATE via SQL), this trigger
-- recomputes the user's cumulative verified total and updates:
--
--   1. role:donor       — added on first verified donation, never removed
--   2. donor:tier-N     — reflects current cumulative tier (>= ₹50 / ₹169 / ₹569)
--
-- Also fires on:
--   - DELETE of a verified donation (e.g., refund/reversal) → recomputes downward
--   - UPDATE of actual_amount on a verified donation → recomputes upward/downward
--
-- Preserves ALL other tag families (branch:*, exam:*, role:beta, etc.).
--
-- Concurrency: locks the users row during recompute to serialize updates
-- for the same user. Prevents two simultaneous donation verifications
-- from producing a stale tier.
-- ─────────────────────────────────────────────────────────────────
-- Helper: recompute one user's tier from scratch.
-- Called by the trigger AND by the one-time backfill below.
create or replace function public.recompute_user_tier (v_user_id uuid)
    returns void
    language plpgsql
    security definer
    set search_path = public
    as $$
declare
    v_total numeric;
    v_tier smallint;
    v_tags text[];
    v_has_any_verified boolean;
begin
    perform
        1
    from
        users
    where
        id = v_user_id
    for update;
    select
        COALESCE(SUM(actual_amount), 0)
    into
        v_total
    from
        donations
    where
        user_id = v_user_id
        and verified = true
        and actual_amount is not null;
    v_tier := case when v_total >= 569 then
        3
    when v_total >= 169 then
        2
    when v_total >= 50 then
        1
    else
        0
    end;
    select
        exists (
            select
                1
            from
                donations
            where
                user_id = v_user_id
                and verified = true)
    into
        v_has_any_verified;
    select
        COALESCE(array_agg(t) filter (where t not like 'donor:tier-%'), array[]::text[])
    into
        v_tags
    from
        unnest(COALESCE((
                select
                    notification_tags
                from users
                where
                    id = v_user_id), array[]::text[])) t;
    if v_has_any_verified and not ('role:donor' = any (v_tags)) then
        -- array_append is unambiguous — always appends an element
        v_tags := array_append(v_tags, 'role:donor'::text);
    end if;
    if v_tier >= 1 then
        v_tags := array_append(v_tags, 'donor:tier-' || v_tier::text);
    end if;
    update
        users
    set
        notification_tags = v_tags
    where
        id = v_user_id;
end;
$$;

grant execute on function public.recompute_user_tier (uuid) to service_role;

-- Trigger function: decides whether to recompute based on the row change.
create or replace function public.handle_donation_tier_change ()
    returns trigger
    language plpgsql
    security definer
    set search_path = public
    as $$
declare
    v_user_id uuid;
    v_should_recompute boolean := false;
begin
    if TG_OP = 'DELETE' then
        -- Only recompute if a verified donation was deleted
        if old.verified = true and old.user_id is not null then
            v_user_id := old.user_id;
            v_should_recompute := true;
        end if;
    elsif TG_OP = 'INSERT' then
        -- Only recompute if inserted as verified (rare, defensive)
        if new.verified = true and new.user_id is not null then
            v_user_id := new.user_id;
            v_should_recompute := true;
        end if;
    else
        -- UPDATE
        if new.user_id is null then
            return NEW;
            -- guest donation, no user to recompute
        end if;
        -- Recompute if verified state changed, OR if actual_amount changed
        -- on an already-verified donation. Ignores unrelated updates like
        -- alerted_at from the Phase 4 cron.
        if (old.verified is distinct from new.verified) or (new.verified = true and old.actual_amount is distinct from new.actual_amount) then
            v_user_id := new.user_id;
            v_should_recompute := true;
        end if;
    end if;
    if v_should_recompute then
        perform
            public.recompute_user_tier (v_user_id);
    end if;
    if TG_OP = 'DELETE' then
        return OLD;
    else
        return NEW;
    end if;
end;
$$;

-- Bind the trigger
drop trigger if exists on_donation_tier_change on public.donations;

create trigger on_donation_tier_change
    after insert or update or delete on public.donations for each row
    execute function public.handle_donation_tier_change ();

-- ─────────────────────────────────────────────────────────────────
-- One-time backfill: recompute tiers for all existing users with
-- verified donations. Fixes any manual tag drift and ensures
-- consistency the first time the trigger lands.
--
-- Idempotent — safe to re-run.
-- ─────────────────────────────────────────────────────────────────
do $$
declare
    v_user_id uuid;
begin
    for v_user_id in select distinct
        user_id
    from
        donations
    where
        verified = true
        and user_id is not null loop
            perform
                public.recompute_user_tier (v_user_id);
        end loop;
end
$$;
