import { toast } from 'sonner';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { AppUser } from '@/shared/types/AppUser';
import { supabase } from '@/shared/utils/supabaseClient';
import { appStorage } from '@/storage/storageService';

const STALE_KEYS = [
    'last_checked_notification',
    'peer_benchmark_details',
    'subjectStats',
    'repo_stars',
    'weekly_set_info',
] as const;

const clearStaleData = async (): Promise<void> => {
    try {
        STALE_KEYS.forEach((k) => {
            localStorage.removeItem(k);
        });
    } catch (e) {
        console.warn('⚠️ localStorage clearing error:', e);
    }

    try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
    } catch (e) {
        console.warn('⚠️ Cache Storage clearing error:', e);
    }
};

// Types
type Updater<T> = T | ((prev: T) => T);

type AuthState = {
    user: AppUser | null;
    loading: boolean;
    showLogin: boolean;
    needsUsername: boolean;

    setUser: (updater: Updater<AppUser | null>) => void;
    setLoading: (value: boolean) => void;
    setShowLogin: (value: boolean) => void;
    setNeedsUsername: (value: boolean) => void;

    handleLogin: (credentials: string) => Promise<void>;
    logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>()(
    devtools(
        (set) => ({
            user: null,
            loading: true,
            showLogin: false,
            needsUsername: false,

            setUser: (updater) =>
                set(
                    (state) => ({
                        user:
                            typeof updater === 'function'
                                ? (
                                      updater as (
                                          prev: AppUser | null
                                      ) => AppUser | null
                                  )(state.user)
                                : updater,
                    }),
                    false,
                    'auth/setUser'
                ),

            setLoading: (value) =>
                set({ loading: value }, false, 'auth/setLoading'),

            setShowLogin: (value) =>
                set({ showLogin: value }, false, 'auth/setShowLogin'),

            setNeedsUsername: (value) =>
                set({ needsUsername: value }, false, 'auth/setNeedsUsername'),

            handleLogin: async (credential) => {
                const { error } = await supabase.auth.signInWithIdToken({
                    provider: 'google',
                    token: credential,
                });

                if (error) {
                    console.error('Auth error:', error.message);
                    toast.error('Failed to log in');
                } else {
                    set({ showLogin: false }, false, 'auth/handleLogin');
                }
            },

            logout: async () => {
                try {
                    await supabase.auth.signOut();
                    await clearStaleData();
                    await appStorage.nuke();
                    window.location.reload();
                } catch (err) {
                    console.error('Unable to logout.');
                    toast.error('Unable to log out, please try again later.');
                }
            },
        }),
        { name: 'AuthStore' }
    )
);
