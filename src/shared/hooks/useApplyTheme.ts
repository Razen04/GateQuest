import { useEffect } from 'react';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { useSettingsStore } from '@/app/stores/useSettingsStore';
import {
    getDonorTier,
    resolveEffectiveAccent,
    resolveEffectiveMode,
} from '@/shared/types/donor';

export function useApplyTheme() {
    const settings = useSettingsStore((s) => s.settings);
    const user = useAuthStore((s) => s.user);

    const tier = getDonorTier(user?.notification_tags);
    const effectiveMode = resolveEffectiveMode(settings.mode, tier);
    const effectiveAccent = resolveEffectiveAccent(settings.accent, tier);

    useEffect(() => {
        const html = document.documentElement;
        const isDark = effectiveMode === 'dark' || effectiveMode === 'amoled';

        html.classList.toggle('dark', isDark);
        html.classList.toggle('amoled', effectiveMode === 'amoled');
        html.classList.toggle('sepia', effectiveMode === 'sepia');
        html.style.colorScheme = isDark ? 'dark' : 'light';

        if (effectiveAccent === 'default') {
            html.removeAttribute('data-accent');
        } else {
            html.setAttribute('data-accent', effectiveAccent);
        }

        // Persist the *effective* mode to localStorage (so a cold reload
        // doesn't briefly flash AMOLED for a downgraded user)
        try {
            localStorage.setItem('theme', effectiveMode);
            localStorage.setItem('accent', effectiveAccent);
        } catch {
            /* non-fatal */
        }
    }, [effectiveMode, effectiveAccent]);
}
