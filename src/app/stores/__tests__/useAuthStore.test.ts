import { beforeEach, describe, expect, it, vi } from 'vitest';

const reloadMock = vi.fn();
Object.defineProperty(window, 'location', {
    configurable: true,
    value: { ...window.location, reload: reloadMock },
});

globalThis.caches = {
    keys: vi.fn().mockResolvedValue(['cache-a', 'cache-b']),
    delete: vi.fn().mockResolvedValue(true),
} as any;

vi.mock('sonner', () => ({
    toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock('@/storage/storageService', () => ({
    appStorage: { nuke: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock('@/shared/utils/supabaseClient', () => ({
    supabase: {
        auth: {
            signInWithIdToken: vi.fn(),
            signOut: vi.fn(),
        },
    },
}));

import { toast } from 'sonner';
import type { AppUser } from '@/shared/types/AppUser';
import { supabase } from '@/shared/utils/supabaseClient';
import { appStorage } from '@/storage/storageService';
import { useAuthStore } from '../useAuthStore';

const makeUser = (over: Partial<AppUser> = {}): AppUser =>
    ({ id: 'u1', name: 'Test', is_public: false, ...over }) as AppUser;

const initialState = {
    user: null,
    loading: true,
    showLogin: false,
    needsUsername: false,
};

beforeEach(() => {
    vi.clearAllMocks();
    (globalThis.caches.keys as ReturnType<typeof vi.fn>).mockResolvedValue([
        'cache-a',
        'cache-b',
    ]);
    (globalThis.caches.delete as ReturnType<typeof vi.fn>).mockResolvedValue(
        true
    );
    useAuthStore.setState(initialState, false);
});

describe('setUser', () => {
    it('sets the user directly when given a value', () => {
        const user = makeUser({ id: 'u42' });

        useAuthStore.getState().setUser(user);

        expect(useAuthStore.getState().user).toBe(user);
    });

    it('sets the user to null', () => {
        useAuthStore.setState({ user: makeUser() }, false);

        useAuthStore.getState().setUser(null);

        expect(useAuthStore.getState().user).toBeNull();
    });

    it('applies an updater function against the previous user', () => {
        useAuthStore.setState({ user: makeUser({ is_public: false }) }, false);

        useAuthStore.getState().setUser((prev) => ({
            ...prev!,
            is_public: true,
        }));

        expect(useAuthStore.getState().user?.is_public).toBe(true);
    });

    it('updater receives null when there is no previous user', () => {
        useAuthStore.setState({ user: null }, false);
        const updater = vi.fn(() => null);

        useAuthStore.getState().setUser(updater);

        expect(updater).toHaveBeenCalledWith(null);
        expect(useAuthStore.getState().user).toBeNull();
    });
});

describe('handleLogin', () => {
    it('closes the login modal on success', async () => {
        (
            supabase.auth.signInWithIdToken as ReturnType<typeof vi.fn>
        ).mockResolvedValue({
            data: {},
            error: null,
        });
        useAuthStore.setState({ showLogin: true }, false);

        await useAuthStore.getState().handleLogin('google-id-token');

        expect(useAuthStore.getState().showLogin).toBe(false);
        expect(toast.error).not.toHaveBeenCalled();
        expect(supabase.auth.signInWithIdToken).toHaveBeenCalledWith({
            provider: 'google',
            token: 'google-id-token',
        });
    });

    it('shows a toast on error and leaves showLogin unchanged', async () => {
        (
            supabase.auth.signInWithIdToken as ReturnType<typeof vi.fn>
        ).mockResolvedValue({
            data: { user: null, session: null },
            error: { message: 'invalid token' },
        });
        useAuthStore.setState({ showLogin: true }, false);

        await useAuthStore.getState().handleLogin('bad-token');

        expect(toast.error).toHaveBeenCalledWith('Failed to log in');
        expect(useAuthStore.getState().showLogin).toBe(true); // unchanged
    });
});

describe('logout', () => {
    it('signs out, clears storage and caches, nukes app storage, then reloads', async () => {
        (supabase.auth.signOut as ReturnType<typeof vi.fn>).mockResolvedValue({
            error: null,
        });
        localStorage.setItem('last_checked_notification', 'x');
        localStorage.setItem('subjectStats', 'y');
        localStorage.setItem('keep_me', 'z');

        await useAuthStore.getState().logout();

        expect(supabase.auth.signOut).toHaveBeenCalledTimes(1);

        // Stale localStorage keys removed; unrelated keys kept
        expect(localStorage.getItem('last_checked_notification')).toBeNull();
        expect(localStorage.getItem('subjectStats')).toBeNull();
        expect(localStorage.getItem('keep_me')).toBe('z');

        // Cache Storage cleared
        expect(globalThis.caches.keys).toHaveBeenCalled();
        expect(globalThis.caches.delete).toHaveBeenCalledTimes(2);
        expect(globalThis.caches.delete).toHaveBeenCalledWith('cache-a');
        expect(globalThis.caches.delete).toHaveBeenCalledWith('cache-b');

        // App storage nuked
        expect(appStorage.nuke).toHaveBeenCalledTimes(1);

        // Page reloaded
        expect(reloadMock).toHaveBeenCalledTimes(1);
    });

    it('runs cleanup steps in the correct order', async () => {
        const order: string[] = [];

        (supabase.auth.signOut as ReturnType<typeof vi.fn>).mockImplementation(
            async () => {
                order.push('signOut');
                return { error: null };
            }
        );
        (appStorage.nuke as ReturnType<typeof vi.fn>).mockImplementation(
            async () => {
                order.push('nuke');
            }
        );
        reloadMock.mockImplementation(() => {
            order.push('reload');
        });

        await useAuthStore.getState().logout();

        expect(order).toEqual(['signOut', 'nuke', 'reload']);
    });

    it('swallows the error, shows a toast, and halts cleanup if signOut rejects', async () => {
        (supabase.auth.signOut as ReturnType<typeof vi.fn>).mockRejectedValue(
            new Error('network')
        );

        await useAuthStore.getState().logout();

        expect(appStorage.nuke).not.toHaveBeenCalled();
        expect(reloadMock).not.toHaveBeenCalled();

        expect(toast.error).toHaveBeenCalledWith(
            'Unable to log out, please try again later.'
        );
    });
});
