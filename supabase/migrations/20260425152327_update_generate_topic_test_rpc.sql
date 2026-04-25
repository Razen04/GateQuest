drop function if exists generate_topic_test(jsonb, int, int, boolean);

CREATE OR REPLACE FUNCTION generate_topic_test(
  p_filters jsonb,
  p_question_count int,
  p_total_seconds int,
  p_already_attempted_questions boolean,
  p_branch_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_new_test_id uuid;
  v_existing_test_id uuid;
  v_actual_count int;
  v_total_marks int;
  v_topic_names text[];
  
  -- Bucket Sizes (50/30/20 Rule)
  v_limit_new int := floor(p_question_count * 0.50);
  v_limit_rev int := floor(p_question_count * 0.30);
  v_limit_att int := p_question_count - (v_limit_new + v_limit_rev);
BEGIN
  -- Authentication Check
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Active Test Check (Prevent Duplicates)
  SELECT id INTO v_existing_test_id
  FROM public.topic_tests
  WHERE user_id = v_user_id 
    AND branch_id = p_branch_id 
    AND status != 'completed'
  LIMIT 1;

  IF v_existing_test_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'error', 'An active test already exists for this branch',
      'test_id', v_existing_test_id,
      'status', 'active_exists'
    );
  END IF;

  -- Extract Topic Names once
  SELECT array_agg(DISTINCT topic) INTO v_topic_names
  FROM jsonb_to_recordset(p_filters) AS f(topic text);

  -- Question Selection Logic (The Bucketed Approach)
  CREATE TEMP TABLE temp_selected_questions ON COMMIT DROP AS
  WITH 
  filter_params AS (
    SELECT subject_id, topic FROM jsonb_to_recordset(p_filters) AS f(subject_id uuid, topic text)
  ),
  user_history AS (
    SELECT DISTINCT question_id FROM public.user_question_activity WHERE user_id = v_user_id
  ),
  revision_queue AS (
    SELECT question_id FROM public.user_incorrect_queue WHERE user_id = v_user_id AND box = 1
  ),
  pool AS (
    SELECT q.id, q.marks, q.subject_id, q.topic,
           (uh.question_id IS NOT NULL) as is_attempted,
           (rq.question_id IS NOT NULL) as is_revision
    FROM public.questions q
    INNER JOIN filter_params fp ON q.subject_id = fp.subject_id AND q.topic = fp.topic
    LEFT JOIN user_history uh ON q.id = uh.question_id
    LEFT JOIN revision_queue rq ON q.id = rq.question_id
  ),
  bucket_new AS (
    SELECT id, marks, 1 as priority FROM pool WHERE NOT is_attempted ORDER BY random() LIMIT v_limit_new
  ),
  bucket_rev AS (
    SELECT id, marks, 2 as priority FROM pool WHERE is_revision AND id NOT IN (SELECT id FROM bucket_new) ORDER BY random() LIMIT v_limit_rev
  ),
  bucket_att AS (
    -- Fill the rest with any allowed questions not already selected
    SELECT id, marks, 3 as priority FROM pool 
    WHERE id NOT IN (SELECT id FROM bucket_new UNION SELECT id FROM bucket_rev)
    AND (p_already_attempted_questions OR NOT is_attempted)
    ORDER BY random()
    LIMIT (p_question_count) -- Overflow safety
  )
  SELECT id, marks FROM (
    SELECT * FROM bucket_new
    UNION ALL
    SELECT * FROM bucket_rev
    UNION ALL
    SELECT * FROM bucket_att
  ) combined
  LIMIT p_question_count;

  -- Safety Guard: Check if we actually found questions
  GET DIAGNOSTICS v_actual_count = ROW_COUNT;
  IF v_actual_count = 0 THEN
    RAISE EXCEPTION 'No questions found matching these filters';
  END IF;

  -- Create Test Session (Only if we have questions)
  INSERT INTO public.topic_tests (
    user_id, topics, total_questions, remaining_time_seconds, 
    status, total_marks, branch_id
  )
  VALUES (
    v_user_id, v_topic_names, v_actual_count, 
    (v_actual_count * 162), -- Standardized time
    'created', 0, p_branch_id
  )
  RETURNING id INTO v_new_test_id;

  -- Insert Attempts
  INSERT INTO public.topic_tests_attempts (session_id, question_id, attempt_order, status)
  SELECT v_new_test_id, id, row_number() OVER (), 'unvisited'
  FROM temp_selected_questions;

  -- Roll up final marks
  SELECT SUM(marks) INTO v_total_marks FROM temp_selected_questions;
  
  UPDATE public.topic_tests 
  SET total_marks = v_total_marks 
  WHERE id = v_new_test_id;

  RETURN jsonb_build_object(
    'test_id', v_new_test_id,
    'actual_count', v_actual_count,
    'total_marks', v_total_marks
  );
END;
$$;
