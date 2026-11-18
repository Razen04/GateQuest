create or replace function public.refresh_question_peer_stats ()
    returns void
    language sql
    security definer
    set search_path = 'public'
    as $$
    select
        public.refresh_question_peer_stats_for_questions (null::uuid[]);
$$;

comment on function public.refresh_question_peer_stats () is
'Full rebuild of question_peer_stats. Nightly cron entry point.';

revoke all on function public.refresh_question_peer_stats () from public;

revoke all on function public.refresh_question_peer_stats () from anon, authenticated;

grant execute on function public.refresh_question_peer_stats () to service_role;
