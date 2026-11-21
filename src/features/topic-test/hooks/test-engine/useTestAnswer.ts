import { useCallback, useMemo, useState } from 'react';
import { saveAttempt } from '@/features/topic-test/services/testSession';
import type { Attempt } from '@/shared/types/storage';

// NOTE: Update viewed to visited in future in both DB and Tests
interface useTestAnswerPropType {
    testId: string;
    initialAttempts: Attempt[];
}

const useTestAnswer = ({ testId, initialAttempts }: useTestAnswerPropType) => {
    // answers map
    const [answers, setAnswers] = useState<Map<string, Attempt>>(() => {
        const map = new Map<string, Attempt>();
        initialAttempts.forEach((attempt) => {
            map.set(attempt.question_id, attempt);
        });

        return map;
    });

    const reviewList = useMemo(() => {
        const set = new Set<string>();
        for (const [questionId, attempt] of answers) {
            if (attempt.marked_for_review) set.add(questionId);
        }
        return set;
    }, [answers]);

    const [isSaving, setIsSaving] = useState(false);

    const selectOption = useCallback(
        (
            questionId: string,
            userAnswer: number | number[] | null,
            attemptOrder: number
        ) => {
            setAnswers((prev) => {
                const next = new Map(prev);
                const existing = prev.get(questionId);

                const updatedAttempt: Attempt = {
                    session_id: testId,
                    question_id: questionId,
                    attempt_order: attemptOrder,
                    user_answer: userAnswer,
                    marked_for_review: existing?.marked_for_review ?? false,
                    status: userAnswer === null ? 'viewed' : 'answered',
                    is_correct: false, // graded later
                    score: 0,
                    time_spent_seconds: existing?.time_spent_seconds ?? 0,
                    is_synced: 0,
                };

                next.set(questionId, updatedAttempt);

                setIsSaving(true);
                saveAttempt(updatedAttempt).finally(() => setIsSaving(false));

                return next;
            });
        },
        [testId]
    );

    const updateTimeSpent = useCallback(
        (questionId: string, secondsToAdd: number, attemptOrder: number) => {
            setAnswers((prev) => {
                const next = new Map(prev);
                const existing = prev.get(questionId);

                const updatedAttempt: Attempt = existing
                    ? {
                          ...existing,
                          time_spent_seconds:
                              (existing.time_spent_seconds || 0) + secondsToAdd,
                          is_synced: 0,
                      }
                    : {
                          session_id: testId,
                          question_id: questionId,
                          attempt_order: attemptOrder,
                          user_answer: null,
                          marked_for_review: false,
                          status: 'viewed',
                          is_correct: false, // graded later
                          score: 0,
                          time_spent_seconds: secondsToAdd,
                          is_synced: 0,
                      };

                next.set(questionId, updatedAttempt);

                setIsSaving(true);
                saveAttempt(updatedAttempt).finally(() => setIsSaving(false));

                return next;
            });
        },
        [testId]
    );

    const markAsVisited = useCallback(
        (questionId: string, attemptOrder: number) => {
            setAnswers((prev) => {
                const existing = prev.get(questionId);

                // If an attempt already exists (could be 'answered' or 'visited'),
                // we don't want to overwrite it.
                if (existing && existing?.status !== 'unvisited') return prev;

                const next = new Map(prev);
                const newAttempt: Attempt = {
                    session_id: testId,
                    question_id: questionId,
                    attempt_order: attemptOrder,
                    user_answer: null,
                    marked_for_review: false,
                    status: 'viewed',
                    is_correct: false,
                    score: 0,
                    time_spent_seconds: 0,
                    is_synced: 0,
                };

                next.set(questionId, newAttempt);

                setIsSaving(true);
                saveAttempt(newAttempt).finally(() => setIsSaving(false));

                return next;
            });
        },
        [testId]
    );

    const toggleReview = useCallback(
        (questionId: string, attemptOrder: number) => {
            setAnswers((prev) => {
                const next = new Map(prev);
                const existing = prev.get(questionId);
                const newMarkedStatus = !(existing?.marked_for_review ?? false);

                const updatedAttempt: Attempt = existing
                    ? {
                          ...existing,
                          marked_for_review: newMarkedStatus,
                          is_synced: 0,
                      }
                    : {
                          session_id: testId,
                          question_id: questionId,
                          attempt_order: attemptOrder,
                          user_answer: null,
                          marked_for_review: newMarkedStatus,
                          status: 'viewed',
                          is_correct: false, // graded later
                          score: 0,
                          time_spent_seconds: 0,
                          is_synced: 0,
                      };

                next.set(questionId, updatedAttempt);

                setIsSaving(true);
                saveAttempt(updatedAttempt).finally(() => setIsSaving(false));

                return next;
            });
        },
        [testId]
    );

    // no. of questions answered
    const answeredCount = useMemo(() => {
        let count = 0;
        for (const attempt of answers.values()) {
            if (
                attempt.user_answer !== null &&
                attempt.user_answer !== undefined
            )
                count++;
        }

        return count;
    }, [answers]);

    // no. of questions marked for review
    const markedForReviewCount = useMemo(() => {
        return reviewList.size;
    }, [reviewList]);

    // check if a question is marked_for_review
    const isMarkedForReview = useCallback(
        (questionId: string) => {
            return reviewList.has(questionId);
        },
        [reviewList]
    );

    const isAnswered = useCallback(
        (questionId: string) => {
            const answer = answers.get(questionId);
            return (
                answer?.user_answer != null && answer?.user_answer !== undefined
            );
        },
        [answers]
    );

    const isVisited = useCallback(
        (questionId: string) => {
            const attempt = answers.get(questionId);

            return attempt ? attempt.status !== 'unvisited' : false;
        },
        [answers]
    );

    return {
        answers,
        reviewList,
        isSaving,
        selectOption,
        updateTimeSpent,
        toggleReview,
        answeredCount,
        markedForReviewCount,
        isMarkedForReview,
        isAnswered,
        isVisited,
        markAsVisited,
    };
};

export default useTestAnswer;
