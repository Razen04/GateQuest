import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
    mockGetOngoingTestSession,
    mockGetCompletedTestSessions,
    mockCacheTestSessions,
    mockPruneLocalHistory,
    mockFetchTestHistory,
    mockGetActiveTest,
    mockSyncTestFromSupabaseToDexie,
} = vi.hoisted(() => ({
    mockGetOngoingTestSession: vi.fn(),
    mockGetCompletedTestSessions: vi.fn(),
    mockCacheTestSessions: vi.fn(),
    mockPruneLocalHistory: vi.fn(),
    mockFetchTestHistory: vi.fn(),
    mockGetActiveTest: vi.fn(),
    mockSyncTestFromSupabaseToDexie: vi.fn(),
}));

vi.mock('@/features/topic-test/services/testSession', () => ({
    getOngoingTestSession: mockGetOngoingTestSession,
    getCompletedTestSessions: mockGetCompletedTestSessions,
    cacheTestSessions: mockCacheTestSessions,
    pruneLocalHistory: mockPruneLocalHistory,
}));

vi.mock('@/features/topic-test/api/topicTest', () => ({
    TEST_HISTORY_PAGE_SIZE: 10,
    fetchTestHistory: mockFetchTestHistory,
    getActiveTest: mockGetActiveTest,
}));

vi.mock('@/features/topic-test/services/testSyncService', () => ({
    syncTestFromSupabaseToDexie: mockSyncTestFromSupabaseToDexie,
}));

import useTopicTestHubData from '@/features/topic-test/hooks/useTopicTestHubData';

const session = (id: string) => ({ id }) as any;

describe('useTopicTestHubData', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mockGetActiveTest.mockResolvedValue({
            data: null,
            error: null,
        });

        mockGetOngoingTestSession.mockResolvedValue([]);
        mockGetCompletedTestSessions.mockResolvedValue([]);
        mockCacheTestSessions.mockResolvedValue(undefined);
        mockPruneLocalHistory.mockResolvedValue(0);
        mockFetchTestHistory.mockResolvedValue({
            data: [],
            error: null,
        });
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
        mockGetActiveTest.mockResolvedValue({
            data: {
                id: 'active-synced',
                paper_id: 'topic-test-1',
            },
            error: null,
        });

        mockGetOngoingTestSession.mockResolvedValue([session('active-synced')]);

        const { result } = renderHook(() =>
            useTopicTestHubData('user-1', 'branch-A')
        );

        await waitFor(() => {
            expect(mockGetActiveTest).toHaveBeenCalled();
            expect(mockSyncTestFromSupabaseToDexie).toHaveBeenCalled();
        });

        await waitFor(() => {
            expect(result.current.activeTest).toEqual(session('active-synced'));
        });
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

    it('hides embargoed mock attempts and never caches them', async () => {
        const embargoed = {
            id: 'mock-live',
            paper_id: 'mock-cs-01',
            mock_ends_at: new Date(Date.now() + 3_600_000).toISOString(),
        };
        const released = {
            id: 'mock-old',
            paper_id: 'mock-cs-01',
            mock_ends_at: new Date(Date.now() - 3_600_000).toISOString(),
        };

        mockFetchTestHistory.mockResolvedValueOnce({
            data: [embargoed, released],
            error: null,
        });
        mockGetCompletedTestSessions.mockResolvedValueOnce([
            embargoed,
            released,
        ]);

        const { result } = renderHook(() =>
            useTopicTestHubData('user-1', 'branch-A')
        );

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(mockCacheTestSessions).toHaveBeenCalledWith([released]);
        expect(result.current.history.map((s: any) => s.id)).toEqual([
            'mock-old',
        ]);
    });

    it('hides embargoed mocks from the local fallback too', async () => {
        mockFetchTestHistory.mockResolvedValueOnce({
            data: null,
            error: 'boom',
        });
        mockGetCompletedTestSessions.mockResolvedValueOnce([
            {
                id: 'mock-live',
                paper_id: 'mock-cs-01',
                mock_ends_at: new Date(Date.now() + 3_600_000).toISOString(),
            },
            {
                id: 'topic-1',
                paper_id: 'pyq-cs-2024',
            },
        ]);

        const { result } = renderHook(() =>
            useTopicTestHubData('user-1', 'branch-A')
        );

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.history.map((s: any) => s.id)).toEqual([
            'topic-1',
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

    it('requests a single page of 10 for free users and prunes the local mirror', async () => {
        mockFetchTestHistory.mockResolvedValueOnce({
            data: Array.from({ length: 10 }, (_, i) => session(`h${i}`)),
            error: null,
        });

        const { result } = renderHook(() =>
            useTopicTestHubData('user-1', 'branch-A')
        );

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(mockFetchTestHistory).toHaveBeenCalledWith(
            'user-1',
            'branch-A',
            { limit: 10, offset: 0 }
        );
        expect(mockPruneLocalHistory).toHaveBeenCalledWith('branch-A', 10);
        expect(result.current.hasMore).toBe(false);
    });

    it('requests one extra row for donors and offers load more', async () => {
        mockFetchTestHistory.mockResolvedValueOnce({
            data: Array.from({ length: 11 }, (_, i) => session(`h${i}`)),
            error: null,
        });

        const { result } = renderHook(() =>
            useTopicTestHubData('user-1', 'branch-A', 1)
        );

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(mockFetchTestHistory).toHaveBeenCalledWith(
            'user-1',
            'branch-A',
            { limit: 11, offset: 0 }
        );
        expect(mockPruneLocalHistory).toHaveBeenCalledWith('branch-A', null);
        expect(result.current.history).toHaveLength(10);
        expect(result.current.hasMore).toBe(true);
    });

    it('appends the next page when a donor loads more', async () => {
        mockFetchTestHistory
            .mockResolvedValueOnce({
                data: Array.from({ length: 11 }, (_, i) => session(`h${i}`)),
                error: null,
            })
            .mockResolvedValueOnce({
                data: [session('h10')],
                error: null,
            });

        const { result } = renderHook(() =>
            useTopicTestHubData('user-1', 'branch-A', 1)
        );

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.hasMore).toBe(true);

        await act(async () => {
            await result.current.loadMore();
        });

        expect(mockFetchTestHistory).toHaveBeenLastCalledWith(
            'user-1',
            'branch-A',
            { limit: 11, offset: 10 }
        );
        expect(result.current.history.map((s: any) => s.id)).toEqual([
            ...Array.from({ length: 10 }, (_, i) => `h${i}`),
            'h10',
        ]);
        expect(result.current.hasMore).toBe(false);
    });

    it('merges only unsynced local sessions into a donor page', async () => {
        mockFetchTestHistory.mockResolvedValueOnce({
            data: [session('server-1')],
            error: null,
        });
        mockGetCompletedTestSessions.mockResolvedValueOnce([
            session('server-1'),
            { id: 'local-synced', is_synced: 1 },
            { id: 'local-unsynced', is_synced: 0 },
        ]);

        const { result } = renderHook(() =>
            useTopicTestHubData('user-1', 'branch-A', 1)
        );

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.history.map((s: any) => s.id)).toEqual([
            'server-1',
            'local-unsynced',
        ]);
    });
});
