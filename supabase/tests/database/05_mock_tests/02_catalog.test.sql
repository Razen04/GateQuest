begin;
select
    plan (8);
\set participant 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
\set guest_user  'cccccccc-cccc-cccc-cccc-cccccccccccc'
\set subject_id  '11111111-1111-1111-1111-111111111111'
insert into auth.users (id, email)
values
    (:'participant', 'p@test.com'),
    (:'guest_user', 'g@test.com')
on conflict (id)
    do nothing;
insert into public.users (id, username, name)
values
    (:'participant', 'participant', 'P'),
    (:'guest_user', 'guest', 'G')
on conflict (id)
    do nothing;
update
    public.users
set
    notification_tags = array[]::text[]
where
    id in (:'participant', :'guest_user');
insert into public.subjects (id, name, slug, is_universal)
    values (:'subject_id', 'T', 't', false)
on conflict
    do nothing;
create or replace function _ins_mock (p_id text, p_start timestamptz, p_tier int)
    returns void
    language plpgsql
    as $fn$
declare
    v_question_id uuid;
    v_position int;
begin
    insert into public.mocks (id, label, branch, starts_at, duration_seconds, attempt_min_tier, post_min_tier, status)
        values (p_id, p_id, 'catalog-test', p_start, 10800, p_tier, 1, 'scheduled')
    on conflict (id)
        do update set
            starts_at = excluded.starts_at,
            attempt_min_tier = excluded.attempt_min_tier,
            status = excluded.status;
    for v_position in 1..2 loop
        v_question_id := gen_random_uuid ();
        insert into public.questions (id, year, question_number, subject, subject_id, topic, question_type, question, options, correct_answer, marks, difficulty, explanation, source, added_by, verified, metadata)
            values (v_question_id, 2026, v_position, 'T', '11111111-1111-1111-1111-111111111111', 'T', 'multiple-choice', 'Q', array['A'], '[0]'::jsonb, 1, 'Easy', 'E', 'T', 'test', true, jsonb_build_object('set', 'CS', 'section', 'TECH', 'paperType', 'official', 'exam', jsonb_build_array('GATE'), 'language', 'English'));
        insert into public.mock_questions (mock_id, question_id, position)
            values (p_id, v_question_id, v_position);
    end loop;
end;
$fn$;
select
    _ins_mock ('mock-up', now() + interval '1 hour', 0);
select
    _ins_mock ('mock-live', now() - interval '30 min', 0);
select
    _ins_mock ('mock-tier', now() - interval '30 min', 1);
select
    _ins_mock ('mock-old', now() - interval '4 hours', 0);
-- Test 1: catalog returns all four
set LOCAL role authenticated;
select
    set_config('request.jwt.claim.sub', :'participant', true);
select
    set_config('request.jwt.claims', jsonb_build_object('sub', :'participant', 'role', 'authenticated')::text, true);
select
    is (jsonb_array_length(public.get_mock_catalog ('catalog-test')),
        4,
        'catalog returns 4 mocks for the isolated test branch');
-- Test 2: upcoming mock is not live, not released
select
    is ((
            select
                elem ->> 'is_live'
            from
                jsonb_array_elements(public.get_mock_catalog ('catalog-test')) elem
            where
                elem ->> 'mock_id' = 'mock-up'), 'false', 'upcoming mock is_live = false');
select
    is ((
            select
                elem ->> 'results_released'
            from
                jsonb_array_elements(public.get_mock_catalog ('catalog-test')) elem
            where
                elem ->> 'mock_id' = 'mock-up'), 'false', 'upcoming mock results_released = false');
-- Test 4: live mock is live, not released
select
    is ((
            select
                elem ->> 'is_live'
            from
                jsonb_array_elements(public.get_mock_catalog ('catalog-test')) elem
            where
                elem ->> 'mock_id' = 'mock-live'), 'true', 'live mock is_live = true');
-- Test 5: expired mock is released
select
    is ((
            select
                elem ->> 'results_released'
            from
                jsonb_array_elements(public.get_mock_catalog ('catalog-test')) elem
            where
                elem ->> 'mock_id' = 'mock-old'), 'true', 'expired mock results_released = true');
-- Test 6: tier-gated mock — can_attempt false for tier-0
select
    is ((
            select
                elem ->> 'can_attempt'
            from
                jsonb_array_elements(public.get_mock_catalog ('catalog-test')) elem
            where
                elem ->> 'mock_id' = 'mock-tier'), 'false', 'tier-locked mock can_attempt = false for tier-0');
select
    is ((
            select
                elem ->> 'attempt_lock_reason'
            from
                jsonb_array_elements(public.get_mock_catalog ('catalog-test')) elem
            where
                elem ->> 'mock_id' = 'mock-tier'), 'tier_required', 'tier-locked mock attempt_lock_reason = tier_required');
-- Test 8: guest (auth.uid NULL) sees login_required
reset role;
select
    set_config('request.jwt.claim.sub', '', true);
select
    set_config('request.jwt.claims', '', true);
-- pgTAP without auth role — auth.uid() returns NULL
select
    is ((
            select
                elem ->> 'attempt_lock_reason'
            from
                jsonb_array_elements(public.get_mock_catalog ('catalog-test')) elem
            where
                elem ->> 'mock_id' = 'mock-up'), 'login_required', 'guest sees login_required');
select
    *
from
    finish ();
rollback;

