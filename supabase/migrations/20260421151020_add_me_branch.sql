BEGIN;

-- 1. Insert/Update Branch ('me')
INSERT INTO public.branches (id, name)
VALUES ('me', 'Mechanical Engineering')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- 2. Map ME Branch to GATE Exam
INSERT INTO public.branch_exams (branch_id, exam_id)
VALUES ('me', 'gate')
ON CONFLICT DO NOTHING;

-- 3. Insert ME Core Subjects (The 3 specific sections from your JSON)
INSERT INTO subjects (id, name, slug, category, is_universal, theme_color, icon_name, difficulty)
VALUES 
    ('66666666-6666-6666-6666-666666666661', 'Applied Mechanics and Design', 'me-applied-mechanics-design', 'core', false, 'blue', 'wrench', 'Hard'),
    ('66666666-6666-6666-6666-666666666662', 'Fluid Mechanics and Thermal Sciences', 'me-fluid-thermal-sciences', 'core', false, 'orange', 'waves', 'Hard'),
    ('66666666-6666-6666-6666-666666666663', 'Materials, Manufacturing and Industrial Engineering', 'me-materials-manufacturing-industrial', 'core', false, 'turquoise', 'factory', 'Hard')
ON CONFLICT (slug) DO UPDATE 
SET id = EXCLUDED.id, 
    is_universal = false;

-- 4. Map ME Subjects to GATE Exam
INSERT INTO public.exams_subjects (exams_id, subject_id)
SELECT 'gate', id FROM public.subjects
WHERE slug IN (
    'me-applied-mechanics-design',
    'me-fluid-thermal-sciences',
    'me-materials-manufacturing-industrial'
)
ON CONFLICT DO NOTHING;

-- 5. Map ALL 5 required subjects to ME Branch (3 Core + 2 Universal)
INSERT INTO public.branch_subjects (branch_id, subject_id)
SELECT 'me', id FROM public.subjects
WHERE slug IN (
    'me-applied-mechanics-design',           -- From JSON
    'me-fluid-thermal-sciences',             -- From JSON
    'me-materials-manufacturing-industrial', -- From JSON
    'engineering-mathematics',               -- From JSON (Universal)
    'general-aptitude'                       -- From JSON (Universal)
)
ON CONFLICT DO NOTHING;

COMMIT;
