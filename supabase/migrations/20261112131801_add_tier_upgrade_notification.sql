-- ─────────────────────────────────────────────────────────────────
-- Fire a notification to the user when their donor tier upgrades.
--
-- Fires only on upgrade (Bronze → Gold, Gold → Platinum, 0 → Bronze).
-- Never fires on downgrade or same-tier recompute.
--
-- Because recompute_user_tier is called from the on_donation_tier_change
-- trigger (which fires on verified donation INSERT/UPDATE/DELETE), this
-- covers both automated webhook verification AND manual admin SQL
-- verification.
--
-- Wrapped in EXCEPTION handler so a notification failure cannot abort
-- the enclosing donation verification transaction.
-- ─────────────────────────────────────────────────────────────────
create or replace function public.recompute_user_tier (v_user_id uuid)
    returns void
    language plpgsql
    security definer
    set search_path = public
    as $$
declare
    v_total numeric;
    v_tier smallint;
    v_old_tier smallint;
    v_tags text[];
    v_has_any_verified boolean;
    v_tier_label text;
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
    -- Capture the tier the user had BEFORE this recompute, so we can
    -- detect an upgrade. Read from tags, not from a separate column —
    -- tags are the source of truth.
    select
        case when 'donor:tier-3' = any (notification_tags) then
            3
        when 'donor:tier-2' = any (notification_tags) then
            2
        when 'donor:tier-1' = any (notification_tags) then
            1
        else
            0
        end
    into
        v_old_tier
    from
        users
    where
        id = v_user_id;
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
    -- ── Fire tier upgrade notification (only on upgrade) ────────
    if v_tier > v_old_tier then
        v_tier_label := case v_tier
        when 1 then
            'Bronze'
        when 2 then
            'Gold'
        when 3 then
            'Platinum'
        end;
        begin
            insert into notifications (title, message, link, type, target)
                values (format('🎉 Welcome to %s tier', v_tier_label), format('Your cumulative donations have reached the %s tier. Thank you for supporting GATEQuest!', v_tier_label), '/donate', 'update', jsonb_build_object('type', 'user', 'user_id', v_user_id));
        exception
            when others then
                -- Never let a notification failure abort tier recompute
                raise WARNING 'Tier upgrade notification failed for user %: %', v_user_id, SQLERRM;
        end;
    end if;
end;

$$;
