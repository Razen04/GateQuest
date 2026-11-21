-- ─────────────────────────────────────────────────────────────────
-- Public RPC: total verified donations for the current calendar month.
--
-- Powers the infrastructure-goal progress bar on /donate. Deliberately
-- aggregate-only — no donor identities, no per-donation data. Safe to
-- expose to anon and authenticated.
--
-- Resets on the 1st of each month (UTC). Shows "this month's progress."
-- ─────────────────────────────────────────────────────────────────
create or replace function public.get_monthly_donation_total ()
    returns numeric
    language sql
    stable
    security definer
    set search_path = public
    as $$
    select
        COALESCE(SUM(actual_amount), 0)::numeric
    from
        public.donations
    where
        verified = true
        and actual_amount is not null
        and created_at >= date_trunc('month', now());
$$;

grant execute on function public.get_monthly_donation_total () to anon, authenticated;

