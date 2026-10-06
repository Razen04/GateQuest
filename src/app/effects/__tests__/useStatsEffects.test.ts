import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
    updateStatsMock,
    setLoadingMock,
    fetchCurrentSetMock,
    mockUserGoalRef,
    mockCurrentSetRef,
    getUserProfileMock,
} = vi.hoisted(() => ({
    updateStatsMock: vi.fn().mockResolvedValue(undefined),
    setLoadingMock: vi.fn(),
    fetchCurrentSetMock: vi.fn().mockResolvedValue(undefined),
    mockUserGoalRef: { current: null as unknown },
    mockCurrentSetRef: {
        current: { set_id: 'set-1' } as { set_id: string } | null,
    },
    getUserProfileMock: vi.fn(),
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

vi.mock('@/shared/utils/helper', () => ({
    getUserProfile: getUserProfileMock,
}));

import { useStatsEffects } from '../useStatsEffects';

const signedInProfile = { id: 'u1', version_number: 1 };

beforeEach(() => {
    vi.clearAllMocks();
    getUserProfileMock.mockReturnValue(null);
    mockUserGoalRef.current = null;
    mockCurrentSetRef.current = { set_id: 'set-1' };
});

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});

describe('initial fetch', () => {
    it('sets loading false and does not fetch when there is no profile', () => {
        getUserProfileMock.mockReturnValue(null);

        renderHook(() => useStatsEffects());

        expect(setLoadingMock).toHaveBeenCalledWith(false);
        expect(updateStatsMock).not.toHaveBeenCalled();
    });

    it('sets loading false and does not fetch for the guest user (id "1")', () => {
        getUserProfileMock.mockReturnValue({ id: '1', version_number: 1 });

        renderHook(() => useStatsEffects());

        expect(setLoadingMock).toHaveBeenCalledWith(false);
        expect(updateStatsMock).not.toHaveBeenCalled();
    });

    it('fetches stats for a signed-in user', () => {
        getUserProfileMock.mockReturnValue(signedInProfile);

        renderHook(() => useStatsEffects());

        expect(updateStatsMock).toHaveBeenCalledTimes(1);
        expect(setLoadingMock).not.toHaveBeenCalled();
    });

    it('re-fetches when the user goal changes', () => {
        getUserProfileMock.mockReturnValue(signedInProfile);

        const { rerender } = renderHook(() => useStatsEffects());
        expect(updateStatsMock).toHaveBeenCalledTimes(1);

        // Change the goal the mocked selector will return, then re-render.
        mockUserGoalRef.current = { branch_id: 'cs' };
        rerender();

        expect(updateStatsMock).toHaveBeenCalledTimes(2);
    });

    it('re-fetches when the current set changes', () => {
        getUserProfileMock.mockReturnValue(signedInProfile);

        const { rerender } = renderHook(() => useStatsEffects());
        expect(updateStatsMock).toHaveBeenCalledTimes(1);

        mockCurrentSetRef.current = { set_id: 'set-2' };
        rerender();

        expect(updateStatsMock).toHaveBeenCalledTimes(2);
    });

    it('does not re-fetch on re-render when neither dep changed', () => {
        getUserProfileMock.mockReturnValue(signedInProfile);

        const { rerender } = renderHook(() => useStatsEffects());
        expect(updateStatsMock).toHaveBeenCalledTimes(1);

        rerender(); // same deps → effect must not re-run

        expect(updateStatsMock).toHaveBeenCalledTimes(1);
    });
});

describe('event listeners', () => {
    it('calls fetchCurrentSet when REVISION_UPDATED is dispatched', () => {
        getUserProfileMock.mockReturnValue(null); // keep effect 1 quiet
        renderHook(() => useStatsEffects());

        act(() => {
            window.dispatchEvent(new Event('REVISION_UPDATED'));
        });

        expect(fetchCurrentSetMock).toHaveBeenCalledTimes(1);
    });

    it('calls updateStats when STATS_UPDATED is dispatched', () => {
        getUserProfileMock.mockReturnValue(null);
        renderHook(() => useStatsEffects());

        // Effect 1 did not call it (no profile). So any call here comes
        // from the listener.
        expect(updateStatsMock).not.toHaveBeenCalled();

        act(() => {
            window.dispatchEvent(new Event('STATS_UPDATED'));
        });

        expect(updateStatsMock).toHaveBeenCalledTimes(1);
    });

    it('detaches listeners on unmount', () => {
        getUserProfileMock.mockReturnValue(null);
        const { unmount } = renderHook(() => useStatsEffects());

        unmount();

        act(() => {
            window.dispatchEvent(new Event('REVISION_UPDATED'));
            window.dispatchEvent(new Event('STATS_UPDATED'));
        });

        expect(fetchCurrentSetMock).not.toHaveBeenCalled();
        expect(updateStatsMock).not.toHaveBeenCalled();
    });
});
