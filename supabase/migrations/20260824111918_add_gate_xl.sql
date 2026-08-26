begin;

-- Insert GATE XL branch

insert into public.branches (id, name)
values ('xl', 'Life Sciences')
on conflict (id) do update
set name = EXCLUDED.name;


-- Map XL → GATE

insert into public.branch_exams (branch_id, exam_id)
values ('xl', 'gate')
on conflict do nothing;


-- Insert GATE XL subjects

insert into public.subjects (
    id,
    name,
    slug,
    category,
    is_universal,
    theme_color,
    icon_name,
    difficulty
)
values
(
    '77777777-7777-7777-7777-777777777771',
    'Biochemistry',
    'biochemistry',
    'core',
    false,
    'pink',
    'dna',
    'Medium'
),
(
    '77777777-7777-7777-7777-777777777772',
    'Botany',
    'botany',
    'core',
    false,
    'green',
    'leaf',
    'Medium'
),
(
    '77777777-7777-7777-7777-777777777773',
    'Chemistry',
    'chemistry',
    'core',
    false,
    'violet',
    'flask',
    'Medium'
),
(
    '77777777-7777-7777-7777-777777777774',
    'Food Technology',
    'food-technology',
    'core',
    false,
    'orange',
    'fork-knife',
    'Medium'
),
(
    '77777777-7777-7777-7777-777777777775',
    'Microbiology',
    'microbiology',
    'core',
    false,
    'cyan',
    'microscope',
    'Medium'
),
(
    '77777777-7777-7777-7777-777777777776',
    'Zoology',
    'zoology',
    'core',
    false,
    'blue',
    'paw-print',
    'Medium'
)
on conflict (slug) do update
set
    id = EXCLUDED.id,
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    is_universal = EXCLUDED.is_universal;


-- Map XL subjects to GATE

insert into public.exams_subjects (exams_id, subject_id)
select
    'gate',
    id
from public.subjects
where slug in (
    'biochemistry',
    'botany',
    'chemistry',
    'food-technology',
    'microbiology',
    'zoology'
)
on conflict do nothing;


-- Map XL → its subjects
-- General Aptitude already exists in the database.

insert into public.branch_subjects (branch_id, subject_id)
select
    'xl',
    id
from public.subjects
where slug in (
    'general-aptitude',
    'biochemistry',
    'botany',
    'chemistry',
    'food-technology',
    'microbiology',
    'zoology'
)
on conflict do nothing;


commit;

