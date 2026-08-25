-- seed.sql
--
-- 1. Create a test user
-- 2. Insert 10 sample questions
-- 3. Simulate user activity on some questions
-- 4. Refresh the peer statistics based on the activity
--

-- Use a temporary role to bypass RLS for seeding
SET session_replication_role = replica;

delete from vault.secrets where name in ('cron_edge_function_base_url', 'cron_isolated_secret');

select vault.create_secret('http://kong:8000/functions/v1', 'cron_edge_function_base_url');
select vault.create_secret('gatequest_lcoal_cron_passphrase_123!',  'cron_isolated_secret');

-- =====================================================
-- CLEAN SEED (Safe for repeated runs)
-- =====================================================
truncate table exams_subjects cascade;
truncate table branch_subjects cascade;
truncate table user_goals cascade;
truncate table subjects cascade;
truncate table exams cascade;
truncate table branches cascade;
-- Also truncate any other tables that depend on these, e.g., questions,
-- but note that questions are referenced by many tables; we want to keep them.
-- You might add: truncate table questions cascade; if you want a full reset.

-- =====================================================
-- BRANCHES
-- =====================================================

insert into public.branches (id, name)
values
    ('cs', 'Computer Science'),
    ('me', 'Mechanical Engineering'),
    ('ee', 'Electrical Engineering'),
    ('xl', 'Life Sciences')
on conflict (id) do update
set name = excluded.name;


-- =====================================================
-- EXAMS
-- =====================================================

insert into public.exams (id, name, short_name)
values
    ('gate', 'Graduate Aptitude Test in Engineering', 'GATE'),
    ('isro', 'ISRO Scientist Exam', 'ISRO'),
    ('ese', 'Engineering Services Examination', 'ESE')
on conflict (id) do nothing;


-- =====================================================
-- SUBJECTS
-- =====================================================

insert into public.subjects (
    id,
    slug,
    name,
    icon_name,
    theme_color,
    question_count,
    category,
    is_universal,
    difficulty
)
values

-- -----------------------------------------------------
-- Universal
-- -----------------------------------------------------

(
    '11111111-1111-1111-1111-111111111111',
    'eng-maths',
    'Engineering Mathematics',
    'calculator',
    'red',
    10,
    'maths',
    true,
    'Medium'
),

(
    '22222222-2222-2222-2222-222222222222',
    'aptitude',
    'General Aptitude',
    'brain',
    'green',
    20,
    'general',
    true,
    'Medium'
),

-- -----------------------------------------------------
-- Existing CS
-- -----------------------------------------------------

(
    '33333333-3333-3333-3333-333333333333',
    'dsa',
    'Data Structures & Algorithms',
    'database',
    'blue',
    390,
    'core',
    false,
    'Medium'
),

(
    '44444444-4444-4444-4444-444444444444',
    'os',
    'Operating Systems',
    'cpu',
    'purple',
    1000,
    'core',
    false,
    'Medium'
),

-- -----------------------------------------------------
-- Existing ME
-- -----------------------------------------------------

(
    '55555555-5555-5555-5555-555555555555',
    'thermo',
    'Thermodynamics',
    'flame',
    'cyan',
    400,
    'core',
    false,
    'Medium'
),

-- -----------------------------------------------------
-- Existing EE
-- -----------------------------------------------------

(
    '66666666-6666-6666-6666-666666666666',
    'power-systems',
    'Power Systems',
    'zap',
    'teal',
    500,
    'core',
    false,
    'Medium'
),

-- -----------------------------------------------------
-- GATE XL
-- -----------------------------------------------------

(
    '77777777-7777-7777-7777-777777777771',
    'biochemistry',
    'Biochemistry',
    'dna',
    'pink',
    400,
    'core',
    false,
    'Medium'
),

(
    '77777777-7777-7777-7777-777777777772',
    'botany',
    'Botany',
    'leaf',
    'green',
    400,
    'core',
    false,
    'Medium'
),

(
    '77777777-7777-7777-7777-777777777773',
    'chemistry',
    'Chemistry',
    'flask',
    'violet',
    400,
    'core',
    false,
    'Medium'
),

(
    '77777777-7777-7777-7777-777777777774',
    'food-technology',
    'Food Technology',
    'fork-knife',
    'orange',
    400,
    'core',
    false,
    'Medium'
),

(
    '77777777-7777-7777-7777-777777777775',
    'microbiology',
    'Microbiology',
    'microscope',
    'cyan',
    400,
    'core',
    false,
    'Medium'
),

(
    '77777777-7777-7777-7777-777777777776',
    'zoology',
    'Zoology',
    'paw-print',
    'blue',
    500,
    'core',
    false,
    'Medium'
)

on conflict (slug) do update
set
    id = excluded.id,
    name = excluded.name,
    icon_name = excluded.icon_name,
    theme_color = excluded.theme_color,
    category = excluded.category,
    is_universal = excluded.is_universal,
    difficulty = excluded.difficulty;


-- =====================================================
-- BRANCH ↔ SUBJECT
-- =====================================================

insert into public.branch_subjects (branch_id, subject_id)
values

-- CS
(
    'cs',
    '33333333-3333-3333-3333-333333333333'
),
(
    'cs',
    '44444444-4444-4444-4444-444444444444'
),

-- ME
(
    'me',
    '55555555-5555-5555-5555-555555555555'
),

-- EE
(
    'ee',
    '66666666-6666-6666-6666-666666666666'
),

-- XL
(
    'xl',
    '77777777-7777-7777-7777-777777777771' -- Biochemistry
),
(
    'xl',
    '77777777-7777-7777-7777-777777777772' -- Botany
),
(
    'xl',
    '77777777-7777-7777-7777-777777777773' -- Chemistry
),
(
    'xl',
    '77777777-7777-7777-7777-777777777774' -- Food Technology
),
(
    'xl',
    '77777777-7777-7777-7777-777777777775' -- Microbiology
),
(
    'xl',
    '77777777-7777-7777-7777-777777777776' -- Zoology
)

on conflict do nothing;


-- =====================================================
-- EXAM ↔ SUBJECT
-- =====================================================

insert into public.exams_subjects (exams_id, subject_id)
values

-- -----------------------------------------------------
-- GATE
-- -----------------------------------------------------

(
    'gate',
    '11111111-1111-1111-1111-111111111111'
), -- Engineering Mathematics

(
    'gate',
    '22222222-2222-2222-2222-222222222222'
), -- General Aptitude

(
    'gate',
    '33333333-3333-3333-3333-333333333333'
), -- DSA

(
    'gate',
    '44444444-4444-4444-4444-444444444444'
), -- OS

(
    'gate',
    '55555555-5555-5555-5555-555555555555'
), -- Thermodynamics

(
    'gate',
    '66666666-6666-6666-6666-666666666666'
), -- Power Systems

-- GATE XL
(
    'gate',
    '77777777-7777-7777-7777-777777777771'
), -- Biochemistry

(
    'gate',
    '77777777-7777-7777-7777-777777777772'
), -- Botany

(
    'gate',
    '77777777-7777-7777-7777-777777777773'
), -- Chemistry

(
    'gate',
    '77777777-7777-7777-7777-777777777774'
), -- Food Technology

(
    'gate',
    '77777777-7777-7777-7777-777777777775'
), -- Microbiology

(
    'gate',
    '77777777-7777-7777-7777-777777777776'
), -- Zoology


