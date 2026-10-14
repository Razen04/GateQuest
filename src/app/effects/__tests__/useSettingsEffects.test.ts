import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/shared/utils/helper', () => ({
    syncUserToSupabase: vi.fn().mockResolvedValue(undefined),
}));

import { useAuthStore } from '@/app/stores/useAuthStore';
import { useSettingsStore } from '@/app/stores/useSettingsStore';
import { syncUserToSupabase } from '@/shared/utils/helper';
import { useSettingsEffects } from '../useSettingsEffects';

const initialSettings = useSettingsStore.getState().settings;

beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    useAuthStore.setState({ user: null }, false);
    useSettingsStore.setState(
        { settings: { ...initialSettings }, isUpdatingSettings: false },
        false
    );

    document.documentElement.classList.remove('dark');
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
            useSettingsStore.getState().setSetting('darkMode', false);
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

describe('dark mode class', () => {
    it('adds the dark class when darkMode is true', () => {
        useSettingsStore.setState(
            { settings: { ...initialSettings, darkMode: true } },
            false
        );

        renderHook(() => useSettingsEffects());

        expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('removes the dark class when darkMode is false', () => {
        useSettingsStore.setState(
            { settings: { ...initialSettings, darkMode: false } },
            false
        );

        renderHook(() => useSettingsEffects());

        expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('reacts to darkMode changes while mounted', () => {
        useSettingsStore.setState(
            { settings: { ...initialSettings, darkMode: false } },
            false
        );

        renderHook(() => useSettingsEffects());
        expect(document.documentElement.classList.contains('dark')).toBe(false);

        act(() => {
            useSettingsStore.getState().setSetting('darkMode', true);
        });
        expect(document.documentElement.classList.contains('dark')).toBe(true);

        act(() => {
            useSettingsStore.getState().setSetting('darkMode', false);
        });
        expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('persists the theme to localStorage so the next cold load has no flash', () => {
        useSettingsStore.setState(
            { settings: { ...initialSettings, darkMode: true } },
            false
        );

        renderHook(() => useSettingsEffects());

        expect(localStorage.getItem('theme')).toBe('dark');

        act(() => {
            useSettingsStore.getState().setSetting('darkMode', false);
        });

        expect(localStorage.getItem('theme')).toBe('light');
    });
});
