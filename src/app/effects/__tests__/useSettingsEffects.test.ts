import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/shared/utils/helper', () => ({
    syncUserToSupabase: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/shared/utils/supabaseClient', () => ({
    supabase: {
        auth: { onAuthStateChange: vi.fn(), signOut: vi.fn() },
        from: vi.fn(),
        rpc: vi.fn(),
    },
}));

import { useAuthStore } from '@/app/stores/useAuthStore';
import { useSettingsStore } from '@/app/stores/useSettingsStore';
import { syncUserToSupabase } from '@/shared/utils/helper';
import { useSettingsEffects } from '../useSettingsEffects';

const initialSettings = useSettingsStore.getState().settings;

function grantTier(tier: 0 | 1 | 2 | 3) {
    useAuthStore.setState(
        {
            user: {
                id: 'u1',
                notification_tags:
                    tier > 0 ? ['role:donor', `donor:tier-${tier}`] : [],
            } as never,
        },
        false
    );
}

beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    useAuthStore.setState({ user: null }, false);
    useSettingsStore.setState(
        { settings: { ...initialSettings }, isUpdatingSettings: false },
        false
    );

    document.documentElement.classList.remove('dark', 'amoled');
    document.documentElement.style.colorScheme = '';
    localStorage.removeItem('theme');
});

afterEach(() => {
    cleanup();
    vi.useRealTimers();
});

describe('debounced supabase sync', () => {
    const signedIn = { id: 'u1' };

    it('does not sync when logged out', () => {
        renderHook(() => useSettingsEffects());

        act(() => {
            useSettingsStore.getState().setSetting('sound', false);
        });

        act(() => {
            vi.advanceTimersByTime(1500);
        });

        expect(syncUserToSupabase).not.toHaveBeenCalled();
    });

    it('syncs once after 1500ms when logged in and settings change', () => {
        useAuthStore.setState({ user: signedIn as never }, false);
        renderHook(() => useSettingsEffects());

        act(() => {
            useSettingsStore.getState().setSetting('sound', false);
        });

        expect(syncUserToSupabase).not.toHaveBeenCalled();

        act(() => {
            vi.advanceTimersByTime(1500);
        });

        expect(syncUserToSupabase).toHaveBeenCalledTimes(1);
        expect(syncUserToSupabase).toHaveBeenCalledWith(true);
    });

    it('debounces rapid changes into a single sync', () => {
        useAuthStore.setState({ user: signedIn as never }, false);
        renderHook(() => useSettingsEffects());

        act(() => {
            useSettingsStore.getState().setSetting('sound', false);
            vi.advanceTimersByTime(1000);
            useSettingsStore.getState().setSetting('mode', 'light');
            vi.advanceTimersByTime(1000);
            useSettingsStore.getState().setSetting('autoTimer', false);
        });

        expect(syncUserToSupabase).not.toHaveBeenCalled();

        act(() => {
            vi.advanceTimersByTime(1500);
        });

        expect(syncUserToSupabase).toHaveBeenCalledTimes(1);
    });

    it('sets isUpdatingSettings true during the sync and false after it resolves', async () => {
        useAuthStore.setState({ user: signedIn as never }, false);

        let resolveSync!: () => void;
        (syncUserToSupabase as ReturnType<typeof vi.fn>).mockReturnValue(
            new Promise<void>((res) => {
                resolveSync = res;
            })
        );

        renderHook(() => useSettingsEffects());

        await act(async () => {
            useSettingsStore.getState().setSetting('sound', false);
            await vi.advanceTimersByTimeAsync(1500);
        });

        expect(useSettingsStore.getState().isUpdatingSettings).toBe(true);

        await act(async () => {
            resolveSync();
        });

        expect(useSettingsStore.getState().isUpdatingSettings).toBe(false);
    });

    it('cancels the pending sync on unmount', () => {
        useAuthStore.setState({ user: signedIn as never }, false);
        const { unmount } = renderHook(() => useSettingsEffects());

        act(() => {
            useSettingsStore.getState().setSetting('sound', false);
        });

        unmount();

        act(() => {
            vi.advanceTimersByTime(5000);
        });

        expect(syncUserToSupabase).not.toHaveBeenCalled();
    });

    it('does not cancel a pending sync when the component re-renders', () => {
        useAuthStore.setState({ user: signedIn as never }, false);
        const { rerender } = renderHook(() => useSettingsEffects());

        act(() => {
            useSettingsStore.getState().setSetting('sound', false);
        });

        rerender();

        act(() => {
            vi.advanceTimersByTime(1500);
        });

        expect(syncUserToSupabase).toHaveBeenCalledTimes(1);
    });
});

