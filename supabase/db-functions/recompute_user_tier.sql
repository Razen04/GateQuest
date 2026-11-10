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
    -- Lock the user row so concurrent donation verifications serialize
    perform
        1
    from
        users
    where
        id = v_user_id
    for update;
    -- Cumulative verified total.
    -- Excludes NULL actual_amount so that unverified or incomplete rows
    -- don't affect the tier (defensive — verified rows should always have
    -- actual_amount set by the webhook or by admin manual action).
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
    -- Compute tier from cumulative total
    v_tier := case when v_total >= 569 then
        3
    when v_total >= 169 then
        2
    when v_total >= 50 then
        1
    else
        0
    end;
    -- Does the user have any verified donation at all?
    -- Determines role:donor independent of current tier.
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
    -- Fetch existing tags, stripping any existing donor:tier-* tags
    -- (we're about to write the correct one).
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
    -- Add role:donor if any verified donation exists (permanent, never removed)
    if v_has_any_verified and not ('role:donor' = any (v_tags)) then
        v_tags := v_tags || 'role:donor';
    end if;
    -- Add the current tier tag (only if tier >= 1)
    if v_tier >= 1 then
        v_tags := v_tags || ('donor:tier-' || v_tier::text);
    end if;
    -- Write back
    update
        users
    set
        notification_tags = v_tags
    where
        id = v_user_id;
end;
$$;

