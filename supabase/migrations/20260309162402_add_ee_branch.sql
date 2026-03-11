BEGIN;

-- 1. Insert/Update Branch ('ee')
INSERT INTO public.branches (id, name)
VALUES ('ee', 'Electrical Engineering')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- 2. Map EE Branch to GATE Exam
INSERT INTO public.branch_exams (branch_id, exam_id)
VALUES ('ee', 'gate')
ON CONFLICT DO NOTHING;

-- 3. Insert EE Core Subjects
INSERT INTO subjects (id, name, slug, category, is_universal, theme_color, icon_name, difficulty)
VALUES 
    ('55555555-5555-5555-5555-555555555551', 'Analog and Digital Electronics', 'ee-analog-digital-electronics', 'core', false, 'orange', 'waveform', 'Hard'),
    ('55555555-5555-5555-5555-555555555552', 'Control Systems', 'ee-control-systems', 'core', false, 'green', 'sliders', 'Medium'),
    ('55555555-5555-5555-5555-555555555553', 'Electric Circuits', 'ee-electric-circuits', 'core', false, 'blue', 'circuitry', 'Medium'),
    ('55555555-5555-5555-5555-555555555554', 'Electromagnetic Fields', 'ee-electromagnetic-fields', 'core', false, 'yellow', 'magnet', 'Hard'),
    ('55555555-5555-5555-5555-555555555555', 'Electrical Machines', 'ee-electrical-machines', 'core', false, 'purple', 'engine', 'Hard'),
    ('55555555-5555-5555-5555-555555555556', 'Electrical and Electronic Measurements', 'ee-measurements', 'core', false, 'turquoise', 'gauge', 'Medium'),
    ('55555555-5555-5555-5555-555555555557', 'Power Systems', 'ee-power-systems', 'core', false, 'red', 'power', 'Hard'),
    ('55555555-5555-5555-5555-555555555558', 'Power Electronics', 'ee-power-electronics', 'core', false, 'pink', 'plugcharging', 'Hard'),
    ('55555555-5555-5555-5555-555555555559', 'Signals and Systems', 'ee-signals-systems', 'core', false, 'indigo', 'wavesign', 'Medium')
ON CONFLICT (slug) DO UPDATE 
SET id = EXCLUDED.id, 
    is_universal = false;

-- 4. Map EE Subjects to GATE Exam
INSERT INTO public.exams_subjects (exams_id, subject_id)
SELECT 'gate', id FROM public.subjects
WHERE slug IN (
    'ee-analog-digital-electronics',
    'ee-control-systems',
    'ee-electric-circuits',
    'ee-electromagnetic-fields',
    'ee-electrical-machines',
    'ee-measurements',
    'ee-power-systems',
    'ee-power-electronics',
    'ee-signals-systems'
)
ON CONFLICT DO NOTHING;

-- 5. Map ALL required subjects to EE Branch (Core + Universal)
-- This ensures 'General Aptitude' and 'Engineering Maths' follow you to EE
INSERT INTO public.branch_subjects (branch_id, subject_id)
SELECT 'ee', id FROM public.subjects
WHERE slug IN (
    'ee-analog-digital-electronics',
    'ee-control-systems',
    'ee-electric-circuits',
    'ee-electromagnetic-fields',
    'ee-electrical-machines',
    'ee-measurements',
    'ee-power-systems',
    'ee-power-electronics',
    'ee-signals-systems',
    'engineering-mathematics', -- Universal: 2222...01
    'general-aptitude'        -- Universal: 2222...12
)
ON CONFLICT DO NOTHING;

COMMIT;
