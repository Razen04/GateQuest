// app/stores/useSettingsStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { getCurrentUser } from '@/shared/api/auth';
import { DEFAULT_TEMPLATE } from '@/shared/data/ai_prompt_template';
import type { AccentId, Settings, ThemeMode } from '@/shared/types/Settings';
import { supabase } from '@/shared/utils/supabaseClient';
import { useAuthStore } from './useAuthStore';

const defaultSettings: Settings = {
    sound: true,
    autoTimer: true,
    shareProgress: true,
    dataCollection: true,
    aiProvider: 'chatgpt',
    aiCustomPrompt: DEFAULT_TEMPLATE,
    notifications: false,
    is_beta: false,
    mode: 'dark',
    accent: 'default',
};

const readStoredMode = (): ThemeMode | null => {
    try {
        const stored = localStorage.getItem('theme');
        if (
            stored === 'light' ||
            stored === 'dark' ||
            stored === 'amoled' ||
            stored === 'sepia'
        ) {
            return stored;
        }
    } catch {
        /* noop */
    }
    return null;
};

const readStoredAccent = (): AccentId | null => {
    try {
        const stored = localStorage.getItem('accent');
        const valid: AccentId[] = [
            'default',
            'ocean',
            'forest',
            'amber',
            'rose',
            'violet',
        ];
        if (stored && valid.includes(stored as AccentId)) {
            return stored as AccentId;
        }
    } catch {
        /* noop */
    }
    return null;
};

const persistMode = (mode: ThemeMode) => {
    try {
        localStorage.setItem('theme', mode);
    } catch {
        // Non-fatal
    }
};

const persistAccent = (accent: AccentId) => {
    try {
        localStorage.setItem('accent', accent);
    } catch {
        /* noop */
    }
};

const migrateLegacySettings = (
    raw: Record<string, unknown>
): Partial<Settings> => {
    const out: Partial<Settings> = { ...raw } as Partial<Settings>;

    if (!raw.mode && typeof raw.darkMode === 'boolean') {
        out.mode = raw.darkMode ? 'dark' : 'light';
    }
    delete (out as Record<string, unknown>).darkMode;

    return out;
};

type BooleanKeys = {
    [K in keyof Settings]: Settings[K] extends boolean ? K : never;
}[keyof Settings];

type SettingsStore = {
    settings: Settings;
    isUpdatingSettings: boolean;

    hydrate: () => void;
    setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
    toggleSetting: (key: BooleanKeys, val?: boolean) => void;
    setSettings: (settings: Settings) => void;
    setIsUpdatingSettings: (value: boolean) => void;
    handleUserAnonymity: (isPublic: boolean) => Promise<void>;
};

export const useSettingsStore = create<SettingsStore>()(
    devtools(
        (set) => ({
            settings: {
                ...defaultSettings,
                mode: readStoredMode() ?? defaultSettings.mode,
                accent: readStoredAccent() ?? defaultSettings.accent,
            },
            isUpdatingSettings: false,

            hydrate: () => {
                const user = useAuthStore.getState().user;
                if (!user?.settings) return;

                const migrated = migrateLegacySettings(
                    user.settings as Record<string, unknown>
                );

                set(
                    (state) => ({
                        settings: { ...state.settings, ...migrated },
                    }),
                    false,
                    'settings/hydrate'
                );

                if (migrated.mode) persistMode(migrated.mode);
                if (migrated.accent) persistAccent(migrated.accent);
            },

            setSetting: (key, value) => {
                set(
                    (state) => ({
                        settings: { ...state.settings, [key]: value },
                    }),
                    false,
                    `settings/setSetting(${String(key)})`
                );
                if (key === 'mode') persistMode(value as ThemeMode);
                if (key === 'accent') persistAccent(value as AccentId);
            },

            toggleSetting: (key, val) =>
                set(
                    (state) => ({
                        settings: {
                            ...state.settings,
                            [key]: val ?? !state.settings[key],
                        },
                    }),
                    false,
                    `settings/toggleSetting(${String(key)})`
                ),

            setSettings: (settings) =>
                set({ settings }, false, 'settings/setSettings'),

            setIsUpdatingSettings: (value) =>
                set(
                    { isUpdatingSettings: value },
                    false,
                    'settings/setIsUpdatingSettings'
                ),

            handleUserAnonymity: async (isPublic) => {
                const user = await getCurrentUser();
                if (!user?.id) return;

                const { error } = await supabase
                    .from('users')
                    .update({ is_public: isPublic })
                    .eq('id', user.id);

                if (error) throw error;

                const current = useAuthStore.getState().user;
                if (current) {
                    useAuthStore
                        .getState()
                        .setUser({ ...current, is_public: isPublic });
                }
            },
        }),
        { name: 'SettingsStore' }
    )
);
