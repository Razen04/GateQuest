import { useEffect } from 'react';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { useSettingsStore } from '@/app/stores/useSettingsStore';
import { syncUserToSupabase } from '@/shared/utils/helper';

export const useSettingsEffects = () => {
    const user = useAuthStore((s) => s.user);
    const isLogin = user !== null && user.id !== '1';

    useEffect(() => {
        useSettingsStore.getState().hydrate();
    }, [user?.id]);

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
        localStorage.setItem('theme', darkMode ? 'dark' : 'light');
        document.documentElement.classList.toggle('dark', darkMode);
    }, [darkMode]);
};
