import { useCallback, useState } from 'react';
import {
    getTestSession,
    updateAttempts,
} from '@/features/topic-test/services/testSession';
import type { Attempt } from '@/shared/types/storage';
import { submitTestGrading } from '../../api/topicTest';

type TestGradingResult = {
    total_score: number;
    correct_count: number;
    incorrect_count: number;
};

const useTestGrading = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const submitTest = useCallback(async (testId: string) => {
        setIsSubmitting(true);
        // in case it does not submit the first time, we will use exponential backoff strategy
        let retryCount = 0;
        const maxRetries = 2;

        try {
            const testSession = await getTestSession(testId);

            if (!testSession) {
                throw new Error('No test session present');
            }

            const payload: Attempt[] = testSession.attempts;
            const remainingTime = testSession.session.remaining_time_seconds;

            const rpcCall = async () => {
                const { data, error } = await submitTestGrading(
                    testId,
                    payload,
                    remainingTime
                );

                if (error) {
                    if (retryCount < maxRetries) {
                        retryCount++;
                        await new Promise((res) =>
                            setTimeout(res, 2 ** retryCount * 1000)
                        );
                        return rpcCall();
                    }

                    throw error;
                }

                return data;
            };

            const result = await rpcCall();

            if (
                !result ||
                typeof result !== 'object' ||
                Array.isArray(result)
            ) {
                throw new Error('Invalid test grading response');
            }

            const gradingResult = result as TestGradingResult;

            const attempted =
                gradingResult.correct_count + gradingResult.incorrect_count;

            await updateAttempts(
                testId,
                [],
                attempted,
                gradingResult.total_score,
                gradingResult.correct_count
            );

            // NOTE: Check if this is actually needed anymore after the Zustand Migration
            // Add broadcast to update the stats in Dashboard.
            window.dispatchEvent(new Event('STATS_UPDATED'));

            return {
                totalScore: gradingResult.total_score,
                correctCount: gradingResult.correct_count,
                incorrectCount: gradingResult.incorrect_count,
            };
        } catch (err) {
            console.error('Submission error: ', err);
            throw err;
        } finally {
            setIsSubmitting(false);
        }
    }, []);

    return {
        isSubmitting,
        submitTest,
    };
};

export default useTestGrading;
