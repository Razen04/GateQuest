import { getTestSession, updateAttempts } from '@/features/topic-test/services/testSession';
import type { Attempt } from '@/shared/types/storage';
import { useCallback, useState } from 'react';
import { submitTestGrading } from '../../api/topicTest';

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
                const { data, error } = await submitTestGrading(testId, payload, remainingTime);

                if (error) {
                    if (retryCount < maxRetries) {
                        retryCount++;
                        await new Promise((res) => setTimeout(res, Math.pow(2, retryCount) * 1000));
                        return rpcCall();
                    }

                    throw error;
                }

                return data;
            };

            const result = await rpcCall();

            const attempted = result.correct_count + result.incorrect_count;

            await updateAttempts(testId, [], attempted, result.total_score, result.correct_count);
            // Add broadcast to update the stats in Dashboard.
            window.dispatchEvent(new Event('STATS_UPDATED'));

            return {
                totalScore: result.total_score,
                correctCount: result.correct_count,
                incorrectCount: result.incorrect_count,
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
