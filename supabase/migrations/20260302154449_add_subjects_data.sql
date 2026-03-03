BEGIN;

-- 1. Insert Exam ('gate')
INSERT INTO public.exams (id, name, short_name)
VALUES ('gate', 'Graduate Aptitude Test in Engineering', 'GATE')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, short_name = EXCLUDED.short_name;

-- 2. Insert Branch ('cs')
INSERT INTO public.branches (id, name)
VALUES ('cs', 'Computer Science & Information Technology')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- 3. Map Branch to Exam
INSERT INTO public.branch_exams (branch_id, exam_id)
VALUES ('cs', 'gate')
ON CONFLICT DO NOTHING;

-- 4. Insert Subjects (Using deterministic UUIDs for consistency)
INSERT INTO public.subjects (id, slug, name, icon_name, theme_color, difficulty, category, is_universal)
VALUES
    ('22222222-2222-2222-2222-000000000001', 'eng-maths', 'Engineering Mathematics', 'pi', 'violet', 'Medium', 'math', true),
    ('22222222-2222-2222-2222-000000000002', 'discrete-maths', 'Discrete Maths', 'empty', 'violet', 'Hard', 'math', false),
    ('22222222-2222-2222-2222-000000000003', 'digital-logic', 'Digital Logic', 'binary', 'pink', 'Easy', 'core', false),
    ('22222222-2222-2222-2222-000000000004', 'co-architecture', 'Computer Organization & Architecture', 'cpu', 'indigo', 'Medium', 'core', false),
    ('22222222-2222-2222-2222-000000000005', 'data-structures', 'Data Structures', 'graph', 'orange', 'Medium', 'core', false),
    ('22222222-2222-2222-2222-000000000006', 'algorithms', 'Algorithms', 'gitbranch', 'teal', 'Hard', 'core', false),
    ('22222222-2222-2222-2222-000000000007', 'theory-of-computation', 'Theory of Computation', 'terminal', 'red', 'Hard', 'core', false),
    ('22222222-2222-2222-2222-000000000008', 'compiler-design', 'Compiler Design', 'filecode', 'yellow', 'Medium', 'core', false),
    ('22222222-2222-2222-2222-000000000009', 'operating-system', 'Operating System', 'linuxlogo', 'blue', 'Medium', 'core', false),
    ('22222222-2222-2222-2222-000000000010', 'databases', 'Database Management Systems', 'database', 'purple', 'Easy', 'core', false),
    ('22222222-2222-2222-2222-000000000011', 'computer-networks', 'Computer Networks', 'globe', 'green', 'Medium', 'core', false),
    ('22222222-2222-2222-2222-000000000012', 'aptitude', 'Aptitude', 'brain', 'red', 'Easy', 'aptitude', true)
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    icon_name = EXCLUDED.icon_name,
    theme_color = EXCLUDED.theme_color,
    difficulty = EXCLUDED.difficulty,
    category = EXCLUDED.category,
    is_universal = EXCLUDED.is_universal;

-- 5. Map Subjects to GATE Exam
INSERT INTO public.exams_subjects (exams_id, subject_id)
SELECT 'gate', id FROM public.subjects
WHERE slug IN ('eng-maths', 'discrete-maths', 'digital-logic', 'co-architecture', 'data-structures', 'algorithms', 'theory-of-computation', 'compiler-design', 'operating-system', 'databases', 'computer-networks', 'aptitude')
ON CONFLICT DO NOTHING;

-- 6. Map Subjects to CS Branch
INSERT INTO public.branch_subjects (branch_id, subject_id)
SELECT 'cs', id FROM public.subjects
WHERE slug IN ('eng-maths', 'discrete-maths', 'digital-logic', 'co-architecture', 'data-structures', 'algorithms', 'theory-of-computation', 'compiler-design', 'operating-system', 'databases', 'computer-networks', 'aptitude')
ON CONFLICT DO NOTHING;

COMMIT;
