-- ═══════════════════════════════════════════════════════════════════
-- Mock Test Series: make content-count RPCs security definer
--
-- These four functions filter mock questions with:
--
--   not exists (select 1 from public.mock_questions ...)
--   or exists (... and public.user_can_access_mock (...))
--
-- After 20261117120000 revoked client SELECT on `mock_questions`, an
-- invoker-rights function can no longer evaluate that filter:
-- `permission denied for table mock_questions`.
--
-- Every other mock-aware RPC (catalog, create, summary, analysis,
-- leaderboard, practice) is already `security definer`. These four were
-- missed. They scope user data with `auth.uid()` explicitly, so running
-- with owner privileges does not widen what a caller can read.
-- ═══════════════════════════════════════════════════════════════════

alter function public.get_topic_counts (uuid) security definer;

alter function public.get_topic_counts (uuid) set search_path = 'public';

alter function public.get_exam_subject_counts (text[]) security definer;

alter function public.get_exam_subject_counts (text[]) set search_path = 'public';

alter function public.get_critical_question_count (uuid[]) security definer;

alter function public.get_critical_question_count (uuid[]) set search_path = 'public';

alter function public.generate_weekly_revision_set (uuid[], text[], text) security definer;

alter function public.generate_weekly_revision_set (uuid[], text[], text) set search_path = 'public';
