import ModernLoader from '@/shared/components/ModernLoader';
import { getTestSession, initializeTestSession } from '@/features/topic-test/services/testSession';
import type { Question, TestSession } from '@/shared/types/storage';
import { Outlet, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { fetchAttemptsWithQuestions, fetchTestById } from '../api/topicTest';

type AttemptWithQuestion = {
    session_id: string;
    question_id: string;
    attempt_order: number;
    user_answer: any; // Can be number, number[], or string depending on question type
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

    const [session, setSession] = useState<TestSession | null>(null);
    const [attempts, setAttempts] = useState<AttemptWithQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // get the attempts and questions
    useEffect(() => {
        if (!testId) return;

        let isMounted = true;

        const loadResult = async () => {
            setLoading(true);
            setError(null);

            try {
                const localData = await getTestSession(testId);

                const hasAllQuestions = localData?.attempts?.every((attempt) =>
                    localData.questions.some((q) => q.id === attempt.question_id),
                );

                if (
                    localData &&
                    localData.session &&
                    localData.session.status === 'completed' &&
                    localData.attempts.length > 0 &&
                    hasAllQuestions
                ) {
                    const mappedAttempts = localData.attempts.map((attempt) => ({
                        ...attempt,
                        questions: localData.questions.find(
                            (q) => q.id === attempt.question_id,
                        ) as Question,
                    }));

                    if (isMounted) {
                        setSession(localData.session);
                        setAttempts(mappedAttempts);
                        setLoading(false);
                    }
                    return;
                }

                const { data: sessionData, error: sessionError } = await fetchTestById(testId);

                if (sessionError || !sessionData) {
                    throw new Error('Test not found.');
                }

                if (sessionData.status !== 'completed') {
                    navigate('/topic-test', { replace: true });
                    return;
                }

                // Load attempts WITH questions
                const { data: attemptsData, error: attemptsError } =
                    await fetchAttemptsWithQuestions(testId);

                if (attemptsError) {
                    throw attemptsError;
                }

                if (sessionData && attemptsData) {
                    const questionsToCache = attemptsData
                        .flatMap((a) => (Array.isArray(a.questions) ? a.questions : [a.questions]))
                        .filter((q): q is Question => !!q);

                    const pureAttemptsToCache = attemptsData.map(({ questions, ...a }) => a);

                    await initializeTestSession(sessionData, pureAttemptsToCache, questionsToCache);
                }

                if (isMounted) {
                    setSession(sessionData);
                    setAttempts(attemptsData ?? []);
                }
            } catch (err) {
                console.error(err);
                if (isMounted) {
                    setError(err instanceof Error ? err.message : 'Failed to load test results.');
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
    }, [testId, navigate]);

    if (loading) return <ModernLoader />;

    if (error) return <div className="text-red-500">{error}</div>;

    return <Outlet context={{ session, attempts }} />;
};

export default TestReviewLayout;
