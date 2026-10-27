import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Attempt, Question } from '@/shared/types/storage';

const {
    mockUseTestAnswer,
    mockUseTestNavigation,
    mockUseTestTimer,
    mockUseTestGrading,
    mockUseNavigate,
} = vi.hoisted(() => ({
    mockUseTestAnswer: vi.fn(),
    mockUseTestNavigation: vi.fn(),
    mockUseTestTimer: vi.fn(),
    mockUseTestGrading: vi.fn(),
    mockUseNavigate: vi.fn(),
}));

vi.mock('@/features/topic-test/hooks/test-engine/useTestAnswer', () => ({
    default: mockUseTestAnswer,
}));
vi.mock('@/features/topic-test/hooks/test-engine/useTestNavigation', () => ({
    default: mockUseTestNavigation,
}));
vi.mock('@/features/topic-test/hooks/test-engine/useTestTimer', () => ({
    default: mockUseTestTimer,
}));
vi.mock('@/features/topic-test/hooks/test-engine/useTestGrading', () => ({
    default: mockUseTestGrading,
}));
vi.mock('react-router-dom', () => ({ useNavigate: () => mockUseNavigate }));

const {
    mockGetTestSession,
    mockGetPendingAttempts,
    mockMarkAttemptsSynced,
    mockUpdateSessionTimeAndStatus,
} = vi.hoisted(() => ({
    mockGetTestSession: vi.fn(),
    mockGetPendingAttempts: vi.fn(),
    mockMarkAttemptsSynced: vi.fn(),
    mockUpdateSessionTimeAndStatus: vi.fn(),
}));

vi.mock('@/features/topic-test/services/testSession', () => ({
    getTestSession: mockGetTestSession,
    getPendingAttempts: mockGetPendingAttempts,
    markAttemptsSynced: mockMarkAttemptsSynced,
    updateSessionTimeAndStatus: mockUpdateSessionTimeAndStatus,
}));

vi.mock('@/features/topic-test/api/topicTest', () => ({
    updateTestTime: mockUpdateTestTime,
    upsertAttempts: mockUpsertAttempts,
}));

const { mockUpdateTestTime, mockUpsertAttempts } = vi.hoisted(() => ({
    mockUpdateTestTime: vi.fn(),
    mockUpsertAttempts: vi.fn(),
}));

import type { TestData } from '@/features/topic-test/hooks/test-engine/useTestLoader';
import useTestSession from '@/features/topic-test/hooks/test-engine/useTestSession';

const questions: Question[] = [
    { id: 'q1' } as Question,
    { id: 'q2' } as Question,
];
const data: TestData = {
    session: { remaining_time_seconds: 300 } as any,
    attempts: [],
    questions,
};

