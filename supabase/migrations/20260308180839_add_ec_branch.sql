BEGIN;

-- 1. Insert/Update Branch ('ec')
INSERT INTO public.branches (id, name)
VALUES ('ec', 'Electronics and Communication Engineering')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- 2. Map EC Branch to GATE Exam
INSERT INTO public.branch_exams (branch_id, exam_id)
VALUES ('ec', 'gate')
ON CONFLICT DO NOTHING;

-- 3. Insert EC Core Subjects with the IDs used in your transformation script
INSERT INTO subjects (id, name, slug, category, is_universal, theme_color, icon_name, difficulty)
VALUES 
    ('44444444-4444-4444-4444-444444444441', 'Networks, Signals, and Systems', 'networks-signals-systems', 'core', false, 'blue', 'pulse', 'Hard'),
    ('44444444-4444-4444-4444-444444444442', 'Analog Circuits', 'analog-circuits', 'core', false, 'orange', 'wavesine', 'Hard'),
    ('44444444-4444-4444-4444-444444444443', 'Digital Circuits', 'digital-circuits', 'core', false, 'purple', 'binary', 'Medium'),
    ('44444444-4444-4444-4444-444444444444', 'Control Systems', 'control-systems', 'core', false, 'green', 'sliders', 'Medium'),
    ('44444444-4444-4444-4444-444444444445', 'Communications', 'communications', 'core', false, 'red', 'broadcast', 'Hard'),
    ('44444444-4444-4444-4444-444444444446', 'Electromagnetics', 'electromagnetics', 'core', false, 'yellow', 'magnet', 'Hard')
ON CONFLICT (slug) DO UPDATE 
SET id = EXCLUDED.id, 
    is_universal = false;

-- 4. Map EC Subjects to GATE Exam
INSERT INTO public.exams_subjects (exams_id, subject_id)
SELECT 'gate', id FROM public.subjects
WHERE slug IN (
    'networks-signals-systems', 
    'analog-circuits', 
    'digital-circuits', 
    'control-systems', 
    'communications', 
    'electromagnetics'
)
ON CONFLICT DO NOTHING;

-- 5. Map ALL required subjects to EC Branch (Core + Universal)
-- This ensures 'General Aptitude' and 'Engineering Maths' follow you to EC
INSERT INTO public.branch_subjects (branch_id, subject_id)
SELECT 'ec', id FROM public.subjects
WHERE slug IN (
    'networks-signals-systems', 
    'analog-circuits', 
    'digital-circuits', 
    'control-systems', 
    'communications', 
    'electromagnetics',
    'engineering-mathematics', 
    'general-aptitude'
)
ON CONFLICT DO NOTHING;

COMMIT;