-- -----------------------------------------------------
-- ISRO
-- -----------------------------------------------------

(
    'isro',
    '11111111-1111-1111-1111-111111111111'
),

(
    'isro',
    '33333333-3333-3333-3333-333333333333'
),

(
    'isro',
    '44444444-4444-4444-4444-444444444444'
),


-- -----------------------------------------------------
-- ESE
-- -----------------------------------------------------

(
    'ese',
    '11111111-1111-1111-1111-111111111111'
),

(
    'ese',
    '22222222-2222-2222-2222-222222222222'
),

(
    'ese',
    '55555555-5555-5555-5555-555555555555'
),

(
    'ese',
    '66666666-6666-6666-6666-666666666666'
)

on conflict do nothing;


-- =====================================================
-- BRANCH ↔ EXAMS
-- =====================================================

insert into public.branch_exams (branch_id, exam_id)
values
    ('cs', 'gate'),
    ('cs', 'isro'),
    ('cs', 'ese'),

    ('me', 'gate'),
    ('me', 'ese'),

    ('ee', 'gate'),
    ('ee', 'ese'),
    ('ee', 'isro'),

    ('xl', 'gate')

on conflict do nothing;

-- =====================================================
-- SAMPLE USER GOAL
-- =====================================================

insert into user_goals (
    id,
    user_id,
    branch_id,
    target_exams,
    is_active
)
values (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '00000000-0000-0000-0000-000000000001',
    'cs',
    '["gate", "isro"]',
    true
)
on conflict (user_id, branch_id) do nothing;

INSERT INTO public.questions (
    id, 
    question, 
    options, 
    correct_answer, 
    difficulty, 
    marks, 
    subject,          -- KEEP THIS
    subject_id,       -- UUID foreign key
    topic, 
    year, 
    question_type, 
    source, 
    verified, 
    added_by, 
    tags, 
    metadata,
    answer_text,
    source_url
)
VALUES
  -- 1. MCQ (Aptitude)
  ('a0000000-0000-0000-0000-000000000001'::uuid,
   'Choose the most appropriate word from the options given below to complete the following sentence. If you are trying to make a strong impression on your audience, you cannot do so by being understated, tentative or ________.',
   ARRAY['hyperbolic', 'restrained', 'argumentative', 'indifferent'],
   '[0]'::jsonb,
   'Medium', 2,
   'Aptitude',                                        -- <--- subject text
   '22222222-2222-2222-2222-222222222222',           -- <--- subject_id UUID
   'Most Appropriate Word', 2011,
   'multiple-choice', 'gateoverflow', true, 'seed_script',
   ARRAY['aptitude'], 
   '{"exam": "gate", "set": "1", "paperType": "Original", "language": "English"}'::jsonb,
   'Being understated and tentative are the opposite of making a strong impression. Hyperbolic means exaggerated, which fits the context.',
   'https://gateoverflow.in'),

  -- 2. MCQ (Aptitude)
  ('a0000000-0000-0000-0000-000000000002'::uuid,
   'Choose the word from the options given below that is most nearly opposite in the meaning to the given word: Amalgamate',
   ARRAY['merge', 'split', 'collect', 'separate'],
   '[2]'::jsonb,
   'Medium', 2,
   'Aptitude',
   '22222222-2222-2222-2222-222222222222',
   'Opposite', 2011,
   'multiple-choice', 'gateoverflow', true, 'seed_script',
   ARRAY['aptitude'],
   '{"exam": "gate", "set": "1", "paperType": "Original", "language": "English"}'::jsonb,
   'Amalgamate means to combine. Separate is the direct opposite.',
   'https://gateoverflow.in'),

  -- 3. MCQ (Numerical Logic)
  ('a0000000-0000-0000-0000-000000000003'::uuid,
   'If $\log (P) = (1/2)\log (Q) = (1/3)\log (R)$, then which of the following options is TRUE?',
   ARRAY['$P^2 = Q^3R^2$','$Q^2=PR$','$Q^2 = R^3P$','$R=P^2Q^2$'],
   '[0]'::jsonb,
   'Medium', 2,
   'Aptitude',
   '22222222-2222-2222-2222-222222222222',
   'Logarithms', 2011,
   'multiple-choice', 'gateoverflow', true, 'seed_script',
   ARRAY['aptitude'],
   '{"exam": "gate", "set": "2", "paperType": "Original", "language": "English"}'::jsonb,
   'Let log P = k, then P=10^k, Q=10^{2k}, R=10^{3k}. Testing options shows P^2=Q^3R^2 is false, but calculating directly gives Q^2=PR.',
   'https://gateoverflow.in'),

	 -- 4. MCQ
  ('a0000000-0000-0000-0000-000000000004'::uuid,
   'Find the next number in the series: 2, 6, 12, 20, 30, ?',
   ARRAY['36','40','42','44'],
   '[2]'::jsonb,
   'Medium', 2,
   'Aptitude',
   '22222222-2222-2222-2222-222222222222',
   'Number Series', 2012,
   'multiple-choice', 'gateoverflow', true, 'seed_script',
   ARRAY['aptitude','series'],
   '{"exam": "gate", "set": "3", "paperType": "Original", "language": "English"}'::jsonb,
   'The differences between consecutive terms are 4,6,8,10,12; so next term = 30 + 12 = 42.',
   'https://gateoverflow.in'),

  -- 5. NAT (Numerical Answer Type)
  ('a0000000-0000-0000-0000-000000000005'::uuid,
   'A man can paint a wall in 6 hours. How many hours will it take for 3 men working at the same rate to paint the same wall?',
   NULL,
   '{"type": "exact", "value": 2}'::jsonb,
   'Easy', 1,
   'Aptitude',
   '22222222-2222-2222-2222-222222222222',
   'Work-Time', 2013,
   'numerical', 'gateoverflow', true, 'seed_script',
   ARRAY['aptitude','work'],
   '{"exam": "gate", "set": "1", "paperType": "Original", "language": "English"}'::jsonb,
   'If 1 man takes 6 hours, 3 men take 6/3 = 2 hours.',
   'https://gateoverflow.in'),

  -- 6. MSQ (Multiple Select Question)
  ('a0000000-0000-0000-0000-000000000006'::uuid,
   'Which of the following numbers are prime?',
   ARRAY['2','9','13','21'],
   '[0,2]'::jsonb,
   'Medium', 2,
   'Aptitude',
   '22222222-2222-2222-2222-222222222222',
   'Prime Numbers', 2014,
   'multiple-select', 'gateoverflow', true, 'seed_script',
   ARRAY['aptitude','prime'],
   '{"exam": "gate", "set": "2", "paperType": "Original", "language": "English"}'::jsonb,
   '2 and 13 are prime numbers; 9=3^2, 21=3*7.',
   'https://gateoverflow.in'),

  -- 7. MCQ
  ('a0000000-0000-0000-0000-000000000007'::uuid,
   'If a train travels 60 km in 1 hour and 30 minutes, what is its average speed in km/h?',
   ARRAY['40','42','45','50'],
   '[2]'::jsonb,
   'Easy', 1,
   'Aptitude',
   '22222222-2222-2222-2222-222222222222',
   'Speed-Distance-Time', 2015,
   'multiple-choice', 'gateoverflow', true, 'seed_script',
   ARRAY['aptitude','speed'],
   '{"exam": "gate", "set": "3", "paperType": "Original", "language": "English"}'::jsonb,
   'Time = 1.5 h, Speed = 60/1.5 = 40 km/h. Correct answer 40.',
   'https://gateoverflow.in'),

  -- 8. NAT
  ('a0000000-0000-0000-0000-000000000008'::uuid,
   'The sum of first 15 natural numbers is:',
   NULL,
   '{"type": "exact", "value": 120}'::jsonb,
   'Easy', 1,
   'Aptitude',
   '22222222-2222-2222-2222-222222222222',
   'Series-Sum', 2016,
   'numerical', 'gateoverflow', true, 'seed_script',
   ARRAY['aptitude','series'],
   '{"exam": "gate", "set": "1", "paperType": "Original", "language": "English"}'::jsonb,
   'Sum = n(n+1)/2 = 15*16/2 = 120.',
   'https://gateoverflow.in'),

  -- 9. MSQ
  ('a0000000-0000-0000-0000-000000000009'::uuid,
   'Which of the following fractions are less than 1/2?',
   ARRAY['1/3','3/4','2/5','5/6'],
   '[0,2]'::jsonb,
   'Medium', 2,
   'Aptitude',
   '22222222-2222-2222-2222-222222222222',
   'Fractions', 2017,
   'multiple-choice', 'gateoverflow', true, 'seed_script',
   ARRAY['aptitude','fractions'],
   '{"exam": "gate", "set": "2", "paperType": "Original", "language": "English"}'::jsonb,
   '1/3 < 1/2, 2/5 < 1/2, 3/4 and 5/6 > 1/2.',
   'https://gateoverflow.in'),

  -- 10. MCQ
  ('a0000000-0000-0000-0000-000000000010'::uuid,
   'If 5x - 3 = 2, then x = ?',
   ARRAY['0','1','2','5/3'],
   '[1]'::jsonb,
   'Easy', 1,
   'Aptitude',
   '22222222-2222-2222-2222-222222222222',
   'Algebra', 2018,
   'Multiple Choice Question', 'gateoverflow', true, 'seed_script',
   ARRAY['aptitude','algebra'],
   '{"exam": "gate", "set": "3", "paperType": "Original", "language": "English"}'::jsonb,
   '5x - 3 = 2 ⇒ 5x = 5 ⇒ x = 1.',
   'https://gateoverflow.in'),

  -- 11. NAT
  ('a0000000-0000-0000-0000-000000000011'::uuid,
   'The product of 7 and 8 is:',
   NULL,
   '{"type": "exact", "value": 56}'::jsonb,
   'Easy', 1,
   'Aptitude',
   '22222222-2222-2222-2222-222222222222',
   'Multiplication', 2019,
   'numerical', 'gateoverflow', true, 'seed_script',
   ARRAY['aptitude','multiplication'],
   '{"exam": "gate", "set": "1", "paperType": "Original", "language": "English"}'::jsonb,
   '7 × 8 = 56',
   'https://gateoverflow.in'),

  -- 12. MSQ
  ('a0000000-0000-0000-0000-000000000012'::uuid,
   'Select all the prime factors of 30.',
   ARRAY['2','3','5','6'],
   '[0,1,2]'::jsonb,
   'Medium', 2,
   'Aptitude',
   '22222222-2222-2222-2222-222222222222',
   'Factors', 2020,
   'multiple-select', 'gateoverflow', true, 'seed_script',
   ARRAY['aptitude','factors'],
   '{"exam": "gate", "set": "2", "paperType": "Original", "language": "English"}'::jsonb,
   'Prime factors of 30 are 2,3,5. 6 is not prime.',
   'https://gateoverflow.in'),

  -- 13. MCQ
  ('a0000000-0000-0000-0000-000000000013'::uuid,
   'If the area of a square is 49 sq. units, the length of its side is:',
   ARRAY['6','7','8','9'],
   '[1]'::jsonb,
   'Easy', 1,
   'Aptitude',
   '22222222-2222-2222-2222-222222222222',
   'Geometry', 2021,
   'multiple-choice', 'gateoverflow', true, 'seed_script',
   ARRAY['aptitude','geometry'],
   '{"exam": "gate", "set": "3", "paperType": "Original", "language": "English"}'::jsonb,
   'Side = √Area = √49 = 7 units.',
   'https://gateoverflow.in'),

