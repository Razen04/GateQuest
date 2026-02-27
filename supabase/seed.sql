-- seed.sql
--
-- 1. Create a test user
-- 2. Insert 10 sample questions
-- 3. Simulate user activity on some questions
-- 4. Refresh the peer statistics based on the activity
--

-- Use a temporary role to bypass RLS for seeding
SET session_replication_role = replica;

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


------------------------------
-- 4. QUESTION PEER STATS  --
------------------------------
--
-- This part populates the peer stats table based on the activity we just created.
-- We do this by calling the `refresh_question_peer_stats` function that exists in the database.
-- NOTE: We are seeding the stats with only one user's data, so "peer stats" will just be this user's stats.
-- As more developers use their local instance and add to this seed file, the stats will become more diverse.
--

-- First, we need to populate the stats table with initial rows for the questions that have activity.
-- This ensures the function has rows to update.
INSERT INTO public.question_peer_stats (question_id, correct_attempts, wrong_attempts, total_attempts)
SELECT DISTINCT question_id::uuid, 0, 0, 0 from public.user_question_activity
ON CONFLICT (question_id) DO NOTHING;

-- Now, call the function to calculate and update the stats.
-- This is the recommended way to keep aggregate data fresh.
SELECT refresh_question_peer_stats();


------------------------------
-- 5. DOANTIONS --
------------------------------
INSERT INTO donations (user_id, anonymous, message, suggested_amount, actual_amount, utr, verified)
VALUES
('00000000-0000-0000-0000-000000000001'::uuid, FALSE, 'Keep up the great work!', 50.00, 50.00, 'UTR12345', TRUE);

INSERT INTO donations (anonymous, message, suggested_amount, actual_amount, utr, verified)
VALUES
(TRUE, NULL, 100.00, 100.00, 'UTR12346', FALSE);

INSERT INTO donations (anonymous, message, suggested_amount, actual_amount, utr, verified)
VALUES
(FALSE, 'Happy to support!', 75.50, 75.50, 'UTR12347', TRUE);

INSERT INTO donations (anonymous, message, suggested_amount, actual_amount, utr, verified)
VALUES
(FALSE, 'Love this project ❤️', 200.00, 200.00, 'UTR12348', TRUE);

INSERT INTO donations (anonymous, message, suggested_amount, actual_amount, utr, verified)
VALUES
(TRUE, NULL, 150.00, 150.00, 'UTR12349', FALSE);

-- =====================================================
-- CLEAN SEED (Safe for repeated runs)
-- =====================================================

-- Optional: clear in dependency order
truncate table exams_subjects cascade;
truncate table branch_subjects cascade;
truncate table user_goals cascade;
truncate table subjects cascade;
truncate table exams cascade;
truncate table branches cascade;


-- =====================================================
-- BRANCHES
-- =====================================================

insert into branches (id, name) values
('cs', 'Computer Science'),
('me', 'Mechanical Engineering'),
('ee', 'Electrical Engineering')
on conflict (id) do nothing;

-- =====================================================
-- EXAMS
-- =====================================================

insert into exams (id, name, short_name) values
('gate', 'Graduate Aptitude Test in Engineering', 'GATE'),
('isro', 'ISRO Scientist Exam', 'ISRO'),
('ese',  'Engineering Services Examination', 'ESE')
on conflict (id) do nothing;

-- =====================================================
-- SUBJECTS
-- =====================================================

insert into subjects (id, slug, name, icon_name, theme_color, difficulty_score, question_count, category, is_universal) values
('11111111-1111-1111-1111-111111111111', 'eng-maths', 'Engineering Mathematics', 'calculator', '#6366f1', 0.5, 0, 'maths', true),
('22222222-2222-2222-2222-222222222222', 'aptitude', 'General Aptitude', 'brain', '#f59e0b', 0.5, 0, 'general', true),
('33333333-3333-3333-3333-333333333333', 'dsa', 'Data Structures & Algorithms', 'database', '#10b981', 0.5, 0, 'core', false),
('44444444-4444-4444-4444-444444444444', 'os', 'Operating Systems', 'cpu', '#ef4444', 0.5, 0, 'core', false),
('55555555-5555-5555-5555-555555555555', 'thermo', 'Thermodynamics', 'flame', '#3b82f6', 0.5, 0, 'core', false),
('66666666-6666-6666-6666-666666666666', 'power-systems', 'Power Systems', 'zap', '#8b5cf6', 0.5, 0, 'core', false)
on conflict (slug) do nothing;

