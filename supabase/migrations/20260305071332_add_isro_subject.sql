begin;

-- Insert ISRO into the exams table
insert into public.exams (id, name, short_name)
values (
    'isro', 
    'ISRO Scientist/Engineer (SC)',
    'ISRO'
)
on conflict (id) do nothing;

-- Link existing subjects to the ISRO exam
-- This maps the 11 standard subjects shared with GATE
insert into public.exams_subjects (exams_id, subject_id)
VALUES 
    ('isro', '22222222-2222-2222-2222-000000000001'), -- Engineering Mathematics
    ('isro', '22222222-2222-2222-2222-000000000003'), -- Digital Logic
    ('isro', '22222222-2222-2222-2222-000000000004'), -- COA
    ('isro', '22222222-2222-2222-2222-000000000005'), -- Data Structures
    ('isro', '22222222-2222-2222-2222-000000000006'), -- Algorithms
    ('isro', '22222222-2222-2222-2222-000000000007'), -- Theory of Computation
    ('isro', '22222222-2222-2222-2222-000000000008'), -- Compiler Design
    ('isro', '22222222-2222-2222-2222-000000000009'), -- Operating System
    ('isro', '22222222-2222-2222-2222-000000000010'), -- DBMS
    ('isro', '22222222-2222-2222-2222-000000000011'), -- Computer Networks
    ('isro', '22222222-2222-2222-2222-000000000012')  -- General Aptitude
on conflict do nothing;

-- Create and Link new ISRO-specific subjects
-- We use deterministic UUIDs continuing from our previous sequence
insert into public.subjects (id, name, slug, icon_name, theme_color, difficulty, category, is_universal)
values 
    ('22222222-2222-2222-2222-000000000013', 'Software Engineering', 'software-engineering', 'appwindow', 'fuchsia', 'Easy', 'core', false),
    ('22222222-2222-2222-2222-000000000014', 'Web Technologies', 'web-technologies', 'browsers', 'sky', 'Easy', 'core', false)
on conflict (id) do nothing;

insert into public.exams_subjects (exams_id, subject_id)
values 
    ('isro', '22222222-2222-2222-2222-000000000013'),
    ('isro', '22222222-2222-2222-2222-000000000014')
on conflict do nothing;

-- Ensure these new subjects are linked to the 'cs' branch
insert into public.branch_subjects (branch_id, subject_id)
values 
    ('cs', '22222222-2222-2222-2222-000000000013'),
    ('cs', '22222222-2222-2222-2222-000000000014')
on conflict do nothing;

-- Link cs branch with the ISRO exam
insert into public.branch_exams (branch_id, exam_id)
values
	('cs', 'isro')
on conflict do nothing;

commit;