describe('useTestSession', () => {
    let timerState: {
        secondsRemaining: number;
        isExpired: boolean;
        timeDisplay: string;
    };
    let navigationState: any;
    let answerMock: any;
    let gradingMock: any;

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(0);
        vi.clearAllMocks();

        timerState = {
            secondsRemaining: 300,
            isExpired: false,
            timeDisplay: '05:00',
        };
        navigationState = {
            currentIndex: 0,
            next: vi.fn(),
            prev: vi.fn(),
            jumpTo: vi.fn(),
            visitedIndices: new Set([0]),
        };
        answerMock = {
            updateTimeSpent: vi.fn(),
            markAsVisited: vi.fn(),
            answers: new Map(),
            reviewList: new Set(),
            isSaving: false,
            selectOption: vi.fn(),
            toggleReview: vi.fn(),
            answeredCount: 0,
            markedForReviewCount: 0,
            isMarkedForReview: vi.fn(() => false),
            isAnswered: vi.fn(() => false),
            isVisited: vi.fn(() => false),
        };
        gradingMock = {
            isSubmitting: false,
            submitTest: vi.fn().mockResolvedValue({
                totalScore: 10,
                correctCount: 5,
                incorrectCount: 3,
            }),
        };

        mockUseTestTimer.mockImplementation(() => timerState);
        mockUseTestNavigation.mockImplementation(() => navigationState);
        mockUseTestAnswer.mockImplementation(() => answerMock);
        mockUseTestGrading.mockImplementation(() => gradingMock);

        mockGetTestSession.mockResolvedValue({
            session: { status: 'ready', remaining_time_seconds: 300 },
            attempts: [],
            questions,
        });
        mockGetPendingAttempts.mockResolvedValue([]);
        mockMarkAttemptsSynced.mockResolvedValue(undefined);
        mockUpdateSessionTimeAndStatus.mockResolvedValue(undefined);
        mockUpdateTestTime.mockResolvedValue({ error: null });
        mockUpsertAttempts.mockResolvedValue({ error: null });
    });

    afterEach(() => vi.useRealTimers());

    it('commitCurrentTime writes a Date.now-based delta before navigation', async () => {
        const { result } = renderHook(() => useTestSession('test-1', data));

        await act(async () => {
            vi.advanceTimersByTime(7000);
        });
        await act(async () => {
            result.current.handleNext();
        });

        expect(answerMock.updateTimeSpent).toHaveBeenCalledWith('q1', 7, 1);
        expect(navigationState.next).toHaveBeenCalledTimes(1);
    });

    it('marks the currently-visible question as visited on mount', () => {
        renderHook(() => useTestSession('test-1', data));
        expect(answerMock.markAsVisited).toHaveBeenCalledWith('q1', 1);
    });

    it('marks the new question as visited when currentIndex changes', () => {
        const { rerender } = renderHook(() => useTestSession('test-1', data));
        expect(answerMock.markAsVisited).toHaveBeenLastCalledWith('q1', 1);

        navigationState.currentIndex = 1;
        rerender();

        expect(answerMock.markAsVisited).toHaveBeenLastCalledWith('q2', 2);
    });

    it('submits and navigates with replace on success', async () => {
        const { result } = renderHook(() => useTestSession('test-1', data));

        await act(async () => {
            await result.current.handleSubmit();
        });

        expect(gradingMock.submitTest).toHaveBeenCalledWith('test-1');
        expect(mockUseNavigate).toHaveBeenCalledWith(
            '/topic-test-result/test-1',
            {
                replace: true,
            }
        );
        expect(result.current.status).toBe('completed');
    });

    it('does not re-submit when session is already completed', async () => {
        mockGetTestSession.mockResolvedValueOnce({
            session: { status: 'completed' },
        });
        const { result } = renderHook(() => useTestSession('test-1', data));

        await act(async () => {
            await result.current.handleSubmit();
        });

        expect(gradingMock.submitTest).not.toHaveBeenCalled();
        expect(mockUseNavigate).toHaveBeenCalledWith(
            '/topic-test-result/test-1',
            {
                replace: true,
            }
        );
    });

    it('sets status to error when submitTest rejects', async () => {
        gradingMock.submitTest.mockRejectedValueOnce(new Error('network'));
        const { result } = renderHook(() => useTestSession('test-1', data));

        await act(async () => {
            await result.current.handleSubmit();
        });

        expect(result.current.status).toBe('error');
        expect(mockUseNavigate).not.toHaveBeenCalled();
    });

    it('auto-submits exactly once when the timer expires', async () => {
        const { rerender } = renderHook(() => useTestSession('test-1', data));

        await act(async () => {
            timerState = {
                secondsRemaining: 0,
                isExpired: true,
                timeDisplay: '00:00',
            };
            rerender();
            await Promise.resolve();
        });

        expect(gradingMock.submitTest).toHaveBeenCalledTimes(1);
    });

    it('heartbeat fires immediately on mount and again every 60s', async () => {
        renderHook(() => useTestSession('test-1', data));

        await act(async () => {
            await Promise.resolve();
        });
        expect(mockUpdateTestTime).toHaveBeenCalledTimes(1);
        expect(mockUpdateTestTime).toHaveBeenCalledWith('test-1', 300);

        await act(async () => {
            vi.advanceTimersByTime(60000);
            await Promise.resolve();
        });
        expect(mockUpdateTestTime).toHaveBeenCalledTimes(2);
    });

    it('upserts dirty attempts with 1-based attempt_order recalculated from the question list', async () => {
        mockGetPendingAttempts.mockResolvedValueOnce([
            {
                session_id: 'test-1',
                question_id: 'q2',
                attempt_order: 999,
                user_answer: [0],
                marked_for_review: false,
                status: 'answered',
                score: 0,
                time_spent_seconds: 10,
                is_synced: 0,
            } as Attempt,
        ]);

        renderHook(() => useTestSession('test-1', data));
        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
        });

        expect(mockUpsertAttempts).toHaveBeenCalledWith([
            expect.objectContaining({
                question_id: 'q2',
                attempt_order: 2,
                time_spent_seconds: 10,
            }),
        ]);
        expect(mockMarkAttemptsSynced).toHaveBeenCalled();
    });

    it('does not mark attempts synced if upsert fails', async () => {
        mockGetPendingAttempts.mockResolvedValueOnce([
            {
                session_id: 'test-1',
                question_id: 'q1',
                attempt_order: 1,
                user_answer: null,
                marked_for_review: false,
                status: 'viewed',
                score: 0,
                time_spent_seconds: 0,
                is_synced: 0,
            } as Attempt,
        ]);
        mockUpsertAttempts.mockResolvedValueOnce({ error: 'boom' });

        renderHook(() => useTestSession('test-1', data));
        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
        });

        expect(mockMarkAttemptsSynced).not.toHaveBeenCalled();
    });

    it('stops heartbeating once the test is completed', async () => {
        const { result } = renderHook(() => useTestSession('test-1', data));

        await act(async () => {
            await result.current.handleSubmit();
        });
        expect(result.current.status).toBe('completed');

        mockUpdateTestTime.mockClear();
        await act(async () => {
            vi.advanceTimersByTime(120000);
            await Promise.resolve();
        });

        expect(mockUpdateTestTime).not.toHaveBeenCalled();
    });

    it('persists remaining time to storage every 5s-aligned tick', () => {
        renderHook(() => useTestSession('test-1', data));
        expect(mockUpdateSessionTimeAndStatus).toHaveBeenCalledWith(
            'test-1',
            300,
            'ready'
        );
    });

    it('flushes remaining time to storage on unmount', async () => {
        const { unmount } = renderHook(() => useTestSession('test-1', data));
        mockUpdateSessionTimeAndStatus.mockClear();

        unmount();
        await act(async () => {
            await Promise.resolve();
        });

        expect(mockUpdateSessionTimeAndStatus).toHaveBeenCalledWith(
            'test-1',
            300,
            'ready'
        );
    });
});
