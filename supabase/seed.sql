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

-- Create the user in the auth schema

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
INSERT INTO public.users (id, name, email, college, target_year)
VALUES
('00000000-0000-0000-0000-000000000001'::uuid, 'Test User', 'test@example.com', 'GATEQuest University', 2026);


-------------------
-- 2. QUESTIONS  --
-------------------

-- Insert 10 sample aptitude questions
INSERT INTO public.questions (id, question, options, correct_answer, difficulty, marks, subject, topic, year, question_type, source, verified, added_by)
VALUES
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'Choose the most appropriate word from the options given below to complete the following sentence. If you are trying to make a strong impression on your audience, you cannot do so by being understated, tentative or ________.', ARRAY['hyperbolic', 'restrained', 'argumentative', 'indifferent'], '[1]'::jsonb, 'Medium', 2, 'Aptitude', 'Most Appropriate Word', 2011, 'multiple-choice', 'gateoverflow', true, 'seed_script'),
  ('a0000000-0000-0000-0000-000000000002'::uuid, 'Choose the word from the options given below that is most nearly opposite in the meaning to the given word: Amalgamate', ARRAY['merge', 'split', 'collect', 'separate'], '[3]'::jsonb, 'Medium', 2, 'Aptitude', 'Opposite', 2011, 'multiple-choice', 'gateoverflow', true, 'seed_script'),
  ('a0000000-0000-0000-0000-000000000003'::uuid, 'If $\log (\text{P}) = (1/2)\log (\text{Q}) = (1/3)\log (\text{R})$, then which of the following options is TRUE?', ARRAY['$\text{P}^2 = \text{Q}^3\text{R}^2$','$\text{Q}^2=\text{P}\text{R}$','$\text{Q}^2 = \text{R}^3\text{P}$','$\text{R}=\text{P}^2\text{Q}^2$'], '[1]'::jsonb, 'Medium', 2, 'Aptitude', 'Logarithms', 2011, 'multiple-choice', 'gateoverflow', true, 'seed_script'),
  ('a0000000-0000-0000-0000-000000000004'::uuid, 'Which number does not belong in the series below? $2, 5, 10, 17, 26, 37, 50, 64$', ARRAY['17', '37', '64', '26'], '[2]'::jsonb, 'Easy', 1, 'Aptitude', 'Number Series', 2014, 'multiple-choice', 'gateoverflow', true, 'seed_script'),
  ('a0000000-0000-0000-0000-000000000005'::uuid, 'If she _______________ how to calibrate the instrument, she _______________ done the experiment.', ARRAY['knows, will have', 'knew, had', 'had known, could have', 'should have known, would have'], '[2]'::jsonb, 'Easy', 1, 'Aptitude', 'Grammar', 2014, 'multiple-choice', 'gateoverflow', true, 'seed_script'),
  ('a0000000-0000-0000-0000-000000000006'::uuid, 'A tourist covers half of his journey by train at $60\text{km/h}$, half of the remainder by bus at $30\text{km/h}$ and the rest by cycle at $10\text{km/h}$. The average speed of the tourist in $\text{km/h}$ during his entire journey is', ARRAY['36', '30', '24', '18'], '[2]'::jsonb, 'Easy', 1, 'Aptitude', 'Speed Time and Distance', 2013, 'multiple-choice', 'gateoverflow', true, 'seed_script'),
  ('a0000000-0000-0000-0000-000000000007'::uuid, 'What will be the maximum sum of $44, 42, 40, \dots$ ?', ARRAY['502', '504', '506', '500'], '[2]'::jsonb, 'Easy', 1, 'Aptitude', 'Number Series', 2013, 'multiple-choice', 'gateoverflow', true, 'seed_script'),
  ('a0000000-0000-0000-0000-000000000008'::uuid, 'Which one of the following options is the closest in meaning to the word given below? Nadir', ARRAY['Highest', 'Lowest', 'Medium', 'Integration'], '[1]'::jsonb, 'Medium', 2, 'Aptitude', 'Synonyms', 2013, 'multiple-choice', 'gateoverflow', true, 'seed_script'),
  ('a0000000-0000-0000-0000-000000000009'::uuid, 'The value of $\sqrt{12+\sqrt{12+\sqrt{12+\dots}}} $is', ARRAY['3.464', '3.932', '4.000', '4.444'], '[2]'::jsonb, 'Easy', 1, 'Aptitude', 'Number Series', 2014, 'multiple-choice', 'gateoverflow', true, 'seed_script'),
  ('a0000000-0000-0000-0000-000000000010'::uuid, 'Choose the grammatically INCORRECT sentence:', ARRAY['He is of Asian origin.','They belonged to Africa.','She is an European.','They migrated from India to Australia.'], '[2]'::jsonb, 'Medium', 2, 'Aptitude', 'Grammar', 2013, 'multiple-choice', 'gateoverflow', true, 'seed_script');


--------------------------------
-- 3. USER QUESTION ACTIVITY  --
--------------------------------

-- Simulate the test user attempting 4 questions
INSERT INTO public.user_question_activity (user_id, question_id, was_correct, time_taken, subject)
VALUES
  -- A correct attempt
  ('00000000-0000-0000-0000-000000000001'::uuid, 'a0000000-0000-0000-0000-000000000004'::uuid, true, 65, 'Aptitude'),
  -- An incorrect attempt
  ('00000000-0000-0000-0000-000000000001'::uuid, 'a0000000-0000-0000-0000-000000000002'::uuid, false, 45, 'Aptitude'),
  -- A second, correct attempt on the same question
  ('00000000-0000-0000-0000-000000000001'::uuid, 'a0000000-0000-0000-0000-000000000002'::uuid, true, 30, 'Aptitude'),
  -- A correct attempt on another question
  ('00000000-0000-0000-0000-000000000001'::uuid, 'a0000000-0000-0000-0000-000000000006'::uuid, true, 110, 'Aptitude');


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


-- Restore the original replication role
SET session_replication_role = origin;