import { saveAttempt } from '@/storage/testSession';
import type { Attempt } from '@/types/storage';
import { useCallback, useMemo, useState } from 'react';

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

    // reviewList Map
    const [reviewList, setReviewList] = useState<Set<string>>(() => {
        const set = new Set<string>();
        initialAttempts.forEach((attempt) => {
            if (attempt.marked_for_review) set.add(attempt.question_id);
        });
        return set;
    });

    const [isSaving, setIsSaving] = useState(false);

    const selectOption = useCallback(
        (questionId: string, userAnswer: number | number[] | null, attemptOrder: number) => {
            setAnswers((prev) => {
                const next = new Map(prev);
                const existing = prev.get(questionId);

                const updatedAttempt: Attempt = {
                    session_id: testId,
                    question_id: questionId,
                    attempt_order: attemptOrder,
                    user_answer: userAnswer,
                    marked_for_review: existing?.marked_for_review ?? false,
                    status: userAnswer === null ? 'visited' : 'answered',
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
        [testId],
    );

    const updateTimeSpent = useCallback(
        (questionId: string, secondsToAdd: number, attemptOrder: number) => {
            setAnswers((prev) => {
                const next = new Map(prev);
                const existing = prev.get(questionId);

                const updatedAttempt: Attempt = existing
                    ? {
                          ...existing,
                          time_spent_seconds: (existing.time_spent_seconds || 0) + secondsToAdd,
                          is_synced: 0,
                      }
                    : {
                          session_id: testId,
                          question_id: questionId,
                          attempt_order: attemptOrder,
                          user_answer: null,
                          marked_for_review: false,
                          status: 'visited',
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
        [testId],
    );

    const toggleReview = useCallback(
        (questionId: string, attemptOrder: number) => {
            const isCurrentlyMarked = reviewList.has(questionId);
            const newStatus = !isCurrentlyMarked;

            setReviewList((prev) => {
                const next = new Set(prev);
                if (!newStatus) {
                    next.delete(questionId);
                } else {
                    next.add(questionId);
                }

                return next;
            });

            // attempt updated
            setAnswers((prev) => {
                const next = new Map(prev);
                const existing = prev.get(questionId);

                const updatedAttempt: Attempt = existing
                    ? {
                          ...existing,
                          marked_for_review: newStatus,
                          is_synced: 0,
                      }
                    : {
                          session_id: testId,
                          question_id: questionId,
                          attempt_order: attemptOrder,
                          user_answer: null,
                          marked_for_review: newStatus,
                          status: 'visited',
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
        [testId, reviewList],
    );

    // no. of questions answered
    const answeredCount = useMemo(() => {
        let count = 0;
        for (const attempt of answers.values()) {
            if (attempt.user_answer !== null && attempt.user_answer !== undefined) count++;
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
        [reviewList],
    );

    const isAnswered = useCallback(
        (questionId: string) => {
            const answer = answers.get(questionId);
            return answer?.user_answer != null && answer?.user_answer !== undefined;
        },
        [answers],
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
    };
};

export default useTestAnswer;
