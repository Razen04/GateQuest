import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
    mockGetOngoingTestSession,
    mockGetCompletedTestSessions,
    mockCacheTestSessions,
    mockFetchTestHistory,
    mockSyncTestFromSupabaseToDexie,
} = vi.hoisted(() => ({
    mockGetOngoingTestSession: vi.fn(),
    mockGetCompletedTestSessions: vi.fn(),
    mockCacheTestSessions: vi.fn(),
    mockFetchTestHistory: vi.fn(),
    mockSyncTestFromSupabaseToDexie: vi.fn(),
}));

vi.mock('@/features/topic-test/services/testSession', () => ({
    getOngoingTestSession: mockGetOngoingTestSession,
    getCompletedTestSessions: mockGetCompletedTestSessions,
    cacheTestSessions: mockCacheTestSessions,
}));

vi.mock('@/features/topic-test/api/topicTest', () => ({
    fetchTestHistory: mockFetchTestHistory,
}));

vi.mock('@/features/topic-test/services/testSyncService', () => ({
    syncTestFromSupabaseToDexie: mockSyncTestFromSupabaseToDexie,
}));

import useTopicTestHubData from '@/features/topic-test/hooks/useTopicTestHubData';

const session = (id: string) => ({ id }) as any;

describe('useTopicTestHubData', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGetOngoingTestSession.mockResolvedValue([]);
        mockGetCompletedTestSessions.mockResolvedValue([]);
        mockCacheTestSessions.mockResolvedValue(undefined);
        mockFetchTestHistory.mockResolvedValue({ data: [], error: null });
        mockSyncTestFromSupabaseToDexie.mockResolvedValue(undefined);
    });

    it('uses the local ongoing session when present and skips sync', async () => {
        mockGetOngoingTestSession.mockResolvedValueOnce([session('active-1')]);
        mockGetCompletedTestSessions.mockResolvedValueOnce([session('h-1')]);
        mockFetchTestHistory.mockResolvedValueOnce({
            data: [session('h-1')],
            error: null,
        });

        const { result } = renderHook(() =>
            useTopicTestHubData('user-1', 'branch-A')
        );

        expect(result.current.loading).toBe(true);
        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.activeTest).toEqual(session('active-1'));
        expect(mockSyncTestFromSupabaseToDexie).not.toHaveBeenCalled();
        expect(result.current.history).toHaveLength(1);
    });

    it('syncs from Supabase when there is no local ongoing session', async () => {
        mockGetOngoingTestSession
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([session('active-synced')]);

        const { result } = renderHook(() =>
            useTopicTestHubData('user-1', 'branch-A')
        );

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(mockSyncTestFromSupabaseToDexie).toHaveBeenCalledWith(
            'user-1',
            'branch-A'
        );
        expect(result.current.activeTest).toEqual(session('active-synced'));
    });

    it('falls back to local history when the server call errors', async () => {
        mockFetchTestHistory.mockResolvedValueOnce({
            data: null,
            error: 'boom',
        });
        mockGetCompletedTestSessions.mockResolvedValueOnce([
            session('h1'),
            session('h2'),
        ]);

        const { result } = renderHook(() =>
            useTopicTestHubData('user-1', 'branch-A')
        );

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(mockCacheTestSessions).not.toHaveBeenCalled();
        expect(result.current.history.map((s: any) => s.id)).toEqual([
            'h1',
            'h2',
        ]);
    });

    it('caches server results and reads the merged local set', async () => {
        mockFetchTestHistory.mockResolvedValueOnce({
            data: [session('h1')],
            error: null,
        });
        mockGetCompletedTestSessions.mockResolvedValueOnce([
            session('h1'),
            session('h0-local'),
        ]);

        const { result } = renderHook(() =>
            useTopicTestHubData('user-1', 'branch-A')
        );

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(mockCacheTestSessions).toHaveBeenCalledWith([session('h1')]);
        expect(result.current.history.map((s: any) => s.id)).toEqual([
            'h1',
            'h0-local',
        ]);
    });

    it('caps history at 10 entries', async () => {
        const many = Array.from({ length: 12 }, (_, i) => session(`h${i}`));
        mockGetCompletedTestSessions.mockResolvedValueOnce(many);

        const { result } = renderHook(() =>
            useTopicTestHubData('user-1', 'branch-A')
        );

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.history).toHaveLength(10);
    });

    it('does not crash when userId is missing (documents current behaviour)', async () => {
        const { result } = renderHook(() =>
            useTopicTestHubData(undefined, 'branch-A')
        );

        await act(async () => {
            await Promise.resolve();
        });
        expect(result.current.loading).toBe(true);
        expect(result.current.activeTest).toBeNull();
        expect(result.current.history).toEqual([]);
    });

    it('resets stale history while a new branch is loading', async () => {
        mockGetCompletedTestSessions
            .mockResolvedValueOnce([session('branch-A-history')])
            .mockReturnValueOnce(new Promise(() => {})); // B never resolves
        mockFetchTestHistory
            .mockResolvedValueOnce({
                data: [session('branch-A-history')],
                error: null,
            })
            .mockReturnValueOnce(new Promise(() => {})); // B never resolves

        const { result, rerender } = renderHook(
            ({ branchId }) => useTopicTestHubData('user-1', branchId),
            { initialProps: { branchId: 'branch-A' } }
        );
        await waitFor(() =>
            expect(result.current.history.map((s: any) => s.id)).toEqual([
                'branch-A-history',
            ])
        );

        rerender({ branchId: 'branch-B' });
        await act(async () => {
            await Promise.resolve();
        });

        expect(result.current.history).toEqual([]);
    });

    it('does not update state after unmount', async () => {
        let resolveHistory: (v: any) => void = () => {};
        mockFetchTestHistory.mockReturnValueOnce(
            new Promise((r) => (resolveHistory = r))
        );

        const { result, unmount } = renderHook(() =>
            useTopicTestHubData('user-1', 'branch-A')
        );
        unmount();

        await act(async () => {
            resolveHistory({ data: [session('late')], error: null });
            await Promise.resolve();
        });

        // documents: no state update after unmount
        expect(result.current.history).toEqual([]);
    });

    it('fetches fresh history from the server even when local Dexie already has rows', async () => {
        mockGetCompletedTestSessions.mockResolvedValue([session('local-1')]);
        mockFetchTestHistory.mockResolvedValueOnce({
            data: [session('server-1'), session('local-1')],
            error: null,
        });

        renderHook(() => useTopicTestHubData('user-1', 'branch-A'));
        await waitFor(() => expect(mockFetchTestHistory).toHaveBeenCalled());
    });
});