describe('theme mode application', () => {
    it('adds the dark class when mode is "dark"', () => {
        useSettingsStore.setState(
            { settings: { ...initialSettings, mode: 'dark' } },
            false
        );

        renderHook(() => useSettingsEffects());

        expect(document.documentElement.classList.contains('dark')).toBe(true);
        expect(document.documentElement.classList.contains('amoled')).toBe(
            false
        );
    });

    it('removes the dark class when mode is "light"', () => {
        useSettingsStore.setState(
            { settings: { ...initialSettings, mode: 'light' } },
            false
        );

        renderHook(() => useSettingsEffects());

        expect(document.documentElement.classList.contains('dark')).toBe(false);
        expect(document.documentElement.classList.contains('amoled')).toBe(
            false
        );
    });

    it('adds both dark and amoled classes when mode is "amoled"', () => {
        useSettingsStore.setState(
            { settings: { ...initialSettings, mode: 'amoled' } },
            false
        );

        renderHook(() => useSettingsEffects());

        expect(document.documentElement.classList.contains('dark')).toBe(true);
        expect(document.documentElement.classList.contains('amoled')).toBe(
            true
        );
    });

    it('reacts to mode changes while mounted', () => {
        grantTier(1);
        useSettingsStore.setState(
            { settings: { ...initialSettings, mode: 'light' } },
            false
        );

        renderHook(() => useSettingsEffects());
        expect(document.documentElement.classList.contains('dark')).toBe(false);

        act(() => {
            useSettingsStore.getState().setSetting('mode', 'dark');
        });
        expect(document.documentElement.classList.contains('dark')).toBe(true);
        expect(document.documentElement.classList.contains('amoled')).toBe(
            false
        );

        act(() => {
            useSettingsStore.getState().setSetting('mode', 'amoled');
        });
        expect(document.documentElement.classList.contains('dark')).toBe(true);
        expect(document.documentElement.classList.contains('amoled')).toBe(
            true
        );

        act(() => {
            useSettingsStore.getState().setSetting('mode', 'light');
        });
        expect(document.documentElement.classList.contains('dark')).toBe(false);
        expect(document.documentElement.classList.contains('amoled')).toBe(
            false
        );
    });

    it('sets colorScheme to match the current mode', () => {
        useSettingsStore.setState(
            { settings: { ...initialSettings, mode: 'light' } },
            false
        );

        renderHook(() => useSettingsEffects());
        expect(document.documentElement.style.colorScheme).toBe('light');

        act(() => {
            useSettingsStore.getState().setSetting('mode', 'dark');
        });
        expect(document.documentElement.style.colorScheme).toBe('dark');

        act(() => {
            useSettingsStore.getState().setSetting('mode', 'amoled');
        });
        expect(document.documentElement.style.colorScheme).toBe('dark');
    });

    it('persists the mode to localStorage so the next cold load has no flash', () => {
        grantTier(1);
        useSettingsStore.setState(
            { settings: { ...initialSettings, mode: 'dark' } },
            false
        );

        renderHook(() => useSettingsEffects());

        expect(localStorage.getItem('theme')).toBe('dark');

        act(() => {
            useSettingsStore.getState().setSetting('mode', 'amoled');
        });
        expect(localStorage.getItem('theme')).toBe('amoled');

        act(() => {
            useSettingsStore.getState().setSetting('mode', 'light');
        });
        expect(localStorage.getItem('theme')).toBe('light');
    });
});
