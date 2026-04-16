-- Migration: Add AI generation tracking columns to questions table
-- Required by the generate-ai-answer edge function for:
--   1. is_generating_ai  — acts as a distributed lock so concurrent requests
--      don't trigger duplicate Gemini API calls
--   2. updated_at        — used by the sync layer (useQuestions hook) to detect
--      incremental changes and avoid full re-fetches

ALTER TABLE "public"."questions"
    ADD COLUMN IF NOT EXISTS "is_generating_ai" boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now();

-- Index so the realtime filter (id=eq.<uuid>) and polling queries stay fast
CREATE INDEX IF NOT EXISTS "idx_questions_is_generating_ai"
    ON "public"."questions" ("is_generating_ai")
    WHERE "is_generating_ai" = true;

-- Allow the edge function (service_role) to update these columns
GRANT UPDATE ("is_generating_ai", "updated_at", "answer_text") ON "public"."questions" TO "service_role";

-- Enable realtime for the questions table so the syncing path works
ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."questions";
