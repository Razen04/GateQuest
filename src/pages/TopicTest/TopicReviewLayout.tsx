import ModernLoader from '@/components/ui/ModernLoader';
import type { Question, TestSession } from '@/types/storage';
import { supabase } from '@/utils/supabaseClient';
import { useEffect, useState } from 'react';
import { Outlet, useNavigate, useParams } from 'react-router-dom';

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
                // 1. Load test session
                const { data: sessionData, error: sessionError } = await supabase
                    .from('topic_tests')
                    .select('*')
                    .eq('id', testId)
                    .single();

                if (sessionError || !sessionData) {
                    throw new Error('Test not found.');
                }

                if (sessionData.status !== 'completed') {
                    navigate('/topic-test', { replace: true });
                    return;
                }

                // 2. Load attempts WITH questions
                const { data: attemptsData, error: attemptsError } = await supabase
                    .from('topic_tests_attempts')
                    .select('*, questions(*)')
                    .eq('session_id', testId)
                    .order('attempt_order', { ascending: true });

                if (attemptsError) {
                    throw attemptsError;
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
