import { useEffect } from 'react';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { useSettingsStore } from '@/app/stores/useSettingsStore';
import {
    getUserProfile,
    syncUserToSupabase,
    updateUserProfile,
} from '@/shared/utils/helper';

export const useSettingsEffects = () => {
    const isLogin = useAuthStore((s) => s.user !== null && s.user.id !== '1');

    // Update profile whenever settings change
    useEffect(() => {
        const unsubscribe = useSettingsStore.subscribe((state, prev) => {
            if (prev.settings === state.settings) return;

            const profile = getUserProfile();
            if (profile) {
                updateUserProfile({ ...profile, settings: state.settings });
            }
        });
        return unsubscribe;
    }, []);

    // Supabase sync of settings
    useEffect(() => {
        if (!isLogin) return;

        let timer: ReturnType<typeof setTimeout> | null = null;
        const unsubscribe = useSettingsStore.subscribe((state, prev) => {
            if (prev.settings === state.settings) return;

            if (timer) clearTimeout(timer);
            timer = setTimeout(() => {
                useSettingsStore.getState().setIsUpdatingSettings(true);
                syncUserToSupabase(isLogin)
                    .catch((err) => console.error('Sync error: ', err))
                    .finally(() =>
                        useSettingsStore.getState().setIsUpdatingSettings(false)
                    );
            }, 1500);
        });

        return () => {
            if (timer) clearTimeout(timer);
            unsubscribe();
        };
    }, [isLogin]);

    const darkMode = useSettingsStore((s) => s.settings.darkMode);
    useEffect(() => {
        document.documentElement.classList.toggle('dark', darkMode);
    }, [darkMode]);
};