-- 14. DSA (MCQ)
('a0000000-0000-0000-0000-000000000014'::uuid,
 'What is the time complexity of binary search in a sorted array?',
 ARRAY['O(n)','O(log n)','O(n log n)','O(1)'],
 '[1]'::jsonb,
 'Easy', 2,
 'Data Structures & Algorithms',
 '33333333-3333-3333-3333-333333333333',
 'Searching', 2020,
 'multiple-choice',
 'gateoverflow', true, 'seed_script',
 ARRAY['dsa','complexity'],
 '{"exam":"gate"}'::jsonb,
 'Binary search halves the search space each time, leading to O(log n).',
 'https://gateoverflow.in'),

-- 15. DSA (MSQ)
('a0000000-0000-0000-0000-000000000015'::uuid,
 'Which of the following data structures use LIFO order?',
 ARRAY['Stack','Queue','Recursion Call Stack','Deque (as stack)'],
 '[0,2,3]'::jsonb,
 'Medium', 2,
 'Data Structures & Algorithms',
 '33333333-3333-3333-3333-333333333333',
 'Data Structures', 2021,
 'multiple-select',
 'gateoverflow', true, 'seed_script',
 ARRAY['dsa','stack'],
 '{"exam":"gate"}'::jsonb,
 'Stack and recursion use LIFO. Deque can act as stack. Queue is FIFO.',
 'https://gateoverflow.in'),

-- 16. Operating Systems (MCQ)
('a0000000-0000-0000-0000-000000000016'::uuid,
 'Which scheduling algorithm may cause starvation?',
 ARRAY['FCFS','Round Robin','Priority Scheduling','SJF'],
 '[2]'::jsonb,
 'Medium', 2,
 'Operating Systems',
 '44444444-4444-4444-4444-444444444444',
 'CPU Scheduling', 2019,
 'multiple-choice',
 'gateoverflow', true, 'seed_script',
 ARRAY['os','scheduling'],
 '{"exam":"gate"}'::jsonb,
 'In priority scheduling, low priority processes may suffer starvation.',
 'https://gateoverflow.in'),

-- 17. Operating Systems (NAT)
('a0000000-0000-0000-0000-000000000017'::uuid,
 'If a page size is 4 KB, how many bytes does each page contain?',
 NULL,
 '{"type": "exact", "value": 4096}'::jsonb,
 'Easy', 1,
 'Operating Systems',
 '44444444-4444-4444-4444-444444444444',
 'Paging', 2020,
 'numerical',
 'gateoverflow', true, 'seed_script',
 ARRAY['os','memory'],
 '{"exam":"gate"}'::jsonb,
 '4 KB = 4 × 1024 = 4096 bytes.',
 'https://gateoverflow.in'),

-- 18. Thermodynamics (MCQ)
('a0000000-0000-0000-0000-000000000018'::uuid,
 'For an ideal gas, which equation is correct?',
 ARRAY['PV = nRT','PV = mRT','P = ρRT','All of the above'],
 '[3]'::jsonb,
 'Medium', 2,
 'Thermodynamics',
 '55555555-5555-5555-5555-555555555555',
 'Ideal Gas Law', 2018,
 'Multiple Choice Question',
 'gateoverflow', true, 'seed_script',
 ARRAY['thermo','gas-law'],
 '{"exam":"gate"}'::jsonb,
 'All are valid forms depending on representation (moles, mass, density).',
 'https://gateoverflow.in'),

