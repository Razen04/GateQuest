import { useCallback, useEffect, useRef, useState } from 'react';
import useTestAnswer from './useTestAnswer';
import useTestNavigation from './useTestNavigation';
import useTestTimer from './useTestTimer';
import useTestGrading from './useTestGrading';
import type { TestData } from './useTestLoader';

interface UseTestSessionReturn {
    status: 'ready' | 'error' | 'submitting' | 'completed';
    timer: ReturnType<typeof useTestTimer>;
    navigation: ReturnType<typeof useTestNavigation>;
    answers: ReturnType<typeof useTestAnswer>;
    handleNext: () => void;
    handlePrev: () => void;
    handleJumpTo: (index: number) => void;
    handleSubmit: () => Promise<boolean>;
}

const useTestSession = (testId: string, data: TestData): UseTestSessionReturn => {
    const [status, setStatus] = useState<'ready' | 'error' | 'submitting' | 'completed'>('ready');

    // for tracking time_spent_seconds for each Attempt
    const startTimeRef = useRef<number>(Date.now());

    // sub-hooks
    const answers = useTestAnswer({ testId, initialAttempts: data.attempts });
    const navigation = useTestNavigation(data.questions.length);
    const timer = useTestTimer({ initialSeconds: data.session.remaining_time_seconds });
    const grading = useTestGrading();

    // helper to commit time spent on current question
    const commitCurrentTime = useCallback(() => {
        const index = navigation.currentIndex;
        const question = data.questions[index];
        if (!question) return;

        const questionId = question.id;

        const deltaSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);

        const attemptOrder = index + 1; // logical order

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
        commitCurrentTime();
        setStatus('submitting');

        await grading.submitTest(testId);

        // we haven't created the supabase rpc or anything to sync to the tables in supabase all the information
        //
        setStatus('completed');
        return true;
    }, [commitCurrentTime, grading, testId]);

    useEffect(() => {
        if (timer.isExpired && status !== 'completed' && status !== 'submitting') handleSubmit();
    }, [timer.isExpired, status, handleSubmit]);

    return {
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
