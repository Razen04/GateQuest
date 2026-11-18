begin;
-- ─── 1. Subject ────────────────────────────────────────────────
insert into public.subjects (id, name, slug, is_universal)
    values ('a1000000-0000-0000-0000-000000000001', 'Computer Science', 'computer-science', false)
on conflict (id)
    do update set
        name = excluded.name,
        slug = excluded.slug;
-- ─── 2. Mock configuration ─────────────────────────────────────
insert into public.mocks (id, label, branch, starts_at, duration_seconds, attempt_min_tier, post_min_tier, series_number, blurb, announcement, status)
    values ('mock-local-demo-1', 'Local Demo Mock Test', 'cs', now() + '2 minute', 180, 0, 0, 1, 'A sample mock test for local development.', 'Your demo mock test is now live!', 'live')
on conflict (id)
    do update set
        label = excluded.label,
        branch = excluded.branch,
        starts_at = excluded.starts_at,
        duration_seconds = excluded.duration_seconds,
        attempt_min_tier = excluded.attempt_min_tier,
        post_min_tier = excluded.post_min_tier,
        status = excluded.status;
-- ─── 3. Questions ──────────────────────────────────────────────
insert into public.questions (id, year, question_number, subject, subject_id, topic, question_type, question, options, correct_answer, marks, difficulty, explanation, source, added_by, verified, metadata)
    values
        -- Question 1: General Aptitude
        ('a2000000-0000-0000-0000-000000000001', 2026, 1, 'Computer Science', '44444444-4444-4444-4444-444444444444', 'General Aptitude', 'multiple-choice', 'If 5 workers complete a task in 12 days, how many days will 10 workers take, assuming equal productivity?', array['3 days', '6 days', '8 days', '10 days'], '[1]'::jsonb, 1, 'Easy', 'Total work = 5 × 12 = 60 worker-days. Therefore, 60 / 10 = 6 days.', 'Local Demo', 'test', true, jsonb_build_object('set', 'CS', 'section', 'GA', 'paperType', 'mock', 'exam', jsonb_build_array('GATE'), 'language', 'English')),
        -- Question 2: Data Structures
        ('a2000000-0000-0000-0000-000000000002', 2026, 2, 'Computer Science', '44444444-4444-4444-4444-444444444444', 'Data Structures', 'multiple-choice', 'Which data structure follows the Last In First Out (LIFO) principle?', array['Queue', 'Stack', 'Linked List', 'Binary Tree'], '[1]'::jsonb, 1, 'Easy', 'A stack follows the LIFO principle: the last element inserted is the first one removed.', 'Local Demo', 'test', true, jsonb_build_object('set', 'CS', 'section', 'TECH', 'paperType', 'mock', 'exam', jsonb_build_array('GATE'), 'language', 'English')),
        -- Question 3: Operating Systems
        ('a2000000-0000-0000-0000-000000000003', 2026, 3, 'Computer Science', '44444444-4444-4444-4444-444444444444', 'Operating Systems', 'multiple-choice', 'Which of the following is responsible for context switching between processes?', array['Compiler', 'Operating System', 'Database', 'Text Editor'], '[1]'::jsonb, 2, 'Easy', 'The operating system scheduler manages process execution and context switching.', 'Local Demo', 'test', true, jsonb_build_object('set', 'CS', 'section', 'TECH', 'paperType', 'mock', 'exam', jsonb_build_array('GATE'), 'language', 'English'))
    on conflict (id)
        do update set
            question = excluded.question,
            options = excluded.options,
            correct_answer = excluded.correct_answer,
            explanation = excluded.explanation,
            subject_id = excluded.subject_id,
            topic = excluded.topic,
            metadata = excluded.metadata;
-- ─── 4. Associate questions with the mock ──────────────────────
delete from public.mock_questions
where mock_id = 'mock-local-demo-1';
insert into public.mock_questions (mock_id, question_id, position)
values
    ('mock-local-demo-1', 'a2000000-0000-0000-0000-000000000001', 1),
    ('mock-local-demo-1', 'a2000000-0000-0000-0000-000000000002', 2),
    ('mock-local-demo-1', 'a2000000-0000-0000-0000-000000000003', 3);
commit;

