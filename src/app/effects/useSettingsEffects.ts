import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { useSettingsStore } from '@/app/stores/useSettingsStore';
import { syncUserToSupabase } from '@/shared/utils/helper';

const SYNC_DEBOUNCE_MS = 1500;

export function useSettingsEffects() {
    const mode = useSettingsStore((s) => s.settings.mode);
    const settings = useSettingsStore((s) => s.settings);
    const user = useAuthStore((s) => s.user);

    useEffect(() => {
        const html = document.documentElement;
        // Sepia's near-black background needs dark-mode defaults for
        // shadcn internals (scrollbars, form controls, focus rings).
        const isDark = mode === 'dark' || mode === 'amoled' || mode === 'sepia';
        const isSepia = mode === 'sepia';

        localStorage.setItem('theme', mode);

        html.classList.toggle('dark', isDark);
        html.classList.toggle('amoled', mode === 'amoled');
        html.classList.toggle('sepia', isSepia);

        html.style.colorScheme = isDark ? 'dark' : 'light';
    }, [mode]);

    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isFirstRun = useRef(true);

    useEffect(() => {
        if (isFirstRun.current) {
            isFirstRun.current = false;
            return;
        }

        if (!user?.id) return;

        if (timerRef.current) clearTimeout(timerRef.current);

        timerRef.current = setTimeout(async () => {
            const store = useSettingsStore.getState();
            store.setIsUpdatingSettings(true);
            try {
                await syncUserToSupabase(true);
            } finally {
                store.setIsUpdatingSettings(false);
            }
        }, SYNC_DEBOUNCE_MS);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [settings, user?.id]);
}
