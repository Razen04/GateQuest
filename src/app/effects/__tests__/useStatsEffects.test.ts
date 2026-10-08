import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
    updateStatsMock,
    setLoadingMock,
    fetchCurrentSetMock,
    mockUserGoalRef,
    mockCurrentSetRef,
} = vi.hoisted(() => ({
    updateStatsMock: vi.fn().mockResolvedValue(undefined),
    setLoadingMock: vi.fn(),
    fetchCurrentSetMock: vi.fn().mockResolvedValue(undefined),
    mockUserGoalRef: { current: null as unknown },
    mockCurrentSetRef: {
        current: { set_id: 'set-1' } as { set_id: string } | null,
    },
}));

vi.mock('@/app/stores/useStatsStore', () => ({
    useStatsStore: {
        getState: () => ({
            updateStats: updateStatsMock,
            setLoading: setLoadingMock,
        }),
    },
}));

vi.mock('@/app/stores/useGoalStore', () => ({
    useGoalStore: <T>(selector: (s: { userGoal: unknown }) => T): T =>
        selector({ userGoal: mockUserGoalRef.current }),
}));

vi.mock('@/features/smart-revision/hooks/useSmartRevision', () => ({
    default: () => ({
        currentSet: mockCurrentSetRef.current,
        fetchCurrentSet: fetchCurrentSetMock,
    }),
}));

import { useStatsEffects } from '../useStatsEffects';

beforeEach(() => {
    vi.clearAllMocks();
    mockUserGoalRef.current = null;
    mockCurrentSetRef.current = { set_id: 'set-1' };
});

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});

describe('initial fetch', () => {
    it('calls updateStats even for guests — the store handles the guard', () => {
        renderHook(() => useStatsEffects());
        expect(updateStatsMock).toHaveBeenCalledTimes(1);
        // setLoading is not called from the hook; the store handles loading internally
        expect(setLoadingMock).not.toHaveBeenCalled();
    });

    it('calls updateStats even when there is no local profile', () => {
        renderHook(() => useStatsEffects());
        expect(updateStatsMock).toHaveBeenCalledTimes(1);
    });

    it('fetches stats for a signed-in user', () => {
        renderHook(() => useStatsEffects());

        expect(updateStatsMock).toHaveBeenCalledTimes(1);
        expect(setLoadingMock).not.toHaveBeenCalled();
    });

    it('re-fetches when the user goal contents change', () => {
        mockUserGoalRef.current = {
            id: 'goal-1',
            branch_id: 'cs',
            target_exams: ['gate'],
            additional_subjects: null,
        };

        const { rerender } = renderHook(() => useStatsEffects());
        expect(updateStatsMock).toHaveBeenCalledTimes(1);

        // Same id, same branch — but a different exam set.
        // This is what happens when the user edits their goal without changing branch.
        mockUserGoalRef.current = {
            id: 'goal-1',
            branch_id: 'cs',
            target_exams: ['gate', 'ese'],
            additional_subjects: null,
        };
        rerender();

        expect(updateStatsMock).toHaveBeenCalledTimes(2);
    });

    it('does not re-fetch when the goal is refetched with identical content', () => {
        const goal = {
            id: 'goal-1',
            branch_id: 'cs',
            target_exams: ['gate'],
            additional_subjects: null,
        };
        mockUserGoalRef.current = goal;

        const { rerender } = renderHook(() => useStatsEffects());
        expect(updateStatsMock).toHaveBeenCalledTimes(1);

        // New object reference, same content — e.g. Supabase refetched the same row.
        mockUserGoalRef.current = { ...goal };
        rerender();

        expect(updateStatsMock).toHaveBeenCalledTimes(1); // NOT 2
    });

    it('re-fetches when the current set changes', () => {
        const { rerender } = renderHook(() => useStatsEffects());
        expect(updateStatsMock).toHaveBeenCalledTimes(1);

        mockCurrentSetRef.current = { set_id: 'set-2' };
        rerender();

        expect(updateStatsMock).toHaveBeenCalledTimes(2);
    });

    it('does not re-fetch on re-render when neither dep changed', () => {
        const { rerender } = renderHook(() => useStatsEffects());
        expect(updateStatsMock).toHaveBeenCalledTimes(1);

        rerender(); // same deps → effect must not re-run

        expect(updateStatsMock).toHaveBeenCalledTimes(1);
    });
});

describe('event listeners', () => {
    it('calls fetchCurrentSet when REVISION_UPDATED is dispatched', () => {
        renderHook(() => useStatsEffects());
        fetchCurrentSetMock.mockClear();

        act(() => {
            window.dispatchEvent(new Event('REVISION_UPDATED'));
        });

        expect(fetchCurrentSetMock).toHaveBeenCalledTimes(1);
    });

    it('calls updateStats when STATS_UPDATED is dispatched', () => {
        renderHook(() => useStatsEffects());

        // Effect 1 fires updateStats on mount. Zero it so any subsequent call
        // is attributable to the listener, not the mount.
        updateStatsMock.mockClear();

        act(() => {
            window.dispatchEvent(new Event('STATS_UPDATED'));
        });

        expect(updateStatsMock).toHaveBeenCalledTimes(1);
    });

    it('detaches listeners on unmount', () => {
        const { unmount } = renderHook(() => useStatsEffects());

        // Ignore the mount-time fetch.
        fetchCurrentSetMock.mockClear();
        updateStatsMock.mockClear();

        unmount();

        act(() => {
            window.dispatchEvent(new Event('REVISION_UPDATED'));
            window.dispatchEvent(new Event('STATS_UPDATED'));
        });

        expect(fetchCurrentSetMock).not.toHaveBeenCalled();
        expect(updateStatsMock).not.toHaveBeenCalled();
    });
});