-- =====================================================
-- BRANCH ↔ SUBJECT
-- =====================================================

insert into branch_subjects (branch_id, subject_id) values
('cs', '33333333-3333-3333-3333-333333333333'),
('cs', '44444444-4444-4444-4444-444444444444'),
('me', '55555555-5555-5555-5555-555555555555'),
('ee', '66666666-6666-6666-6666-666666666666')
on conflict do nothing;

-- =====================================================
-- EXAM ↔ SUBJECT
-- =====================================================

insert into exams_subjects (exams_id, subject_id) values
-- GATE (all)
('gate', '11111111-1111-1111-1111-111111111111'),
('gate', '22222222-2222-2222-2222-222222222222'),
('gate', '33333333-3333-3333-3333-333333333333'),
('gate', '44444444-4444-4444-4444-444444444444'),
('gate', '55555555-5555-5555-5555-555555555555'),
('gate', '66666666-6666-6666-6666-666666666666'),

-- ISRO
('isro', '11111111-1111-1111-1111-111111111111'),
('isro', '33333333-3333-3333-3333-333333333333'),
('isro', '44444444-4444-4444-4444-444444444444'),

-- ESE
('ese', '11111111-1111-1111-1111-111111111111'),
('ese', '22222222-2222-2222-2222-222222222222'),
('ese', '55555555-5555-5555-5555-555555555555'),
('ese', '66666666-6666-6666-6666-666666666666')
on conflict do nothing;

-- =====================================================
-- BRANCH ↔ EXAMS
-- =====================================================

insert into branch_exams (branch_id, exam_id) values
('cs', 'gate'), ('cs', 'isro'), ('cs', 'ese'),
('me', 'gate'), ('me', 'ese'),
('ee', 'gate'), ('ee', 'ese'), ('ee', 'isro')
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
    explanation,
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
   'Multiple Choice Question', 'gateoverflow', true, 'seed_script',
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
   'Multiple Choice Question', 'gateoverflow', true, 'seed_script',
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
   'Multiple Choice Question', 'gateoverflow', true, 'seed_script',
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
   'Multiple Choice Question', 'gateoverflow', true, 'seed_script',
   ARRAY['aptitude','series'],
   '{"exam": "gate", "set": "3", "paperType": "Original", "language": "English"}'::jsonb,
   'The differences between consecutive terms are 4,6,8,10,12; so next term = 30 + 12 = 42.',
   'https://gateoverflow.in'),

  -- 5. NAT (Numerical Answer Type)
  ('a0000000-0000-0000-0000-000000000005'::uuid,
   'A man can paint a wall in 6 hours. How many hours will it take for 3 men working at the same rate to paint the same wall?',
   NULL,
   '2'::jsonb,
   'Easy', 1,
   'Aptitude',
   '22222222-2222-2222-2222-222222222222',
   'Work-Time', 2013,
   'Numerical Answer Type', 'gateoverflow', true, 'seed_script',
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
   'Multiple Select Question', 'gateoverflow', true, 'seed_script',
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
   'Multiple Choice Question', 'gateoverflow', true, 'seed_script',
   ARRAY['aptitude','speed'],
   '{"exam": "gate", "set": "3", "paperType": "Original", "language": "English"}'::jsonb,
   'Time = 1.5 h, Speed = 60/1.5 = 40 km/h. Correct answer 40.',
   'https://gateoverflow.in'),

  -- 8. NAT
  ('a0000000-0000-0000-0000-000000000008'::uuid,
   'The sum of first 15 natural numbers is:',
   NULL,
   '120'::jsonb,
   'Easy', 1,
   'Aptitude',
   '22222222-2222-2222-2222-222222222222',
   'Series-Sum', 2016,
   'Numerical Answer Type', 'gateoverflow', true, 'seed_script',
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
   'Multiple Select Question', 'gateoverflow', true, 'seed_script',
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
   '56'::jsonb,
   'Easy', 1,
   'Aptitude',
   '22222222-2222-2222-2222-222222222222',
   'Multiplication', 2019,
   'Numerical Answer Type', 'gateoverflow', true, 'seed_script',
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
   'Multiple Select Question', 'gateoverflow', true, 'seed_script',
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
   'Multiple Choice Question', 'gateoverflow', true, 'seed_script',
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
 'Multiple Choice Question',
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
 'Multiple Select Question',
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
 'Multiple Choice Question',
 'gateoverflow', true, 'seed_script',
 ARRAY['os','scheduling'],
 '{"exam":"gate"}'::jsonb,
 'In priority scheduling, low priority processes may suffer starvation.',
 'https://gateoverflow.in'),