-- 19. Thermodynamics (NAT)
('a0000000-0000-0000-0000-000000000019'::uuid,
 'The efficiency of a Carnot engine operating between 500K and 300K is (in %)?',
 NULL,
 '{"type": "exact", "value": 40}'::jsonb,
 'Medium', 2,
 'Thermodynamics',
 '55555555-5555-5555-5555-555555555555',
 'Carnot Cycle', 2021,
 'numerical',
 'gateoverflow', true, 'seed_script',
 ARRAY['thermo','efficiency'],
 '{"exam":"gate"}'::jsonb,
 'Efficiency = 1 - (T2/T1) = 1 - (300/500) = 0.4 = 40%.',
 'https://gateoverflow.in'),

-- 20. Power Systems (MCQ)
('a0000000-0000-0000-0000-000000000020'::uuid,
 'The unit of electrical power is:',
 ARRAY['Volt','Ampere','Watt','Ohm'],
 '[2]'::jsonb,
 'Easy', 1,
 'Power Systems',
 '66666666-6666-6666-6666-666666666666',
 'Basics', 2017,
 'multiple-choice',
 'gateoverflow', true, 'seed_script',
 ARRAY['power','basics'],
 '{"exam":"gate"}'::jsonb,
 'Power is measured in Watt.',
 'https://gateoverflow.in'),

-- 21. Power Systems (MSQ)
('a0000000-0000-0000-0000-000000000021'::uuid,
 'Which of the following are renewable energy sources?',
 ARRAY['Solar','Wind','Coal','Hydro'],
 '[0,1,3]'::jsonb,
 'Easy', 2,
 'Power Systems',
 '66666666-6666-6666-6666-666666666666',
 'Energy Sources', 2022,
 'multiple-select',
 'gateoverflow', true, 'seed_script',
 ARRAY['power','renewable'],
 '{"exam":"gate"}'::jsonb,
 'Solar, Wind and Hydro are renewable. Coal is non-renewable.',
 'https://gateoverflow.in'),

-- 22. Engineering Mathematics (MCQ)
('a0000000-0000-0000-0000-000000000022'::uuid,
 'The derivative of sin(x) is:',
 ARRAY['cos(x)','-cos(x)','-sin(x)','tan(x)'],
 '[0]'::jsonb,
 'Easy', 1,
 'Engineering Mathematics',
 '11111111-1111-1111-1111-111111111111',
 'Calculus', 2016,
 'multiple-choice',
 'gateoverflow', true, 'seed_script',
 ARRAY['maths','calculus'],
 '{"exam":"gate"}'::jsonb,
 'Derivative of sin(x) is cos(x).',
 'https://gateoverflow.in'),

-- 23. Engineering Mathematics (NAT)
('a0000000-0000-0000-0000-000000000023'::uuid,
 'Evaluate ∫₀¹ x dx.',
 NULL,
 '{"type": "exact", "value": 0.5}'::jsonb,
 'Easy', 2,
 'Engineering Mathematics',
 '11111111-1111-1111-1111-111111111111',
 'Integration', 2018,
 'numerical',
 'gateoverflow', true, 'seed_script',
 ARRAY['maths','integration'],
 '{"exam":"gate"}'::jsonb,
 'Integral of x from 0 to 1 = x²/2 from 0 to1 = 1/2.',
 'https://gateoverflow.in'),

 -- 24. ISRO - DSA (MCQ)
('a0000000-0000-0000-0000-000000000024'::uuid,
 'Which traversal of a Binary Search Tree gives sorted output?',
 ARRAY['Preorder','Postorder','Inorder','Level Order'],
 '[2]'::jsonb,
 'Medium', 2,
 'Data Structures & Algorithms',
 '33333333-3333-3333-3333-333333333333',
 'Trees', 2019,
 'multiple-choice',
 'isro_official', true, 'seed_script',
 ARRAY['dsa','trees'],
 '{"exam":"isro"}'::jsonb,
 'Inorder traversal of BST produces sorted order.',
 'https://www.isro.gov.in'),

-- 25. ISRO - Operating Systems (MCQ)
('a0000000-0000-0000-0000-000000000025'::uuid,
 'Thrashing in operating systems is caused due to:',
 ARRAY['High CPU usage','Excessive paging','Deadlock','Fragmentation'],
 '[1]'::jsonb,
 'Medium', 2,
 'Operating Systems',
 '44444444-4444-4444-4444-444444444444',
 'Memory Management', 2020,
 'multiple-choice',
 'isro_official', true, 'seed_script',
 ARRAY['os','memory'],
 '{"exam":"isro"}'::jsonb,
 'Thrashing occurs when excessive paging reduces useful CPU work.',
 'https://www.isro.gov.in'),

-- 26. ISRO - Engineering Mathematics (NAT)
('a0000000-0000-0000-0000-000000000026'::uuid,
 'Find the determinant of matrix [[1,2],[3,4]].',
 NULL,
 '{"type": "exact", "value": -2}'::jsonb,
 'Easy', 2,
 'Engineering Mathematics',
 '11111111-1111-1111-1111-111111111111',
 'Matrices', 2018,
 'numerical',
 'isro_official', true, 'seed_script',
 ARRAY['maths','matrices'],
 '{"exam":"isro"}'::jsonb,
 'Determinant = (1×4 - 2×3) = 4 - 6 = -2.',
 'https://www.isro.gov.in'),

-- 27. ESE - Thermodynamics (MCQ)
('a0000000-0000-0000-0000-000000000027'::uuid,
 'The first law of thermodynamics is based on conservation of:',
 ARRAY['Mass','Momentum','Energy','Entropy'],
 '[2]'::jsonb,
 'Easy', 2,
 'Thermodynamics',
 '55555555-5555-5555-5555-555555555555',
 'Basic Laws', 2021,
 'multiple-choice',
 'ese_official', true, 'seed_script',
 ARRAY['thermo','laws'],
 '{"exam":"ese"}'::jsonb,
 'First law is based on conservation of energy.',
 'https://www.upsc.gov.in'),

-- 28. ESE - Thermodynamics (NAT)
('a0000000-0000-0000-0000-000000000028'::uuid,
 'If Cp = 1.005 kJ/kgK and Cv = 0.718 kJ/kgK, find gamma (Cp/Cv). (Round to 2 decimals)',
 NULL,
 '{"type": "exact", "value": 1.40}'::jsonb,
 'Medium', 2,
 'Thermodynamics',
 '55555555-5555-5555-5555-555555555555',
 'Specific Heats', 2020,
 'numerical',
 'ese_official', true, 'seed_script',
 ARRAY['thermo','gas-properties'],
 '{"exam":"ese"}'::jsonb,
 'Gamma = 1.005 / 0.718 ≈ 1.40.',
 'https://www.upsc.gov.in'),

-- 29. ESE - Power Systems (MCQ)
('a0000000-0000-0000-0000-000000000029'::uuid,
 'Which device is used to improve power factor?',
 ARRAY['Transformer','Capacitor','Generator','Inductor'],
 '[1]'::jsonb,
 'Medium', 2,
 'Power Systems',
 '66666666-6666-6666-6666-666666666666',
 'Power Factor', 2019,
 'multiple-choice',
 'ese_official', true, 'seed_script',
 ARRAY['power','pf'],
 '{"exam":"ese"}'::jsonb,
 'Capacitors supply reactive power to improve power factor.',
 'https://www.upsc.gov.in'),

