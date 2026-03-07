BEGIN;

-- Insert Branch ('da')
INSERT INTO public.branches (id, name)
VALUES ('da', 'Data Science and Artificial Intelligence')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- 3. Map Branch to Exam
INSERT INTO public.branch_exams (branch_id, exam_id)
VALUES ('da', 'gate')
ON CONFLICT DO NOTHING;

-- 1. Insert Data Science & AI with the custom '333...' ID
INSERT INTO subjects (id, name, slug, category, is_universal, theme_color, icon_name, difficulty)
VALUES (
    '33333333-3333-3333-3333-333333333333', 
    'Data Science & AI', 
    'data-science-ai', 
    'core', 
    false, 
    'turquoise', 
    'headcircuit',
		'Hard'
)
ON CONFLICT (slug) DO UPDATE 
SET id = EXCLUDED.id, -- Force the specific ID if the slug already existed
    is_universal = false;

-- Map Subject to GATE Exam
INSERT INTO public.exams_subjects (exams_id, subject_id)
SELECT 'gate', id FROM public.subjects
WHERE slug IN ('data-science-ai')
ON CONFLICT DO NOTHING;

-- Map ALL required subjects to DA Branch (Core + Universal)
INSERT INTO public.branch_subjects (branch_id, subject_id)
SELECT 'da', id FROM public.subjects
WHERE slug IN ('data-science-ai', 'engineering-mathematics', 'general-aptitude') -- Important for visibility
ON CONFLICT DO NOTHING;

COMMIT;
