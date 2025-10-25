-- 1. Change the column type from 'text' to 'uuid'
-- This will fail if you have any text that ISN'T a valid UUID.
ALTER TABLE public.user_question_activity
ALTER COLUMN question_id TYPE uuid USING (question_id::uuid);

-- 2. Add the foreign key constraint for data integrity
ALTER TABLE public.user_question_activity
ADD CONSTRAINT user_question_activity_question_id_fkey
FOREIGN KEY (question_id) REFERENCES public.questions(id)
ON DELETE SET NULL; -- (Keeps activity log if a question is deleted)


-- 3. Fix your 'batch' function to use UUIDs
CREATE OR REPLACE FUNCTION public.insert_user_question_activity_batch(batch jsonb)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  item jsonb;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(batch)
  LOOP
    INSERT INTO user_question_activity (
      user_id,
      question_id,
      subject,
      was_correct,
      time_taken,
      attempt_number,
      attempted_at
    )
    VALUES (
      (item->>'user_id')::uuid,
      (item->>'question_id')::uuid, -- <-- FIX 1: Cast to uuid
      item->>'subject',
      (item->>'was_correct')::boolean,
      (item->>'time_taken')::int,
      COALESCE(
        (SELECT max(uqa.attempt_number) + 1
         FROM user_question_activity uqa
         WHERE uqa.user_id = (item->>'user_id')::uuid
           AND uqa.question_id = (item->>'question_id')::uuid), -- <-- FIX 2: Cast to uuid
        1
      ),
      (item->>'attempted_at')::timestamptz
    );
  END LOOP;
END;
$$;