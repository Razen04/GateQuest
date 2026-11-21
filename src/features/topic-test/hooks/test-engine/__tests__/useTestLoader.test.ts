import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { mockGetTestSession } = vi.hoisted(() => ({
    mockGetTestSession: vi.fn(),
}));

vi.mock('@/features/topic-test/services/testSession', () => ({
    getTestSession: mockGetTestSession,
}));

import useTestLoader from '@/features/topic-test/hooks/test-engine/useTestLoader';

describe('useTestLoader', () => {
    afterEach(() => vi.clearAllMocks());

    it('loads data and clears loading on success', async () => {
        const session = { remaining_time_seconds: 300 };
        const questions = [{ id: 'q1' }];
        const attempts: any[] = [];
        mockGetTestSession.mockResolvedValueOnce({
            session,
            questions,
            attempts,
        });

        const { result } = renderHook(() => useTestLoader('test-1'));

        expect(result.current.loading).toBe(true);
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.data).toEqual({ session, questions, attempts });
    });

    it('clears loading when getTestSession returns null', async () => {
        mockGetTestSession.mockResolvedValueOnce(null);
        const { result } = renderHook(() => useTestLoader('test-1'));
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.data).toBeNull();
    });

    it('does not set state after unmount', async () => {
        let resolve: any;
        mockGetTestSession.mockReturnValueOnce(
            new Promise((r) => (resolve = r))
        );
        const { result, unmount } = renderHook(() => useTestLoader('test-1'));
        unmount();
        resolve({ session: {}, questions: [], attempts: [] });
        await act(async () => {
            await Promise.resolve();
        });
        expect(result.current.data).toBeNull();
    });
});
