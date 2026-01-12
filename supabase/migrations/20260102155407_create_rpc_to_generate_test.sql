CREATE OR REPLACE FUNCTION generate_topic_test(
  p_filters jsonb,
  p_question_count int,
  p_total_seconds int,
  p_already_attempted_questions boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_new_test_id uuid;
  v_actual_count int;
  v_total_marks int;
  v_topic_names text[];
BEGIN
  -- Authentication Check
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Extract Topic Names for the "topics" column (Display Metadata)
  SELECT array_agg(DISTINCT topic)
  INTO v_topic_names
  FROM jsonb_to_recordset(p_filters) AS f(topic text);

  -- Create Test Session
  INSERT INTO public.topic_tests (
    user_id,
    topics,
    total_questions,
    remaining_time_seconds,
    status,
    total_marks
  )
  VALUES (
    v_user_id,
    v_topic_names,
    p_question_count,
    p_total_seconds,
    'created',
    0
  )
  RETURNING id INTO v_new_test_id;

  -- Question selection logic
  WITH user_history AS (
    SELECT DISTINCT question_id
    FROM public.user_question_activity
    WHERE user_id = v_user_id AND attempt_number = 1
  ),
  revision_queue AS (
    SELECT question_id
    FROM public.user_incorrect_queue
    WHERE user_id = v_user_id AND box = 1
  ),
  scored_questions AS (
    SELECT
      q.id AS q_id,
      q.topic,
      q.subject,
      CASE
        WHEN uh.question_id IS NULL THEN 1
        WHEN p_already_attempted_questions = TRUE AND rq.question_id IS NOT NULL THEN 2
        ELSE 3
      END AS selection_priority
    FROM public.questions q
    -- JOIN Condition: Matches BOTH Subject and Topic
    INNER JOIN jsonb_to_recordset(p_filters) AS f(subject text, topic text)
      ON q.subject = f.subject AND q.topic = f.topic
    LEFT JOIN user_history uh ON q.id = uh.question_id
    LEFT JOIN revision_queue rq ON q.id = rq.question_id
  ),
  distributed_questions AS (
    SELECT
      q_id,
      selection_priority,
      ROW_NUMBER() OVER (
        -- Partition by Subject+Topic to ensure fair distribution across collisions
        PARTITION BY subject, topic
        ORDER BY selection_priority ASC, random()
      ) AS distribution_rank
    FROM scored_questions
  )
  INSERT INTO public.topic_tests_attempts (
    session_id,
    question_id,
    attempt_order,
    status
  )
  SELECT
    v_new_test_id,
    q_id,
    ROW_NUMBER() OVER (ORDER BY distribution_rank ASC, random()),
    'unvisited'
  FROM distributed_questions
  ORDER BY distribution_rank ASC, selection_priority ASC
  LIMIT p_question_count;

  -- Actual question count
  GET DIAGNOSTICS v_actual_count = ROW_COUNT;

  -- Calculate total score
  SELECT COALESCE(SUM(q.marks), 0)
  INTO v_total_marks
  FROM public.topic_tests_attempts tta
  JOIN public.questions q ON q.id = tta.question_id
  WHERE tta.session_id = v_new_test_id;

  -- Update parent test record
  UPDATE public.topic_tests
  SET
    total_questions = v_actual_count,
    remaining_time_seconds = CASE
      WHEN v_actual_count < p_question_count
        THEN v_actual_count * 162
        ELSE remaining_time_seconds
    END,
    total_marks = v_total_marks
  WHERE id = v_new_test_id;

  -- Return result
  RETURN jsonb_build_object(
    'test_id', v_new_test_id,
    'requested_count', p_question_count,
    'actual_count', v_actual_count,
    'total_marks', v_total_marks
  );
END;
$$;
