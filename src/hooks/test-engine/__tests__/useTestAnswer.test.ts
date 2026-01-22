import { renderHook, act } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Attempt } from '@/types/storage';
import useTestAnswer from '../useTestAnswer';
import { saveAttempt } from '@/storage/testSession';

// mock saveAttempt
vi.mock('@/storage/testSession', () => ({
    saveAttempt: vi.fn(() => Promise.resolve()),
}));

describe('useTestAnswer hook', () => {
    const testId = 'test-1';

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('initialization', () => {
        it('initializes empty state when no attempts', () => {
            const { result } = renderHook(() => useTestAnswer({ testId, initialAttempts: [] }));

            expect(result.current.answers.size).toBe(0);
            expect(result.current.answeredCount).toBe(0);
            expect(result.current.markedForReviewCount).toBe(0);
        });

        it('hydrates state correctly from initialAttempts', () => {
            const initialAttempts: Attempt[] = [
                {
                    session_id: testId,
                    question_id: 'q1',
                    attempt_order: 1,
                    user_answer: [0],
                    marked_for_review: true,
                    status: 'answered',
                    is_correct: false,
                    score: 0,
                    time_spent_seconds: 10,
                    is_synced: 1,
                },
                {
                    session_id: testId,
                    question_id: 'q2',
                    attempt_order: 2,
                    user_answer: null,
                    marked_for_review: false,
                    status: 'unanswered',
                    is_correct: false,
                    score: 0,
                    time_spent_seconds: 0,
                    is_synced: 1,
                },
            ];

            const { result } = renderHook(() => useTestAnswer({ testId, initialAttempts }));

            expect(result.current.answers.size).toBe(2);
            expect(result.current.answers.get('q1')?.user_answer).toEqual([0]);
            expect(result.current.answeredCount).toBe(1);
            expect(result.current.markedForReviewCount).toBe(1);
        });
    });

    describe('selectOption', () => {
        it('updates state and calls saveAttempt', async () => {
            const { result } = renderHook(() => useTestAnswer({ testId, initialAttempts: [] }));

            await act(async () => {
                result.current.selectOption('q1', [1], 1);
            });

            const updated = result.current.answers.get('q1');
            expect(updated?.user_answer).toEqual([1]);
            expect(updated?.status).toBe('answered');
            expect(updated?.marked_for_review).toBe(false);
            expect(updated?.attempt_order).toBe(1);
            expect(saveAttempt).toHaveBeenCalledTimes(1);
        });

        it('preserves marked_for_review when updating answer', async () => {
            const initialAttempts: Attempt[] = [
                {
                    session_id: testId,
                    question_id: 'q1',
                    attempt_order: 1,
                    user_answer: null,
                    marked_for_review: true,
                    status: 'unanswered',
                    is_correct: false,
                    score: 0,
                    time_spent_seconds: 5,
                    is_synced: 1,
                },
            ];

            const { result } = renderHook(() => useTestAnswer({ testId, initialAttempts }));

            await act(async () => {
                result.current.selectOption('q1', [0], 1);
            });

            const updated = result.current.answers.get('q1');
            expect(updated?.marked_for_review).toBe(true);
        });
    });

    describe('toggleReview', () => {
        it('marks a question for review if no previous attempt exists', async () => {
            const { result } = renderHook(() => useTestAnswer({ testId, initialAttempts: [] }));

            await act(async () => {
                result.current.toggleReview('q1', 1);
            });

            const updated = result.current.answers.get('q1');
            expect(updated?.marked_for_review).toBe(true);
            expect(updated?.status).toBe('visited');
            expect(saveAttempt).toHaveBeenCalledTimes(1);
        });

        it('toggles review correctly for existing attempt', async () => {
            const initialAttempts: Attempt[] = [
                {
                    session_id: testId,
                    question_id: 'q1',
                    attempt_order: 1,
                    user_answer: [0],
                    marked_for_review: false,
                    status: 'answered',
                    is_correct: false,
                    score: 0,
                    time_spent_seconds: 10,
                    is_synced: 1,
                },
            ];

            const { result } = renderHook(() => useTestAnswer({ testId, initialAttempts }));

            await act(async () => {
                result.current.toggleReview('q1', 1);
            });

            let updated = result.current.answers.get('q1');
            expect(updated?.marked_for_review).toBe(true);

            await act(async () => {
                result.current.toggleReview('q1', 1);
            });

            updated = result.current.answers.get('q1');
            expect(updated?.marked_for_review).toBe(false);
        });
    });

    describe('updateTimeSpent function', () => {
        it('updates time_spent_seconds on existing attempt without overwriting other fields', async () => {
            const initialAttempt: Attempt = {
                session_id: testId,
                question_id: 'q1',
                attempt_order: 1,
                user_answer: [0],
                marked_for_review: true,
                status: 'answered',
                is_correct: false,
                score: 0,
                time_spent_seconds: 10,
                is_synced: 0,
            };

            const { result } = renderHook(() =>
                useTestAnswer({ testId, initialAttempts: [initialAttempt] }),
            );

            await act(async () => {
                result.current.updateTimeSpent('q1', 25, 1);
            });

            const updated = result.current.answers.get('q1') as Attempt;

            expect(updated.time_spent_seconds).toBe(35);
            expect(updated.user_answer).toEqual([0]);
            expect(updated.marked_for_review).toBe(true);

            expect(saveAttempt).toHaveBeenCalledWith(updated);
            expect(result.current.isSaving).toBe(false);
        });

        it('time_spent_seconds get added instead of overwriting', () => {
            const initialAttempt: Attempt = {
                session_id: testId,
                question_id: 'q2',
                attempt_order: 2,
                user_answer: [1],
                marked_for_review: false,
                status: 'answered',
                is_correct: false,
                score: 0,
                time_spent_seconds: 50,
                is_synced: 0,
            };

            const { result } = renderHook(() =>
                useTestAnswer({ testId, initialAttempts: [initialAttempt] }),
            );

            act(() => {
                result.current.updateTimeSpent('q2', 30, 2);
            });

            const updated = result.current.answers.get('q2') as Attempt;
            expect(updated.time_spent_seconds).toBe(80); // time get's added
        });
    });

    describe('derived state', () => {
        it('updates answeredCount correctly when answers change', async () => {
            const { result } = renderHook(() => useTestAnswer({ testId, initialAttempts: [] }));

            await act(async () => {
                result.current.selectOption('q1', [0], 1);
                result.current.selectOption('q2', [1, 2], 2);
            });

            expect(result.current.answeredCount).toBe(2);
        });

        it('updates markedForReviewCount correctly', async () => {
            const { result } = renderHook(() => useTestAnswer({ testId, initialAttempts: [] }));

            await act(async () => {
                result.current.toggleReview('q1', 1);
                result.current.toggleReview('q2', 2);
            });

            expect(result.current.markedForReviewCount).toBe(2);
        });
    });
});
