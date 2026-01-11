CREATE OR REPLACE FUNCTION public.handle_test_completion_sync()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only run when status changes to 'completed'
    IF NEW.status = 'completed' AND OLD.status <> 'completed' THEN

        -- ACTIVITY LOG
        INSERT INTO public.user_question_activity (
            user_id,
            question_id,
            subject,
            was_correct,
            time_taken,
            attempted_at,
            attempt_number
        )
        SELECT
            NEW.user_id,
            a.question_id,
            q.subject,
            a.is_correct,
            a.time_spent_seconds,
            NOW(),
            (
                SELECT COALESCE(MAX(attempt_number), 0) + 1
                FROM public.user_question_activity uqa
                WHERE uqa.user_id = NEW.user_id
                  AND uqa.question_id = a.question_id
            )
        FROM public.topic_tests_attempts a
        JOIN public.questions q ON q.id = a.question_id
        WHERE a.session_id = NEW.id;

        -- INCORRECT ANSWERS
        INSERT INTO public.user_incorrect_queue (
            user_id,
            question_id,
            box,
            added_at,
            next_review_at
        )
        SELECT
            NEW.user_id,
            a.question_id,
            1,
            NOW(),
            NOW()
        FROM public.topic_tests_attempts a
        WHERE a.session_id = NEW.id
          AND COALESCE(a.is_correct, FALSE) = FALSE
        ON CONFLICT (user_id, question_id)
        DO UPDATE SET
            box = 1,
            next_review_at = NOW() + interval '1 week';

        -- CORRECT ANSWERS → GRADUATE
        -- Graduate box 3
        DELETE FROM public.user_incorrect_queue q
        USING public.topic_tests_attempts a
        WHERE q.user_id = NEW.user_id
          AND q.question_id = a.question_id
          AND a.session_id = NEW.id
          AND a.is_correct IS TRUE
          AND q.box = 3;

        -- Promote box 1 → 2, box 2 → 3
        UPDATE public.user_incorrect_queue q
        SET
            box = q.box + 1,
            next_review_at = CASE
                WHEN q.box = 1 THEN NOW() + interval '2 weeks'
                WHEN q.box = 2 THEN NOW() + interval '4 weeks'
                ELSE q.next_review_at
            END
        FROM public.topic_tests_attempts a
        WHERE q.user_id = NEW.user_id
          AND q.question_id = a.question_id
          AND a.session_id = NEW.id
          AND a.is_correct IS TRUE
          AND q.box IN (1, 2);

    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_topic_test_completed ON public.topic_tests;

CREATE TRIGGER on_topic_test_completed
AFTER UPDATE ON public.topic_tests
FOR EACH ROW
EXECUTE FUNCTION public.handle_test_completion_sync();