-- 30. ESE - Power Systems (MSQ)
('a0000000-0000-0000-0000-000000000030'::uuid,
 'Which of the following are types of power plants?',
 ARRAY['Thermal','Hydroelectric','Nuclear','Compressor'],
 '[0,1,2]'::jsonb,
 'Easy', 2,
 'Power Systems',
 '66666666-6666-6666-6666-666666666666',
 'Generation', 2022,
 'multiple-select',
 'ese_official', true, 'seed_script',
 ARRAY['power','generation'],
 '{"exam":"ese"}'::jsonb,
 'Thermal, Hydro and Nuclear are power plants. Compressor is not.',
 'https://www.upsc.gov.in'),

-- 31. ISRO - DSA (NAT)
('a0000000-0000-0000-0000-000000000031'::uuid,
 'What is the height of a complete binary tree with 15 nodes?',
 NULL,
 '{"type": "range", "min": 3, "max": 4, "inclusive": true}'::jsonb,
 'Medium', 2,
 'Data Structures & Algorithms',
 '33333333-3333-3333-3333-333333333333',
 'Trees', 2021,
 'numerical',
 'isro_official', true, 'seed_script',
 ARRAY['dsa','trees'],
 '{"exam":"isro"}'::jsonb,
 'Height = log2(15+1) - 1 = log2(16) -1 = 4-1 = 3.',
 'https://www.isro.gov.in'),

-- 32. ESE - Engineering Mathematics (MCQ)
('a0000000-0000-0000-0000-000000000032'::uuid,
 'If f(x)=x^2, then f''(x) is:',
 ARRAY['2','x','2x','0'],
 '[0]'::jsonb,
 'Easy', 2,
 'Engineering Mathematics',
 '11111111-1111-1111-1111-111111111111',
 'Differentiation', 2017,
 'multiple-choice',
 'ese_official', true, 'seed_script',
 ARRAY['maths','calculus'],
 '{"exam":"ese"}'::jsonb,
 'Second derivative of x^2 is 2.',
 'https://www.upsc.gov.in'),

-- 33. ISRO - Operating Systems (MSQ)
('a0000000-0000-0000-0000-000000000033'::uuid,
 'Which of the following are deadlock necessary conditions?',
 ARRAY['Mutual Exclusion','Hold and Wait','Preemption','Circular Wait'],
 '[0,1,3]'::jsonb,
 'Hard', 2,
 'Operating Systems',
 '44444444-4444-4444-4444-444444444444',
 'Deadlock', 2022,
 'multiple-select',
 'isro_official', true, 'seed_script',
 ARRAY['os','deadlock'],
 '{"exam":"isro"}'::jsonb,
 'Four conditions: Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait. Preemption alone is not correct.',
 'https://www.isro.gov.in');


