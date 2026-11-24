import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    getPendingAttempts,
    getTestSession,
    markAttemptsSynced,
    updateSessionTimeAndStatus,
} from '@/features/topic-test/services/testSession';
import type { Question } from '@/shared/types/storage';
import { updateTestTime, upsertAttempts } from '../../api/topicTest';
import useTestAnswer from './useTestAnswer';
import useTestGrading from './useTestGrading';
import type { TestData } from './useTestLoader';
import useTestNavigation from './useTestNavigation';
import useTestTimer from './useTestTimer';

export type ResultRouteFn = (testId: string) => string;

export interface UseTestSessionReturn {
    status: 'ready' | 'error' | 'submitting' | 'completed';
    timer: ReturnType<typeof useTestTimer>;
    navigation: ReturnType<typeof useTestNavigation>;
    answers: ReturnType<typeof useTestAnswer>;
    questions: Question[];
    handleNext: () => void;
    handlePrev: () => void;
    handleJumpTo: (index: number) => void;
    handleSubmit: (options?: { stagger?: boolean }) => void;
    /** True when this session came from a mock. False for topic tests. */
    isMockMode: boolean;
    /** Display title — mock label if mock, else undefined (header falls back). */
    mockLabel?: string | undefined;
    /**
     * Unix ms timestamp before which the Finish button should be locked.
     * Undefined for topic tests (finish always enabled).
     */
    finishUnlockAt?: number | undefined;
}

const useTestSession = (
    testId: string,
    data: TestData,
    resultRoute?: ResultRouteFn
): UseTestSessionReturn => {
    const [status, setStatus] = useState<
        'ready' | 'error' | 'submitting' | 'completed'
    >('ready');
    const navigate = useNavigate();

    const resultRouteRef = useRef<ResultRouteFn | undefined>(resultRoute);
    useEffect(() => {
        resultRouteRef.current = resultRoute;
    }, [resultRoute]);

    const startTimeRef = useRef<number>(Date.now());

    const answers = useTestAnswer({ testId, initialAttempts: data.attempts });
    const navigation = useTestNavigation(data.questions.length, data.questions);
    const timer = useTestTimer({
        initialSeconds: data.session.remaining_time_seconds,
    });
    const grading = useTestGrading();

    const timerRef = useRef<number>(timer.secondsRemaining);

    // ─── Mock meta derivation ────────────────────────────────
    const isMockMode = data.mockMeta !== undefined;
    const mockLabel = data.mockMeta?.label;
    // finishWindowSeconds = min(30min, 20% of test duration)
    // For 3h: 30min. For 1h: 12min. For 100s: 20s.
    const finishUnlockAt =
        data.mockMeta !== undefined
            ? data.mockMeta.endsAt -
              Math.max(
                  5 * 60 * 1000, // floor: finish always unlocks in final 5 min
                  Math.min(
                      30 * 60 * 1000,
                      data.mockMeta.durationSeconds * 0.2 * 1000
                  )
              )
            : undefined;

    const commitCurrentTime = useCallback(() => {
        const index = navigation.currentIndex;
        const question = data.questions[index];
        if (!question) return;
        const questionId = question.id;
        const deltaSeconds = Math.floor(
            (Date.now() - startTimeRef.current) / 1000
        );
        const storedOrder = answers.answers.get(questionId)?.attempt_order;
        const attemptOrder =
            storedOrder ??
            data.questions.findIndex((q) => q.id === question.id) + 1;
        answers.updateTimeSpent(questionId, deltaSeconds, attemptOrder);
        startTimeRef.current = Date.now();
    }, [answers, navigation.currentIndex, data.questions]);

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
        [navigation, commitCurrentTime]
    );

    const { currentIndex } = navigation;
    useEffect(() => {
        const question = data.questions[currentIndex];
        if (question) {
            const attemptOrder =
                answers.answers.get(question.id)?.attempt_order ??
                currentIndex + 1;
            answers.markAsVisited(question.id, attemptOrder);
        }
    }, [currentIndex, data.questions, answers, status]);

    const handleSubmit = useCallback(
        async (options?: { stagger?: boolean }) => {
            setStatus('submitting');
            const toResult = (id: string) =>
                resultRouteRef.current
                    ? resultRouteRef.current(id)
                    : `/topic-test-result/${id}`;
            try {
                commitCurrentTime();
                const testSession = await getTestSession(testId);
                if (testSession?.session?.status === 'completed') {
                    navigate(toResult(testId), { replace: true });
                    return;
                }
                await grading.submitTest(testId, options);
                navigate(toResult(testId), { replace: true });
                setStatus('completed');
            } catch (err) {
                console.error('Error in handleSubmit: ', err);
                setStatus('error');
            }
        },
        [commitCurrentTime, grading, testId, navigate]
    );

    // Heartbeat — for mocks, skip updateTestTime (server derives time).
    useEffect(() => {
        if (status === 'completed') return;

        let cancelled = false;

        const heartbeat = async () => {
            if (!testId) return;
            try {
                // Only sync timer for topic tests. Mock timer is
                // server-derivable from started_at + mock_duration_seconds.
                if (!isMockMode) {
                    await updateTestTime(testId, timerRef.current);
                }

                const dirtyAttempts = await getPendingAttempts();
                if (dirtyAttempts.length > 0) {
                    const payload = dirtyAttempts.map((a) => {
                        return {
                            session_id: a.session_id,
                            question_id: a.question_id,
                            // attempt_order comes from the assembled paper —
                            // never recompute it from the local array index.
                            attempt_order: a.attempt_order,
                            user_answer: a.user_answer ?? null,
                            marked_for_review: a.marked_for_review ?? false,
                            status: a.status ?? 'unvisited',
                            score: a.score ?? 0,
                            time_spent_seconds: a.time_spent_seconds,
                        };
                    });
                    const { error } = await upsertAttempts(payload);
                    if (!error) {
                        await markAttemptsSynced(dirtyAttempts);
                    } else {
                        console.error('Heartbeat upsert error:', error);
                    }
                }
            } catch (err) {
                console.error('Heartbeat failed:', err);
            }
        };

        heartbeat();
        const interval = setInterval(() => {
            if (!cancelled) heartbeat();
        }, 60000);
        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [testId, status, data.questions, isMockMode]);

    useEffect(() => {
        if (
            timer.isExpired &&
            status !== 'completed' &&
            status !== 'submitting'
        )
            handleSubmit({ stagger: true });
    }, [timer.isExpired, status, handleSubmit]);

    useEffect(() => {
        if (status !== 'ready' && status !== 'submitting') return;
        timerRef.current = timer.secondsRemaining;
        const saveTimer = async () => {
            // For mocks, don't write — server derives from started_at.
            if (isMockMode) return;
            await updateSessionTimeAndStatus(
                testId,
                timer.secondsRemaining,
                status
            );
        };
        if (timer.secondsRemaining % 5 === 0) saveTimer();
    }, [timer.secondsRemaining, testId, status, isMockMode]);

    useEffect(() => {
        const saveTimer = async (time: number) => {
            if (isMockMode) return;
            await updateSessionTimeAndStatus(testId, time, status);
        };
        return () => {
            const time = timerRef.current;
            saveTimer(time);
        };
    }, [testId, status, isMockMode]);

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
        isMockMode,
        mockLabel,
        finishUnlockAt,
    };
};

export default useTestSession;
