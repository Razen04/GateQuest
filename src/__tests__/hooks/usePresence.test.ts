import { getUserProfile } from '@/helper';
import { usePresence } from '@/hooks/usePresence';
import { supabase } from '@/utils/supabaseClient';
import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

// Mocking the external dependencies
vi.mock('@/utils/supabaseClient', () => ({
    supabase: {
        channel: vi.fn(),
    },
}));

vi.mock('@/helper', () => ({
    getUserProfile: vi.fn(),
}));

describe('usePresence hook', () => {
    let mockChannel: {
        on: Mock;
        subscribe: Mock;
        unsubscribe: Mock;
        track: Mock;
        presenceState: Mock;
    };
    let syncCallback: () => void;

    beforeEach(() => {
        vi.clearAllMocks();

        // mockChannel to copy supabase behavior
        mockChannel = {
            on: vi.fn().mockReturnThis(),
            subscribe: vi.fn((cb: (status: string) => void) => {
                cb('SUBSCRIBED');
                return mockChannel;
            }),
            unsubscribe: vi.fn(),
            track: vi.fn().mockResolvedValue('ok'),
            presenceState: vi.fn().mockResolvedValue({}),
        };

        mockChannel.on.mockImplementation((_type, config, callback) => {
            if (config.event === 'sync') syncCallback = callback;
            return mockChannel;
        });
        (supabase.channel as Mock).mockReturnValue(mockChannel);
        (getUserProfile as Mock).mockReturnValue({ id: 'user-1' });
    });

    it('should initialize the count as undefined', () => {
        const { result } = renderHook(() => usePresence('test'));
        expect(result.current.count).toBeUndefined();
    });

    it('should subscribe and track user on mount', async () => {
        renderHook(() => usePresence('test'));

        expect(supabase.channel).toHaveBeenCalledWith('presence:test', expect.any(Object));
        expect(mockChannel.subscribe).toHaveBeenCalled();

        await act(async () => {
            expect(mockChannel.track).toHaveBeenCalledWith(
                expect.objectContaining({
                    user_id: 'user-1',
                }),
            );
        });
    });

    it('should update count when presence syncs', () => {
        const { result } = renderHook(() => usePresence('test'));

        mockChannel.presenceState.mockReturnValue({
            'user-1': [{ user_id: '1' }],
            'user-2': [{ user_id: '2' }],
        });

        act(() => {
            if (syncCallback) syncCallback();
        });

        expect(result.current.count).toBe(2);
    });

    it('should unsubscribe on unmount', () => {
        const { unmount } = renderHook(() => usePresence('test'));
        unmount();
        expect(mockChannel.unsubscribe).toHaveBeenCalled();
    });
});
