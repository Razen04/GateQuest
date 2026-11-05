import { useEffect } from 'react';
import { useSettingsStore } from '@/app/stores/useSettingsStore';

export function useApplyTheme() {
    const mode = useSettingsStore((s) => s.settings.mode);
    const accent = useSettingsStore((s) => s.settings.accent);

    useEffect(() => {
        const html = document.documentElement;
        const isDark = mode === 'dark' || mode === 'amoled';

        html.classList.toggle('dark', isDark);
        html.classList.toggle('amoled', mode === 'amoled');
        html.style.colorScheme = isDark ? 'dark' : 'light';

        if (accent === 'default') {
            html.removeAttribute('data-accent');
        } else {
            html.setAttribute('data-accent', accent);
        }
    }, [mode, accent]);
}
