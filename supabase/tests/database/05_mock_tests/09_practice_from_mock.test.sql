begin;
select
    plan (4);
\set user_donor 'f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1'
\set user_free  'f2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f2f2'
\set subject_id '9e9e9e9e-9e9e-9e9e-9e9e-9e9e9e9e9e9e'
\set mock_id    'mock-practice-rpc-test'
-- ─── Fixtures ─────────────────────────────────────────────────────
insert into auth.users (id, email)
values
    (:'user_donor', 'pf@test.com'),
    (:'user_free', 'fr@test.com')
on conflict
    do nothing;
insert into public.users (id, username, name)
values
    (:'user_donor', 'pd', 'PD'),
    (:'user_free', 'pf', 'PF')
on conflict
    do nothing;
update
    public.users
set
    notification_tags = array['role:donor', 'donor:tier-1']
where
    id = :'user_donor';
update
    public.users
set
    notification_tags = array[]::text[]
where
    id = :'user_free';
insert into public.subjects (id, name, slug, is_universal)
    values (:'subject_id', 'Prac Test', 'prac-test', false)
on conflict
    do nothing;
-- ─── Mock configuration ───────────────────────────────────────────
insert into public.mocks (id, label, branch, starts_at, duration_seconds, attempt_min_tier, post_min_tier, status)
    values (:'mock_id', 'Prac Test', 'cs', now() - interval '4 hours', 10800, 0, 1, 'live');
-- ─── Questions ────────────────────────────────────────────────────
-- Questions contain no mock-specific metadata.
insert into public.questions (id, year, question_number, subject, subject_id, topic, question_type, question, options, correct_answer, marks, difficulty, explanation, source, added_by, verified, metadata)
select
    gen_random_uuid (),
    2026,
    n,
    'Prac Test',
    :'subject_id',
    'T',
    'multiple-choice',
    'Q' || n,
    array['A'],
    '[0]'::jsonb,
    1,
    'Easy',
    'E',
    'Test',
    'test',
    true,
    jsonb_build_object('set', 'CS', 'section', 'TECH', 'paperType', 'official', 'exam', jsonb_build_array('GATE'), 'language', 'English')
from
    generate_series(1, 3) n;
-- ─── Associate questions with mock ────────────────────────────────
insert into public.mock_questions (mock_id, question_id, position)
select
    :'mock_id',
    q.id,
    q.question_number
from
    public.questions q
where
    q.subject_id = :'subject_id'::uuid
    and q.year = 2026
    and q.question_number between 1 and 3
    and q.subject = 'Prac Test';
-- ─── Completed mock sessions for both users ───────────────────────
insert into public.topic_tests (user_id, topics, total_questions, remaining_time_seconds, status, total_marks, branch_id, paper_id, record_activity, score)
values
    (:'user_donor', array['Prac Test'], 3, 0, 'completed', 3, 'cs', :'mock_id', true, 2),
    (:'user_free', array['Prac Test'], 3, 0, 'completed', 3, 'cs', :'mock_id', false, 2);
-- Test 1: Free user (post_min_tier=1) gets tier_required
set LOCAL role authenticated;
select
    set_config('request.jwt.claim.sub', :'user_free', true);
select
    set_config('request.jwt.claims', jsonb_build_object('sub', :'user_free', 'role', 'authenticated')::text, true);
select
    is (public.practice_from_mock (:'mock_id') ->> 'error',
        'tier_required',
        'free user gets tier_required');
-- Test 2: Donor creates practice session
reset role;
set LOCAL role authenticated;
select
    set_config('request.jwt.claim.sub', :'user_donor', true);
select
    set_config('request.jwt.claims', jsonb_build_object('sub', :'user_donor', 'role', 'authenticated')::text, true);
select
    is (public.practice_from_mock (:'mock_id') ->> 'status',
        'created',
        'donor creates practice session');
-- Test 3: paper_id has -practice- suffix
reset role;
select
    ok ((
            select
                paper_id ~ ('^' || :'mock_id' || '-practice-[0-9]+$')
            from
                public.topic_tests
            where
                user_id = :'user_donor'
                and paper_id like :'mock_id' || '-practice-%'
            order by
                created_at desc
            limit 1), 'practice paper_id has -practice- suffix');
-- Test 4: record_activity = true on practice session
select
    is ((
            select
                record_activity
            from
                public.topic_tests
            where
                user_id = :'user_donor'
                and paper_id like :'mock_id' || '-practice-%'
            order by
                created_at desc
            limit 1),
        true,
        'practice session records activity');
select
    *
from
    finish ();
rollback;

