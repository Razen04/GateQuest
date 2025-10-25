-- 1. Create the new, efficient function
CREATE OR REPLACE FUNCTION public.handle_new_attempt_stat()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- We ONLY care about the user's FIRST attempt,
  -- just like in your old function.
  IF NEW.attempt_number = 1 THEN

    INSERT INTO public.question_peer_stats (
      question_id,
      total_attempts,
      correct_attempts,
      wrong_attempts,
      avg_time_seconds,
      updated_at
    )
    VALUES (
      NEW.question_id,
      1, -- total attempts
      CASE WHEN NEW.was_correct = true THEN 1 ELSE 0 END, -- correct
      CASE WHEN NEW.was_correct = false THEN 1 ELSE 0 END, -- wrong
      NEW.time_taken, -- avg time
      now()
    )
    ON CONFLICT (question_id) DO UPDATE
    SET
      total_attempts = question_peer_stats.total_attempts + 1,
      correct_attempts = question_peer_stats.correct_attempts + (CASE WHEN NEW.was_correct = true THEN 1 ELSE 0 END),
      wrong_attempts = question_peer_stats.wrong_attempts + (CASE WHEN NEW.was_correct = false THEN 1 ELSE 0 END),

      -- This calculates the new running average time
      avg_time_seconds = (
        (question_peer_stats.avg_time_seconds * question_peer_stats.total_attempts) + NEW.time_taken
      ) / (question_peer_stats.total_attempts + 1),

      updated_at = now();

  END IF;

  RETURN NEW;
END;
$$;

-- 2. Create the trigger
-- This tells Postgres to run the function after every new row
-- is added to user_question_activity
CREATE TRIGGER on_new_attempt
  AFTER INSERT ON public.user_question_activity
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_attempt_stat();

