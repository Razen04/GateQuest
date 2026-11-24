import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
    getTestSession,
    initializeTestSession,
} from '@/features/topic-test/services/testSession';
import ModernLoader from '@/shared/components/ModernLoader';
import type { Attempt, Question, TestSession } from '@/shared/types/storage';
import { getMockSummary } from '../api/mockTest';
import { fetchAttemptsWithQuestions, fetchTestById } from '../api/topicTest';

export type AttemptWithQuestion = {
    session_id: string;
    question_id: string;
    attempt_order: number;
    user_answer: any;
    marked_for_review: boolean;
    status: string;
    is_correct: boolean | null;
    score: number;
    time_spent_seconds: number;
    questions: Question;
};

const TestReviewLayout = () => {
    const { testId } = useParams<{ testId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const isMockReviewRoute = location.pathname.includes('/topic-test-review/');

    const [session, setSession] = useState<TestSession | null>(null);
    const [attempts, setAttempts] = useState<AttemptWithQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!testId) return;

        let isMounted = true;

        const loadResult = async () => {
            setLoading(true);
            setError(null);

            const localData = await getTestSession(testId);

            try {
                const { data: sessionData, error: sessionError } =
                    await fetchTestById(testId);

                // Offline fallback: use the cached session only when Supabase
                // is unreachable. Server data is always authoritative when
                // available — Dexie attempts carry placeholder grades.
                if (sessionError || !sessionData) {
                    if (
                        localData?.session?.status === 'completed' &&
                        localData.attempts.length > 0
                    ) {
                        const byId = new Map(
                            localData.questions.map((q) => [q.id, q])
                        );
                        const mapped = localData.attempts
                            .slice()
                            .sort(
                                (a, b) =>
                                    (a.attempt_order ?? 0) -
                                    (b.attempt_order ?? 0)
                            )
                            .map((attempt) => ({
                                ...attempt,
                                questions: byId.get(attempt.question_id),
                            }));
                        if (isMounted) {
                            setSession(
                                localData.session as unknown as TestSession
                            );
                            setAttempts(
                                mapped as unknown as AttemptWithQuestion[]
                            );
                        }
                        return;
                    }
                    throw new Error('Test not found.');
                }

                // ─── Mock gate ────────────────────────────────────────
                // Mocks never enter Dexie. Their canonical result page is
                // /mock-tests/result/:testId; their review flow reuses the
                // existing /topic-test-review/:testId/:idx route but is
                // gated on donor/beta eligibility (analysis_unlocked).
                const paperId =
                    (sessionData as { paper_id?: string }).paper_id ?? '';
                const isMock = paperId.startsWith('mock-');

                if (isMock) {
                    // Non-review route → mock result page
                    if (!isMockReviewRoute) {
                        navigate(`/mock-tests/result/${testId}`, {
                            replace: true,
                        });
                        return;
                    }

                    // Review route → gate on eligibility
                    const summary = await getMockSummary(testId);
                    const canReview =
                        !('error' in summary) &&
                        summary.results_released === true &&
                        summary.analysis_unlocked === true;

                    if (!canReview) {
                        navigate(`/mock-tests/result/${testId}`, {
                            replace: true,
                        });
                        return;
                    }

                    const { data: mockAttemptsData, error: mockAttemptsError } =
                        await fetchAttemptsWithQuestions(testId);
                    if (mockAttemptsError) throw mockAttemptsError;

                    if (isMounted) {
                        setSession(sessionData as unknown as TestSession);
                        const sorted = [...(mockAttemptsData ?? [])].sort(
                            (a, b) =>
                                (a.attempt_order ?? 0) - (b.attempt_order ?? 0)
                        );
                        setAttempts(sorted as unknown as AttemptWithQuestion[]);
                    }
                    return;
                }

                // ─── Topic-test path (unchanged) ──────────────────────
                if (sessionData.status !== 'completed') {
                    navigate('/topic-test', { replace: true });
                    return;
                }

                const { data: attemptsData, error: attemptsError } =
                    await fetchAttemptsWithQuestions(testId);

                if (attemptsError) {
                    throw attemptsError;
                }

                if (sessionData && attemptsData) {
                    const questionsToCache = attemptsData
                        .flatMap((a) =>
                            Array.isArray(a.questions)
                                ? a.questions
                                : [a.questions]
                        )
                        .filter((q): q is Question => !!q);

                    const pureAttemptsToCache = attemptsData.map(
                        ({ questions, ...a }) => a
                    );

                    await initializeTestSession(
                        sessionData as unknown as TestSession,
                        pureAttemptsToCache as unknown as Attempt[],
                        questionsToCache
                    );
                }

                if (isMounted) {
                    setSession(sessionData as unknown as TestSession);
                    const sorted = [...(attemptsData ?? [])].sort(
                        (a, b) =>
                            (a.attempt_order ?? 0) - (b.attempt_order ?? 0)
                    );
                    setAttempts(sorted as unknown as AttemptWithQuestion[]);
                }
            } catch (err) {
                console.error(err);
                if (isMounted) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : 'Failed to load test results.'
                    );
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadResult();

        return () => {
            isMounted = false;
        };
    }, [testId, navigate, isMockReviewRoute]);

    if (loading) return <ModernLoader />;

    if (error) return <div className="text-red-500">{error}</div>;

    return <Outlet context={{ session, attempts }} />;
};

export default TestReviewLayout;