INSERT INTO public.user_question_activity (user_id, question_id, subject_id, branch_id, subject, was_correct, attempt_number)
VALUES 
('00000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'cs', 'Aptitude', true, 1),
('00000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'cs', 'Aptitude', true, 1),
('00000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 'cs', 'Aptitude', true, 1),
('00000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000004', '22222222-2222-2222-2222-222222222222', 'cs', 'Aptitude', false, 1);

-------------------
-- 1. TEST USERS --
-------------------


-- This is the final, corrected block for auth.users
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_sent_at,
  email_change_token_new,
  recovery_token
)
VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'authenticated',
  'authenticated',
  'test@example.com',
  crypt('password', gen_salt('bf')), -- The new, correct password hash
  now(), -- email_confirmed_at
  now(), -- recovery_sent_at
  now(), -- last_sign_in_at
  '{"provider":"email","providers":["email"]}',
  '{"name":"Test User"}',
  now(), -- created_at
  now(), -- updated_at
  '',    -- confirmation_token
  '',    -- email_change
  now(), -- email_change_sent_at
  '',    -- email_change_token_new
  ''     -- recovery_token
);

-- Create a corresponding user profile in the public schema
INSERT INTO public.users (id, name, email, college, "targetYear", version_number)
VALUES
('00000000-0000-0000-0000-000000000001'::uuid, 'Test User', 'test@example.com', 'GATEQuest University', 2027, 1);

-------------------
-- 2. TEN MORE USERS --
-------------------

-- We'll use deterministic UUIDs from ...002 to ...011
-- Each user gets an auth.users entry and a public.users profile.
-- Passwords are all 'password' (hashed).
-- Goals are inserted for each user.

INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_sent_at,
  email_change_token_new,
  recovery_token
)
VALUES
  -- User 2 (CS, 2025)
  (
    '00000000-0000-0000-0000-000000000000'::uuid,
    '00000000-0000-0000-0000-000000000002'::uuid,
    'authenticated', 'authenticated',
    'user2@example.com',
    crypt('password', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Alice Johnson"}',
    now(), now(), '', '', now(), '', ''
  ),
  -- User 3 (ME, 2026)
  (
    '00000000-0000-0000-0000-000000000000'::uuid,
    '00000000-0000-0000-0000-000000000003'::uuid,
    'authenticated', 'authenticated',
    'user3@example.com',
    crypt('password', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Bob Smith"}',
    now(), now(), '', '', now(), '', ''
  ),
  -- User 4 (EE, 2027)
  (
    '00000000-0000-0000-0000-000000000000'::uuid,
    '00000000-0000-0000-0000-000000000004'::uuid,
    'authenticated', 'authenticated',
    'user4@example.com',
    crypt('password', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Carol White"}',
    now(), now(), '', '', now(), '', ''
  ),
  -- User 5 (CS, 2025)
  (
    '00000000-0000-0000-0000-000000000000'::uuid,
    '00000000-0000-0000-0000-000000000005'::uuid,
    'authenticated', 'authenticated',
    'user5@example.com',
    crypt('password', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"David Brown"}',
    now(), now(), '', '', now(), '', ''
  ),
  -- User 6 (ME, 2028)
  (
    '00000000-0000-0000-0000-000000000000'::uuid,
    '00000000-0000-0000-0000-000000000006'::uuid,
    'authenticated', 'authenticated',
    'user6@example.com',
    crypt('password', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Eva Martinez"}',
    now(), now(), '', '', now(), '', ''
  ),
  -- User 7 (EE, 2026)
  (
    '00000000-0000-0000-0000-000000000000'::uuid,
    '00000000-0000-0000-0000-000000000007'::uuid,
    'authenticated', 'authenticated',
    'user7@example.com',
    crypt('password', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Frank Wilson"}',
    now(), now(), '', '', now(), '', ''
  ),
  -- User 8 (CS, 2027)
  (
    '00000000-0000-0000-0000-000000000000'::uuid,
    '00000000-0000-0000-0000-000000000008'::uuid,
    'authenticated', 'authenticated',
    'user8@example.com',
    crypt('password', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Grace Lee"}',
    now(), now(), '', '', now(), '', ''
  ),
  -- User 9 (ME, 2025)
  (
    '00000000-0000-0000-0000-000000000000'::uuid,
    '00000000-0000-0000-0000-000000000009'::uuid,
    'authenticated', 'authenticated',
    'user9@example.com',
    crypt('password', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Henry Taylor"}',
    now(), now(), '', '', now(), '', ''
  ),
  -- User 10 (EE, 2028)
  (
    '00000000-0000-0000-0000-000000000000'::uuid,
    '00000000-0000-0000-0000-000000000010'::uuid,
    'authenticated', 'authenticated',
    'user10@example.com',
    crypt('password', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Irene Davis"}',
    now(), now(), '', '', now(), '', ''
  ),
  -- User 11 (CS, 2026)
  (
    '00000000-0000-0000-0000-000000000000'::uuid,
    '00000000-0000-0000-0000-000000000011'::uuid,
    'authenticated', 'authenticated',
    'user11@example.com',
    crypt('password', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Jack Miller"}',
    now(), now(), '', '', now(), '', ''
  )
ON CONFLICT (id) DO NOTHING;

-- Public profiles for each user
INSERT INTO public.users (id, name, email, college, "targetYear", version_number)
VALUES
  ('00000000-0000-0000-0000-000000000002'::uuid, 'Alice Johnson', 'user2@example.com', 'MIT', 2026, 1),
  ('00000000-0000-0000-0000-000000000003'::uuid, 'Bob Smith',     'user3@example.com', 'Stanford', 2026, 1),
  ('00000000-0000-0000-0000-000000000004'::uuid, 'Carol White',   'user4@example.com', 'Berkeley', 2027, 1),
  ('00000000-0000-0000-0000-000000000005'::uuid, 'David Brown',   'user5@example.com', 'CMU', 2028, 1),
  ('00000000-0000-0000-0000-000000000006'::uuid, 'Eva Martinez',  'user6@example.com', 'Caltech', 2028, 1),
  ('00000000-0000-0000-0000-000000000007'::uuid, 'Frank Wilson',  'user7@example.com', 'Georgia Tech', 2026, 1),
  ('00000000-0000-0000-0000-000000000008'::uuid, 'Grace Lee',     'user8@example.com', 'UIUC', 2027, 1),
  ('00000000-0000-0000-0000-000000000009'::uuid, 'Henry Taylor',  'user9@example.com', 'Purdue', 2027, 1),
  ('00000000-0000-0000-0000-000000000010'::uuid, 'Irene Davis',   'user10@example.com', 'Texas A&M', 2028, 1),
  ('00000000-0000-0000-0000-000000000011'::uuid, 'Jack Miller',   'user11@example.com', 'UCLA', 2026, 1)
ON CONFLICT (id) DO NOTHING;

-- Goals for each new user (active, with branch and target exams)
INSERT INTO user_goals (id, user_id, branch_id, target_exams, is_active)
VALUES
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000002'::uuid, 'cs', '["gate","isro"]', true),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000003'::uuid, 'me', '["gate","ese"]', true),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000004'::uuid, 'ee', '["gate","isro","ese"]', true),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000005'::uuid, 'cs', '["gate"]', true),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000006'::uuid, 'me', '["ese"]', true),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000007'::uuid, 'ee', '["gate","isro"]', true),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000008'::uuid, 'cs', '["gate","ese"]', true),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000009'::uuid, 'me', '["gate"]', true),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000010'::uuid, 'ee', '["ese","isro"]', true),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000011'::uuid, 'cs', '["isro","ese"]', true)
ON CONFLICT (user_id, branch_id) DO NOTHING;

-- ============================================================
--  GENERATE ACTIVITY, PEER STATS, REVISION QUEUE & WEEKLY SETS
-- ============================================================

DO $$
DECLARE
  user_record RECORD;
  question_record RECORD;
  attempt_chance TEXT;
  correct_prob FLOAT;
  is_correct BOOLEAN;
  v_time_taken INT;
  attempt_id INT;
  question_list UUID[] := ARRAY(
    SELECT id FROM public.questions
  );
  selected_questions UUID[];
  q UUID;
  incorrect_qs UUID[];
  v_set_id UUID;
  set_date DATE;
  set_questions UUID[];
  q_for_set UUID;
  q_count INT;
  i INT;
  user_goal_branch TEXT;
BEGIN
  -- For each user
  FOR user_record IN SELECT id, (SELECT branch_id FROM user_goals WHERE user_id = users.id AND is_active = true LIMIT 1) AS branch_id FROM public.users LOOP
    -- Skip if no active goal (shouldn't happen)
    IF user_record.branch_id IS NULL THEN
      CONTINUE;
    END IF;

    -- Randomly select which questions this user attempts (about 60-80%)
    SELECT ARRAY_AGG(id) INTO selected_questions
    FROM (
      SELECT id FROM public.questions
      WHERE random() < 0.7  -- 70% chance to attempt a question
      LIMIT 25  -- but cap to avoid too many
    ) t;

    -- If no questions selected, pick at least 5 random ones
    IF array_length(selected_questions, 1) IS NULL OR array_length(selected_questions, 1) < 5 THEN
      SELECT ARRAY_AGG(id) INTO selected_questions
      FROM public.questions
      ORDER BY random()
      LIMIT 5;
    END IF;

    -- Insert attempts for each selected question
    FOREACH q IN ARRAY selected_questions
    LOOP
      -- Get difficulty of the question to set correctness probability
      SELECT difficulty INTO attempt_chance FROM public.questions WHERE id = q;
      -- Map difficulty to probability: Easy → 0.8, Medium → 0.6, Hard → 0.4, else 0.5
      CASE attempt_chance
        WHEN 'Easy' THEN correct_prob := 0.8;
        WHEN 'Medium' THEN correct_prob := 0.6;
        WHEN 'Hard' THEN correct_prob := 0.4;
        ELSE correct_prob := 0.5;
      END CASE;
      -- Randomly decide correctness
      is_correct := (random() < correct_prob);
      -- Random time 5–120 seconds
      v_time_taken := floor(random() * 115 + 5)::INT;

      -- Insert attempt (use ON CONFLICT to avoid duplicates if already present)
      INSERT INTO public.user_question_activity (
        user_id, question_id, subject_id, branch_id, subject, was_correct, time_taken, attempted_at, attempt_number, user_version_number
      )
      SELECT
        user_record.id,
        q,
        (SELECT subject_id FROM public.questions WHERE id = q),
        user_record.branch_id,
        (SELECT subject FROM public.questions WHERE id = q),
        is_correct,
        v_time_taken,
        now() - (random() * interval '30 days'), -- spread over last 30 days
        -- attempt_number: if already exists, increment
        COALESCE(
          (SELECT max(attempt_number) + 1 FROM public.user_question_activity WHERE user_id = user_record.id AND question_id = q),
          1
        ),
        1
      WHERE NOT EXISTS (
        SELECT 1 FROM public.user_question_activity
        WHERE user_id = user_record.id AND question_id = q AND attempt_number = 1
      );

      -- If the attempt was wrong, store question for later insertion into incorrect queue
      IF NOT is_correct THEN
        incorrect_qs := array_append(incorrect_qs, q);
      END IF;
    END LOOP;

    -- -- -- -- -- -- -- -- -- -- -- --
    -- INSERT INTO USER INCORRECT QUEUE
    -- -- -- -- -- -- -- -- -- -- -- --
    FOREACH q IN ARRAY incorrect_qs
    LOOP
      INSERT INTO public.user_incorrect_queue (user_id, question_id, added_at, box, next_review_at)
      VALUES (
        user_record.id,
        q,
        now(),
        1,  -- box 1: critical
        now() + (random() * interval '5 days') -- review within next 5 days
      )
      ON CONFLICT (user_id, question_id) DO NOTHING;
    END LOOP;

    -- -- -- -- -- -- -- -- -- -- -- --
    -- CREATE WEEKLY REVISION SETS (2 per user)
    -- -- -- -- -- -- -- -- -- -- -- --
    FOR i IN 1..2 LOOP
      -- Generate a past start_of_week (e.g., 1 and 2 weeks ago)
      set_date := CURRENT_DATE - (i * 7) - (EXTRACT(DOW FROM CURRENT_DATE)::INT - 1); -- Monday of that week

      -- Create the set
      INSERT INTO public.weekly_revision_set (
        id, generated_for, branch_id, start_of_week, status, created_at, total_questions, correct_count, accuracy
      )
      VALUES (
        gen_random_uuid(),
        user_record.id,
        user_record.branch_id,
        set_date,
        'expired',  -- mark as completed for simplicity
        now() - (i * interval '7 days'),
        0,  -- will update later
        0,
        0
      )
      RETURNING id INTO v_set_id;

      -- Now select 5–10 questions for this set:
      --   - Mix: some from incorrect_qs (if any), some from correct attempts, some never attempted
      -- We'll pick up to 3 from incorrect, 3 from correct, and fill with random from all questions.
      SELECT ARRAY_AGG(id) INTO set_questions
      FROM (
        (SELECT id FROM public.questions WHERE id = ANY(incorrect_qs) ORDER BY random() LIMIT 3)
        UNION ALL
        (SELECT id FROM public.user_question_activity
          WHERE user_id = user_record.id AND was_correct = true AND question_id != ALL(incorrect_qs)
          ORDER BY random() LIMIT 3)
        UNION ALL
        (SELECT id FROM public.questions WHERE id NOT IN (
          SELECT question_id FROM public.user_question_activity WHERE user_id = user_record.id
        ) ORDER BY random() LIMIT 3)
        LIMIT 10
      ) t;

      -- If still less than 5, fill with random from all questions
      IF array_length(set_questions, 1) < 5 THEN
        SELECT ARRAY_AGG(id) INTO set_questions
        FROM (
          SELECT id FROM public.questions
          WHERE id NOT IN (SELECT unnest(set_questions))
          ORDER BY random()
          LIMIT 5 - array_length(set_questions, 1)
        ) t;
      END IF;

      -- Insert revision_set_questions
      FOREACH q_for_set IN ARRAY set_questions
      LOOP
        -- Determine if the user attempted this question; if so, get the correctness and time
        INSERT INTO public.revision_set_questions (set_id, question_id, is_correct, time_spent_seconds)
        SELECT
          v_set_id,
          q_for_set,
          (SELECT was_correct FROM public.user_question_activity
           WHERE user_id = user_record.id AND question_id = q_for_set
           ORDER BY attempted_at DESC LIMIT 1),
          (SELECT time_taken FROM public.user_question_activity
           WHERE user_id = user_record.id AND question_id = q_for_set
           ORDER BY attempted_at DESC LIMIT 1)
        ON CONFLICT (set_id, question_id) DO NOTHING;

        -- Update set totals (increment total_questions)
        UPDATE public.weekly_revision_set
        SET total_questions = total_questions + 1,
            correct_count = correct_count + CASE
              WHEN (SELECT was_correct FROM public.user_question_activity
                    WHERE user_id = user_record.id AND question_id = q_for_set
                    ORDER BY attempted_at DESC LIMIT 1) THEN 1 ELSE 0 END
        WHERE id = v_set_id;
      END LOOP;

      -- Recalculate accuracy for the set
      UPDATE public.weekly_revision_set
      SET accuracy = CASE WHEN total_questions > 0 THEN correct_count::FLOAT / total_questions ELSE 0 END
      WHERE id = v_set_id;
    END LOOP;

    -- Reset incorrect_qs for next user
    incorrect_qs := '{}';
  END LOOP;

  -- Finally, refresh the peer stats
  PERFORM refresh_question_peer_stats();

END $$;

-- ============================================================
--  TOPIC TESTS & BOOKMARKS
-- ============================================================

DO $$
DECLARE
  user_record RECORD;
  test_count INT;
  test_status TEXT;
  test_id UUID;
  q_count INT;
  question_pool UUID[];
  q UUID;
  i INT;
  answer_choice INT;
  selected_answer JSONB;
  is_correct BOOLEAN;
  time_spent INT;
  attempt_status TEXT;
  total_q INT := 0;
  correct_q INT := 0;
  total_score INT := 0;
  bookmarked_qs UUID[] := '{}';
  bookmarks_to_add UUID[];
  q_temp UUID;
BEGIN
  FOR user_record IN SELECT id, (SELECT branch_id FROM user_goals WHERE user_id = users.id AND is_active = true LIMIT 1) AS branch_id FROM public.users LOOP
    IF user_record.branch_id IS NULL THEN
      CONTINUE;
    END IF;

    -- Determine how many tests: 2 or 3
    test_count := 2 + floor(random() * 2)::INT; -- 2 or 3

    FOR i IN 1..test_count LOOP
      -- Random status: first test completed, others mixed
      IF i = 1 THEN
        test_status := 'completed';
      ELSIF i = 2 AND random() < 0.5 THEN
        test_status := 'ongoing';
      ELSE
        test_status := 'completed';
      END IF;

      -- Select 5–10 questions for this test
      -- Prefer questions the user attempted, but also include some never attempted
      WITH attempted_qs AS (
        SELECT DISTINCT question_id AS id FROM public.user_question_activity WHERE user_id = user_record.id
      ),
      all_qs AS (
        SELECT id FROM public.questions
      )
      SELECT ARRAY_AGG(id) INTO question_pool
      FROM (
        (SELECT id FROM attempted_qs ORDER BY random() LIMIT 7)
        UNION ALL
        (SELECT id FROM all_qs WHERE id NOT IN (SELECT id FROM attempted_qs) ORDER BY random() LIMIT 3)
        LIMIT 10
      ) t;

      -- If pool is less than 5, fill with random from all questions
      IF array_length(question_pool, 1) < 5 THEN
        SELECT ARRAY_AGG(id) INTO question_pool
        FROM (
          SELECT id FROM public.questions
          WHERE id NOT IN (SELECT unnest(question_pool))
          ORDER BY random()
          LIMIT 5 - array_length(question_pool, 1)
        ) t;
      END IF;

      -- Create the topic test session
      INSERT INTO public.topic_tests (
        id, user_id, branch_id, topics, created_at, updated_at, status,
        remaining_time_seconds
      )
      VALUES (
        gen_random_uuid(),
        user_record.id,
        user_record.branch_id,
        ARRAY['aptitude', 'dsa'],  -- dummy topic list, could be random
        now() - (random() * interval '10 days'),
        now(),
        test_status,
        floor(random() * 900 + 600)::INT  -- 10-25 minutes remaining
      )
      RETURNING id INTO test_id;

      -- Insert attempts for each question in the pool
      total_q := 0;
      correct_q := 0;
      total_score := 0;

      FOREACH q IN ARRAY question_pool
      LOOP
        -- Determine status: unvisited, viewed, or answered
        -- For completed tests, most should be answered; for ongoing, mix
        IF test_status = 'completed' THEN
          IF random() < 0.1 THEN
            attempt_status := 'unvisited';
          ELSIF random() < 0.2 THEN
            attempt_status := 'viewed';
          ELSE
            attempt_status := 'answered';
          END IF;
        ELSE  -- ongoing
          IF random() < 0.3 THEN
            attempt_status := 'unvisited';
          ELSIF random() < 0.5 THEN
            attempt_status := 'viewed';
          ELSE
            attempt_status := 'answered';
          END IF;
        END IF;

        -- If answered, generate a user answer and correctness
        IF attempt_status = 'answered' THEN
          -- For MCQ, pick a random option index
          SELECT floor(random() * array_length(options, 1))::INT INTO answer_choice
          FROM public.questions WHERE id = q;
          selected_answer := to_jsonb(ARRAY[answer_choice]);
          -- Determine correctness based on stored correct_answer (simplified)
          -- We'll use a random correctness based on difficulty (same as earlier)
          -- But also reflect actual user's previous performance? For demo, random.
          is_correct := (random() < 0.6);  -- 60% chance correct
          time_spent := floor(random() * 60 + 5)::INT;  -- 5-65 seconds
        ELSE
          selected_answer := NULL;
          is_correct := NULL;
          time_spent := 0;
        END IF;

        INSERT INTO public.topic_tests_attempts (
          session_id, question_id, attempt_order, user_answer, marked_for_review,
          is_correct, score, time_spent_seconds, status
        )
        VALUES (
          test_id,
          q,
          array_position(question_pool, q),
          selected_answer,
          random() < 0.1,  -- 10% marked for review
          is_correct,
          CASE WHEN is_correct THEN 1 ELSE 0 END,
          time_spent,
          attempt_status
        );

        -- Aggregate totals for test summary
        total_q := total_q + 1;
        IF is_correct THEN
          correct_q := correct_q + 1;
          total_score := total_score + 1;  -- assuming each question is 1 mark
        END IF;
      END LOOP;

      -- Update the test summary fields
      UPDATE public.topic_tests
      SET total_questions = total_q,
          correct_count = correct_q,
          attempted_count = (SELECT COUNT(*) FROM public.topic_tests_attempts WHERE session_id = test_id AND status = 'answered'),
          score = total_score,
          accuracy = CASE WHEN total_q > 0 THEN correct_q::FLOAT / total_q ELSE 0 END,
          total_marks = total_q,
          completed_at = CASE WHEN test_status = 'completed' THEN now() ELSE NULL END
      WHERE id = test_id;

    END LOOP;

    -- -- -- -- -- -- -- -- -- -- -- --
    -- BOOKMARKS: 5–10 per user
    -- -- -- -- -- -- -- -- -- -- -- --
    -- Select up to 10 unique questions from the user's attempted questions and some not attempted
    WITH attempted_qs AS (
      SELECT DISTINCT question_id AS id FROM public.user_question_activity WHERE user_id = user_record.id
    ),
    all_qs AS (
      SELECT id FROM public.questions
    )
    SELECT ARRAY_AGG(id) INTO bookmarks_to_add
    FROM (
      (SELECT id FROM attempted_qs ORDER BY random() LIMIT 6)
      UNION ALL
      (SELECT id FROM all_qs WHERE id NOT IN (SELECT id FROM attempted_qs) ORDER BY random() LIMIT 4)
      LIMIT 10
    ) t;

  END LOOP;
END $$;

-- ============================================================
--  ADDITIONAL DONATIONS, SOCIAL PROFILES, NOTIFICATIONS & REPORTS
-- ============================================================

DO $$
DECLARE
  user_ids UUID[] := ARRAY(
    SELECT id FROM public.users
  );
  v_user_id UUID;
  question_ids UUID[] := ARRAY(
    SELECT id FROM public.questions
  );
  q_id UUID;
  donation_amount DECIMAL;
  random_message TEXT;
  utr_suffix INT := 50000;
  platform_url TEXT;
  report_type TEXT;
  report_status TEXT;
BEGIN
  -- -- -- -- -- -- -- -- -- -- -- --
  -- 9. ADD MORE DONATIONS
  -- -- -- -- -- -- -- -- -- -- -- --
  -- Insert 10 additional donations, mix of anonymous and linked
  FOR i IN 1..10 LOOP
    -- Pick a random user (or NULL for anonymous)
    IF random() < 0.4 THEN
      v_user_id := NULL;  -- anonymous
    ELSE
      v_user_id := user_ids[floor(random() * array_length(user_ids, 1) + 1)];
    END IF;

    donation_amount := floor(random() * 500 + 10)::DECIMAL; -- $10–$510
    random_message := CASE floor(random() * 5)::INT
      WHEN 0 THEN 'Keep up the great work!'
      WHEN 1 THEN 'This platform is amazing!'
      WHEN 2 THEN 'Helping students achieve their dreams 💪'
      WHEN 3 THEN 'Best resource for GATE preparation'
      ELSE 'Thank you for this service!'
    END;

    INSERT INTO public.donations (
      user_id, anonymous, message, suggested_amount, actual_amount, utr, verified, created_at
    )
    VALUES (
      v_user_id,
      CASE WHEN v_user_id IS NULL THEN TRUE ELSE FALSE END,  -- anonymous if no user
      CASE WHEN random() < 0.3 THEN NULL ELSE random_message END, -- 30% no message
      donation_amount,
      donation_amount + floor(random() * 20)::DECIMAL,  -- actual slightly different
      'UTR' || (utr_suffix + i)::TEXT,
      random() < 0.7,  -- 70% verified
      now() - (random() * interval '30 days')
    )
    ON CONFLICT (utr) DO NOTHING;
  END LOOP;


  -- -- -- -- -- -- -- -- -- -- -- --
  -- 10. SOCIAL PROFILES FOR ALL USERS
  -- -- -- -- -- -- -- -- -- -- -- --
  FOREACH v_user_id IN ARRAY user_ids
  LOOP
    platform_url := 'https://github.com/user_' || replace(v_user_id::TEXT, '-', '');
    INSERT INTO public.users_social (
      user_id, github_url, x_url, linkedin_url, youtube_url
    )
    VALUES (
      v_user_id,
      platform_url,
      'https://x.com/user_' || left(replace(v_user_id::TEXT, '-', ''), 8),
      'https://linkedin.com/in/user_' || left(replace(v_user_id::TEXT, '-', ''), 8),
      'https://youtube.com/c/user_' || left(replace(v_user_id::TEXT, '-', ''), 6)
    )
    ON CONFLICT (user_id) DO NOTHING;
  END LOOP;


  -- -- -- -- -- -- -- -- -- -- -- --
  -- 11. NOTIFICATIONS (global)
  -- -- -- -- -- -- -- -- -- -- -- --
  INSERT INTO public.notifications (created_at, title, message, type, active)
  VALUES
    (now() - interval '2 days', 'Welcome to GATEQuest!', 'Start your preparation journey with our personalized study plans.', 'onboarding', true),
    (now() - interval '5 days', 'New Questions Added!', 'We have added 50 new questions in DSA and Operating Systems.', 'content_update', true),
    (now() - interval '10 days', 'Weekly Revision Set Ready', 'Your weekly revision set for this week is now available.', 'revision', true),
    (now() - interval '1 day', 'Feature Update: Topic Tests', 'You can now create custom topic tests from any subject.', 'feature', true),
    (now() - interval '3 hours', 'Donation Milestone', 'We have reached ₹50,000 in donations! Thank you for your support.', 'community', true)
  ON CONFLICT (id) DO NOTHING;  -- id is auto-generated, no conflict normally

END $$;