-- 17. Operating Systems (NAT)
('a0000000-0000-0000-0000-000000000017'::uuid,
 'If a page size is 4 KB, how many bytes does each page contain?',
 NULL,
 '4096'::jsonb,
 'Easy', 1,
 'Operating Systems',
 '44444444-4444-4444-4444-444444444444',
 'Paging', 2020,
 'Numerical Answer Type',
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
 '40'::jsonb,
 'Medium', 2,
 'Thermodynamics',
 '55555555-5555-5555-5555-555555555555',
 'Carnot Cycle', 2021,
 'Numerical Answer Type',
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
 'Multiple Choice Question',
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
 'Multiple Select Question',
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
 'Multiple Choice Question',
 'gateoverflow', true, 'seed_script',
 ARRAY['maths','calculus'],
 '{"exam":"gate"}'::jsonb,
 'Derivative of sin(x) is cos(x).',
 'https://gateoverflow.in'),

-- 23. Engineering Mathematics (NAT)
('a0000000-0000-0000-0000-000000000023'::uuid,
 'Evaluate ∫₀¹ x dx.',
 NULL,
 '0.5'::jsonb,
 'Easy', 2,
 'Engineering Mathematics',
 '11111111-1111-1111-1111-111111111111',
 'Integration', 2018,
 'Numerical Answer Type',
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
 'Multiple Choice Question',
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
 'Multiple Choice Question',
 'isro_official', true, 'seed_script',
 ARRAY['os','memory'],
 '{"exam":"isro"}'::jsonb,
 'Thrashing occurs when excessive paging reduces useful CPU work.',
 'https://www.isro.gov.in'),

-- 26. ISRO - Engineering Mathematics (NAT)
('a0000000-0000-0000-0000-000000000026'::uuid,
 'Find the determinant of matrix [[1,2],[3,4]].',
 NULL,
 '-2'::jsonb,
 'Easy', 2,
 'Engineering Mathematics',
 '11111111-1111-1111-1111-111111111111',
 'Matrices', 2018,
 'Numerical Answer Type',
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
 'Multiple Choice Question',
 'ese_official', true, 'seed_script',
 ARRAY['thermo','laws'],
 '{"exam":"ese"}'::jsonb,
 'First law is based on conservation of energy.',
 'https://www.upsc.gov.in'),

-- 28. ESE - Thermodynamics (NAT)
('a0000000-0000-0000-0000-000000000028'::uuid,
 'If Cp = 1.005 kJ/kgK and Cv = 0.718 kJ/kgK, find gamma (Cp/Cv). (Round to 2 decimals)',
 NULL,
 '1.40'::jsonb,
 'Medium', 2,
 'Thermodynamics',
 '55555555-5555-5555-5555-555555555555',
 'Specific Heats', 2020,
 'Numerical Answer Type',
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
 'Multiple Choice Question',
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
 'Multiple Select Question',
 'ese_official', true, 'seed_script',
 ARRAY['power','generation'],
 '{"exam":"ese"}'::jsonb,
 'Thermal, Hydro and Nuclear are power plants. Compressor is not.',
 'https://www.upsc.gov.in'),

-- 31. ISRO - DSA (NAT)
('a0000000-0000-0000-0000-000000000031'::uuid,
 'What is the height of a complete binary tree with 15 nodes?',
 NULL,
 '3'::jsonb,
 'Medium', 2,
 'Data Structures & Algorithms',
 '33333333-3333-3333-3333-333333333333',
 'Trees', 2021,
 'Numerical Answer Type',
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
 'Multiple Choice Question',
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
 'Multiple Select Question',
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
