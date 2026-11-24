import { useEffect, useState } from 'react';
import { getPendingAttempts } from '@/features/topic-test/services/testSession';
import type { Attempt, Question, TestSession } from '@/shared/types/storage';
import { getMockSessionTime } from '../../api/mockTest';
import {
    fetchAttemptsWithQuestions,
    fetchTestById,
    updateTestStatus,
} from '../../api/topicTest';
import type { MockMeta, TestData } from './useTestLoader';

type RawJoinedAttempt = {
    session_id: string;
    question_id: string;
    attempt_order: number | null;
    user_answer: number | number[] | null;
    marked_for_review: boolean | null;
    status: string | null;
    is_correct: boolean | null;
    score: number | null;
    time_spent_seconds: number | null;
    questions: Question | Question[] | null;
};

const toAttempt = (row: RawJoinedAttempt): Attempt => ({
    session_id: row.session_id,
    question_id: row.question_id,
    attempt_order: row.attempt_order ?? 0,
    user_answer: row.user_answer,
    marked_for_review: row.marked_for_review ?? false,
    status: row.status ?? 'unvisited',
    is_correct: row.is_correct ?? false,
    score: row.score ?? 0,
    time_spent_seconds: row.time_spent_seconds ?? 0,
    is_synced: 1,
});

const useMockTestLoader = (testId: string) => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<TestData | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        (async () => {
            setLoading(true);
            setError(null);

            // ─── 1. Fetch session ────────────────────────────
            const { data: sessionRow, error: sessionError } =
                await fetchTestById(testId);

            if (sessionError || !sessionRow) {
                if (mounted) {
                    setError('Session not found.');
                    setLoading(false);
                }
                return;
            }

            // ─── 2. If created, transition to ongoing. This sets
            // started_at via DB trigger. Idempotent — resumes skip.
            if (sessionRow.status === 'created') {
                await updateTestStatus(testId, 'ongoing');
            }

            // ─── 3. Fetch authoritative time from server ─────
            // Supersedes remaining_time_seconds, which drifts because
            // the heartbeat is best-effort and there's no Dexie copy.
            const timeRes = await getMockSessionTime(testId);
            if ('error' in timeRes) {
                if (mounted) {
                    setError(`Timer unavailable: ${timeRes.error}`);
                    setLoading(false);
                }
                return;
            }

            // ─── 4. Fetch attempts + questions ────────────────
            const { data: joinedRaw, error: attemptsError } =
                await fetchAttemptsWithQuestions(testId);

            if (attemptsError || !joinedRaw) {
                if (mounted) {
                    setError('Failed to load mock attempts.');
                    setLoading(false);
                }
                return;
            }

            const joined = joinedRaw as unknown as RawJoinedAttempt[];
            const supabaseAttempts = joined.map(toAttempt);
            const pendingLocal = (await getPendingAttempts()).filter(
                (a) => a.session_id === testId
            );

            const merged = new Map<string, Attempt>();
            supabaseAttempts.forEach((a) => {
                merged.set(a.question_id, a);
            });
            pendingLocal.forEach((a) => {
                merged.set(a.question_id, a);
            });

            const attempts = Array.from(merged.values()).sort(
                (a, b) => a.attempt_order - b.attempt_order
            );

            // Build questions[] in attempt_order order so it lines up with
            // attempts[] — flat-mapping raw joined rows can be unordered.
            const byQuestionId = new Map<string, Question>();
            joined.forEach((row) => {
                const rows = Array.isArray(row.questions)
                    ? row.questions
                    : row.questions
                      ? [row.questions]
                      : [];
                rows.forEach((question) => {
                    byQuestionId.set(question.id, question);
                });
            });
            const questions: Question[] = attempts
                .map((a) => byQuestionId.get(a.question_id))
                .filter((q): q is Question => Boolean(q));

            // ─── 5. Override remaining_time_seconds ──────────
            const remaining = timeRes.not_started
                ? timeRes.time_allowed
                : timeRes.remaining_seconds;

            const session: TestSession = {
                ...(sessionRow as unknown as TestSession),
                remaining_time_seconds: remaining,
            };

            const mockMeta: MockMeta = {
                durationSeconds: timeRes.duration_seconds,
                endsAt: new Date(timeRes.window_ends_at).getTime(),
                label: timeRes.label ?? 'Mock Test',
            };

            if (mounted) {
                setData({ session, attempts, questions, mockMeta });
                setLoading(false);
            }
        })();

        return () => {
            mounted = false;
        };
    }, [testId]);

    return { data, loading, error };
};

export default useMockTestLoader;
