import { useCallback, useState } from 'react';
import { useAuthStore } from '@/app/stores/useAuthStore';
import {
    getAttemptsBySessionId,
    getTestSession,
    updateAttempts,
} from '@/features/topic-test/services/testSession';
import type { Attempt } from '@/shared/types/storage';
import { fetchTestById, submitTestGrading } from '../../api/topicTest';
import { isOfficialMockPaper } from '../../utils/mockState';
import { mockSubmitDelayMs } from '../../utils/stagger';

type TestGradingResult = {
    total_score: number;
    correct_count: number;
    incorrect_count: number;
};

const useTestGrading = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const submitTest = useCallback(
        async (testId: string, options: { stagger?: boolean } = {}) => {
            setIsSubmitting(true);
            let retryCount = 0;
            const maxRetries = 2;

            try {
                // Topic-test path: session + attempts both live in Dexie.
                // Mock path: session lives only in Supabase (testSyncService
                // skips paper_id starting with "mock-"), but attempts DO
                // reach Dexie via useTestAnswer.saveAttempt. Read the two
                // halves from their respective sources.
                const local = await getTestSession(testId);

                let payload: Attempt[];
                let remainingTime: number;
                let paperId: string | null = null;

                if (local) {
                    payload = local.attempts;
                    remainingTime = local.session.remaining_time_seconds;
                    paperId = local.session.paper_id ?? null;
                } else {
                    const { data: sessionRow, error: sessionError } =
                        await fetchTestById(testId);
                    if (sessionError || !sessionRow) {
                        throw new Error('Session not found');
                    }
                    payload = await getAttemptsBySessionId(testId);
                    if (payload.length === 0) {
                        throw new Error('No attempts found');
                    }
                    remainingTime = sessionRow.remaining_time_seconds;
                    paperId =
                        (sessionRow as { paper_id?: string | null }).paper_id ??
                        null;
                }

                // Automatic (timer / window-end) mock submits all fire at
                // once. Spread them over a few seconds so grading does not
                // queue behind 500 simultaneous RPCs. Manual submits skip
                // this: the user is waiting for a response.
                if (options.stagger && isOfficialMockPaper(paperId)) {
                    const delay = mockSubmitDelayMs(
                        useAuthStore.getState().user?.id,
                        testId
                    );
                    if (delay > 0) {
                        await new Promise((resolve) =>
                            setTimeout(resolve, delay)
                        );
                    }
                }

                const rpcCall = async (): Promise<TestGradingResult> => {
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

                    return data as TestGradingResult;
                };

                const gradingResult = await rpcCall();

                if (
                    !gradingResult ||
                    typeof gradingResult !== 'object' ||
                    Array.isArray(gradingResult)
                ) {
                    throw new Error('Invalid test grading response');
                }

                const attempted =
                    gradingResult.correct_count + gradingResult.incorrect_count;

                // No-op for mocks (no Dexie session row); write-through for
                // topic tests. Silent by design.
                await updateAttempts(
                    testId,
                    [],
                    attempted,
                    gradingResult.total_score,
                    gradingResult.correct_count
                );

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
        },
        []
    );

    return { isSubmitting, submitTest };
};

export default useTestGrading;
