-- ─────────────────────────────────────────────────────────────────
-- Broadcast a public announcement when a donation is verified.
--
-- Fires on the verified false → true transition, one-time per
-- donation. Extracts:
--   - donor username (or "An anonymous patron" if anonymous/guest)
--   - donation amount
--   - current month total (for milestone)
--   - percent of the ₹2,500 monthly goal
--
-- Link targets /u/{username} for non-anonymous, /donate otherwise.
--
-- Handles guest donations (user_id NULL) with "An anonymous patron"
-- language since there's no username to attribute.
-- ─────────────────────────────────────────────────────────────────
create or replace function public.announce_verified_donation ()
    returns trigger
    language plpgsql
    security definer
    set search_path = public
    as $$
declare
    v_username text;
    v_monthly_total numeric;
    v_monthly_goal constant numeric := 2500;
    v_percent int;
    v_donation_amount_str text;
    v_total_str text;
    v_message text;
    v_link text;
    v_title text;
    v_is_attributable boolean;
begin
    -- Only fire on the verified false → true transition
    if TG_OP != 'UPDATE' or new.verified is not true or old.verified is true then
        return NEW;
    end if;
    -- Determine if we can attribute this donation to a named user
    v_is_attributable := new.user_id is not null
        and not new.anonymous;
    if v_is_attributable then
        select
            username
        into
            v_username
        from
            users
        where
            id = new.user_id;
        -- If user was deleted between donation and verification, fall
        -- back to anonymous framing
        if v_username is null then
            v_is_attributable := false;
        end if;
    end if;
    -- Compute monthly total. Includes this donation since the UPDATE
    -- has already landed at this point in the transaction.
    select
        COALESCE(SUM(actual_amount), 0)
    into
        v_monthly_total
    from
        donations
    where
        verified = true
        and actual_amount is not null
        and created_at >= date_trunc('month', now());
    v_percent := LEAST (100, ROUND((v_monthly_total / v_monthly_goal) * 100)::int);
    -- Format ₹ amounts without trailing decimals if whole
    v_donation_amount_str := trim(to_char(new.actual_amount, 'FM999999990.99'));
    v_total_str := trim(to_char(v_monthly_total, 'FM999999990'));
    if v_is_attributable then
        v_title := '🎉 New patron joined';
        v_message := format('@%s donated ₹%s. We''ve raised ₹%s of ₹%s this month (%s%%)', v_username, v_donation_amount_str, v_total_str, trim(to_char(v_monthly_goal, 'FM999999990')), v_percent);
        v_link := '/u/' || v_username;
    else
        v_title := '🎉 New patron joined';
        v_message := format('An anonymous patron donated ₹%s. We''ve raised ₹%s of ₹%s this month (%s%%)', v_donation_amount_str, v_total_str, trim(to_char(v_monthly_goal, 'FM999999990')), v_percent);
        v_link := '/donate';
    end if;
    begin
        insert into notifications (title, message, link, type, target)
            values (v_title, v_message, v_link, 'update', jsonb_build_object('type', 'broadcast'));
    exception
        when others then
            -- Never let broadcast failure abort donation verification
            raise WARNING 'Donation broadcast failed for donation %: %', new.id, SQLERRM;
    end;
    return NEW;
end;

$$;

drop trigger if exists on_donation_announce on public.donations;

create trigger on_donation_announce
    after update on public.donations
    for each row
    execute function public.announce_verified_donation ();

