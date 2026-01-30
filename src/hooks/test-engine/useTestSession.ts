import { useCallback, useEffect, useRef, useState } from 'react';
import useTestAnswer from './useTestAnswer';
import useTestNavigation from './useTestNavigation';
import useTestTimer from './useTestTimer';
import useTestGrading from './useTestGrading';
import type { TestData } from './useTestLoader';
import type { Attempt, Question } from '@/types/storage';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/utils/supabaseClient';
import {
    getPendingAttempts,
    getTestSession,
    markAttemptsSynced,
    updateSessionTimeAndStatus,
} from '@/storage/testSession';

export interface UseTestSessionReturn {
    status: 'ready' | 'error' | 'submitting' | 'completed';
    timer: ReturnType<typeof useTestTimer>;
    navigation: ReturnType<typeof useTestNavigation>;
    answers: ReturnType<typeof useTestAnswer>;
    questions: Question[];
    handleNext: () => void;
    handlePrev: () => void;
    handleJumpTo: (index: number) => void;
    handleSubmit: () => void;
}

const useTestSession = (testId: string, data: TestData): UseTestSessionReturn => {
    const [status, setStatus] = useState<'ready' | 'error' | 'submitting' | 'completed'>('ready');
    const navigate = useNavigate();

    // for tracking time_spent_seconds for each Attempt
    const startTimeRef = useRef<number>(Date.now());

    // sub-hooks
    const answers = useTestAnswer({ testId, initialAttempts: data.attempts });
    const navigation = useTestNavigation(data.questions.length);
    const timer = useTestTimer({
        initialSeconds: data.session.remaining_time_seconds,
    });
    const grading = useTestGrading();

    const timerRef = useRef<number>(timer.secondsRemaining);
    const statusRef = useRef(status);

    // helper to commit time spent on current question
    const commitCurrentTime = useCallback(() => {
        const index = navigation.currentIndex;
        const question = data.questions[index];
        if (!question) return;

        const questionId = question.id;

        const deltaSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);

        const attemptOrder = data.questions.findIndex((q) => q.id === question.id) + 1;
        answers.updateTimeSpent(questionId, deltaSeconds, attemptOrder);
        startTimeRef.current = Date.now();
    }, [answers, navigation.currentIndex, data.questions]);

    // wrappers for navigation coupled with commitCurrentTime
    const handleNext = useCallback(() => {
        commitCurrentTime();
        navigation.next();
    }, [navigation, commitCurrentTime]);

    const handlePrev = useCallback(() => {
        commitCurrentTime();
        navigation.prev();
    }, [navigation, commitCurrentTime]);

    const handleJumpTo = useCallback(
        (index: number) => {
            commitCurrentTime();
            navigation.jumpTo(index);
        },
        [navigation, commitCurrentTime],
    );

    // wrapper for submit button which will also sync with supabase
    const handleSubmit = useCallback(async () => {
        setStatus('submitting');

        try {
            commitCurrentTime();

            // already submitted
            let testSession = await getTestSession(testId);
            if (!testSession) {
                throw new Error('Session not found after grading');
            }

            let session = testSession.session;

            if (session?.status === 'completed') {
                navigate(`/topic-test-result/${testId}`, { replace: true });
                return;
            }

            await grading.submitTest(testId);

            testSession = await getTestSession(testId);
            if (!testSession || testSession.session?.status !== 'completed') {
                throw new Error('Session not found after grading');
            }

            session = testSession.session;
            let attempts = testSession.attempts ?? [];

            // update topic_tests table in supabase with the graded session
            const { error: sessionError } = await supabase
                .from('topic_tests')
                .update({
                    status: 'completed',
                    completed_at: session.completed_at
                        ? new Date(session.completed_at).toISOString()
                        : null,
                    score: session.score,
                    accuracy: session.accuracy,
                    correct_count: session.correct_count,
                    attempted_count: session.attempted_count,
                    remaining_time_seconds: session.remaining_time_seconds,
                })
                .eq('id', testId);

            if (sessionError) {
                throw sessionError;
            }

            // sync the final attempts a last time
            if (attempts.length > 0) {
                const questionIndexMap = new Map(data.questions.map((q, i) => [q.id, i + 1]));
                const payload = attempts.map((a: Attempt) => {
                    return {
                        session_id: a.session_id,
                        question_id: a.question_id,
                        attempt_order: questionIndexMap.get(a.question_id ?? a.attempt_order),
                        user_answer: a.user_answer ?? null,
                        marked_for_review: a.marked_for_review ?? false,
                        status: a.status ?? 'unvisited',
                        is_correct: a.is_correct ?? null,
                        score: a.score ?? 0,
                        time_spent_seconds: a.time_spent_seconds,
                    };
                });

                const { error: attemptError } = await supabase
                    .from('topic_tests_attempts')
                    .upsert(payload, { onConflict: 'session_id, question_id' });

                if (attemptError) {
                    throw attemptError;
                }

                // mark locally synced
                await markAttemptsSynced(attempts);
            }

            setStatus('completed');
            navigate(`/topic-test-result/${testId}`, { replace: true });
        } catch (err) {
            console.error('Error in handleSubmit: ', err);
            setStatus('error');
        }
    }, [commitCurrentTime, grading, testId, data.questions, navigate, setStatus]);

    // Heartbeat: Sync timer + unsynced attempts every 30 seconds
    useEffect(() => {
        if (
            statusRef.current !== 'ready' &&
            statusRef.current !== 'submitting' &&
            statusRef.current === 'completed'
        )
            return;

        let cancelled = false;

        const heartbeat = async () => {
            if (!testId) return;

            try {
                // Sync remaining time to Supabase
                await supabase
                    .from('topic_tests')
                    .update({ remaining_time_seconds: timerRef.current })
                    .eq('id', testId);

                // Fetch unsynced attempts from Dexie
                const dirtyAttempts = await getPendingAttempts();
                if (dirtyAttempts.length > 0) {
                    // In handleSubmit AND in the Heartbeat useEffect:

                    const payload = dirtyAttempts.map((a) => {
                        // Find the REAL index from the master list (Static & Safe)
                        const realIndex = data.questions.findIndex((q) => q.id === a.question_id);

                        // Calculate the order (1-based)
                        // Fallback to a.attempt_order only if not found (safety net)
                        const finalOrder = realIndex !== -1 ? realIndex + 1 : a.attempt_order;

                        return {
                            session_id: a.session_id,
                            question_id: a.question_id,
                            attempt_order: finalOrder, // <--- RE-ADDED safely
                            user_answer: a.user_answer ?? null,
                            marked_for_review: a.marked_for_review ?? false,
                            status: a.status ?? 'unvisited',
                            is_correct: a.is_correct ?? null,
                            score: a.score ?? 0,
                            time_spent_seconds: a.time_spent_seconds,
                        };
                    });
                    const { error } = await supabase
                        .from('topic_tests_attempts')
                        .upsert(payload, { onConflict: 'session_id, question_id' });

                    if (!error) {
                        // mark attempts as synced locally
                        await markAttemptsSynced(dirtyAttempts);
                    } else {
                        console.error('Heartbeat upsert error:', error);
                    }
                }
            } catch (err) {
                console.error('Heartbeat failed:', err);
            }
        };

        // run immediately once
        heartbeat();

        // then every 60 seconds
        const interval = setInterval(() => {
            if (!cancelled) heartbeat();
        }, 60000);

        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [testId, status, data.questions]);

    useEffect(() => {
        if (timer.isExpired && status !== 'completed' && status !== 'submitting') handleSubmit();
    }, [timer.isExpired, status, handleSubmit]);

    // to save the timer value to appStorage every 5s

    useEffect(() => {
        if (status !== 'ready' && status !== 'submitting') return;

        timerRef.current = timer.secondsRemaining;
        const saveTimer = async () => {
            await updateSessionTimeAndStatus(testId, timer.secondsRemaining, status);
        };

        if (timer.secondsRemaining % 5 === 0) {
            saveTimer();
        }
    }, [timer.secondsRemaining, testId, status]);

    // save timer on unmount
    useEffect(() => {
        const saveTimer = async (time: number) => {
            await updateSessionTimeAndStatus(testId, time, status);
        };

        return () => {
            const time = timerRef.current;
            saveTimer(time);
        };
    }, []);

    return {
        questions: data.questions,
        handleNext,
        handlePrev,
        handleJumpTo,
        handleSubmit,
        status,
        timer,
        navigation,
        answers,
    };
};

export default useTestSession;
