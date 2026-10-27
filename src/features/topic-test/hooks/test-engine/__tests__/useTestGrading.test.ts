import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGetTestSession, mockUpdateAttempts, mockSubmitTestGrading } =
    vi.hoisted(() => ({
        mockGetTestSession: vi.fn(),
        mockUpdateAttempts: vi.fn(),
        mockSubmitTestGrading: vi.fn(),
    }));

vi.mock('@/features/topic-test/services/testSession', () => ({
    getTestSession: mockGetTestSession,
    updateAttempts: mockUpdateAttempts,
}));

// ✅ alias path — matches what the hook actually imports
vi.mock('@/features/topic-test/api/topicTest', () => ({
    submitTestGrading: mockSubmitTestGrading,
}));

import useTestGrading from '@/features/topic-test/hooks/test-engine/useTestGrading';

const okResult = { total_score: 10, correct_count: 5, incorrect_count: 3 };

describe('useTestGrading', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mockGetTestSession.mockResolvedValue({
            session: { remaining_time_seconds: 300 },
            attempts: [{ question_id: 'q1' }],
        });

        mockUpdateAttempts.mockResolvedValue({ error: null });
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    it('submits, updates attempts, dispatches STATS_UPDATED, and returns totals', async () => {
        mockSubmitTestGrading.mockResolvedValueOnce({
            data: okResult,
            error: null,
        });

        const dispatch = vi.spyOn(window, 'dispatchEvent');
        const { result } = renderHook(() => useTestGrading());

        let returned: any;
        await act(async () => {
            returned = await result.current.submitTest('test-1');
        });

        expect(mockSubmitTestGrading).toHaveBeenCalledWith(
            'test-1',
            expect.any(Array),
            300
        );
        expect(mockUpdateAttempts).toHaveBeenCalledWith('test-1', [], 8, 10, 5);
        expect(dispatch).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'STATS_UPDATED' })
        );
        expect(returned).toEqual({
            totalScore: 10,
            correctCount: 5,
            incorrectCount: 3,
        });
        expect(result.current.isSubmitting).toBe(false);
    });

    it('throws when getTestSession returns null', async () => {
        mockGetTestSession.mockResolvedValueOnce(null);
        const { result } = renderHook(() => useTestGrading());
        await expect(result.current.submitTest('test-1')).rejects.toThrow(
            'No test session present'
        );
    });

    it('retries on { error } responses with backoff and then succeeds', async () => {
        vi.useFakeTimers();

        mockSubmitTestGrading
            .mockResolvedValueOnce({ error: 'transient' })
            .mockResolvedValueOnce({ data: okResult, error: null });

        const { result } = renderHook(() => useTestGrading());

        await act(async () => {
            const p = result.current.submitTest('test-1');
            await vi.runAllTimersAsync();
            await p;
        });

        expect(mockSubmitTestGrading).toHaveBeenCalledTimes(2);
    });

    it('throws after retry exhaustion (3 calls total)', async () => {
        vi.useFakeTimers();

        mockSubmitTestGrading.mockResolvedValue({ error: 'persistent' });

        const { result } = renderHook(() => useTestGrading());

        let caught: unknown;
        await act(async () => {
            const p = result.current.submitTest('test-1').catch((error) => {
                caught = error;
            });
            await vi.runAllTimersAsync();
            await p;
        });

        expect(caught).toBe('persistent');
        expect(mockSubmitTestGrading).toHaveBeenCalledTimes(3);
    });

    it('does not retry when submitTestGrading rejects', async () => {
        mockSubmitTestGrading.mockRejectedValueOnce(new Error('boom'));
        const { result } = renderHook(() => useTestGrading());
        await expect(result.current.submitTest('test-1')).rejects.toThrow(
            'boom'
        );
        expect(mockSubmitTestGrading).toHaveBeenCalledTimes(1);
    });

    it('toggles isSubmitting while in flight', async () => {
        let resolveSubmit: any;
        mockSubmitTestGrading.mockReturnValueOnce(
            new Promise((r) => (resolveSubmit = r))
        );

        const { result } = renderHook(() => useTestGrading());
        let p: any;
        act(() => {
            p = result.current.submitTest('test-1');
        });
        expect(result.current.isSubmitting).toBe(true);

        await act(async () => {
            resolveSubmit({ data: okResult, error: null });
            await p;
        });
        expect(result.current.isSubmitting).toBe(false);
    });
});
