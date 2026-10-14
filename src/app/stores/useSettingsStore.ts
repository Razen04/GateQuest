import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { getCurrentUser } from '@/shared/api/auth';
import { DEFAULT_TEMPLATE } from '@/shared/data/ai_prompt_template';
import type { Settings } from '@/shared/types/Settings';
import { supabase } from '@/shared/utils/supabaseClient';
import { useAuthStore } from './useAuthStore';

const defaultSettings: Settings = {
    sound: true,
    autoTimer: true,
    darkMode: true,
    shareProgress: true,
    dataCollection: true,
    aiProvider: 'chatgpt',
    aiCustomPrompt: DEFAULT_TEMPLATE,
    notifications: false,
    is_beta: false,
};

const readStoredTheme = (): boolean | null => {
    try {
        const stored = localStorage.getItem('theme');
        if (stored === 'dark') return true;
        if (stored === 'light') return false;
        return null;
    } catch {
        return null;
    }
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
            // Lazy initializer
            settings: {
                ...defaultSettings,
                darkMode: readStoredTheme() ?? defaultSettings.darkMode,
            },
            isUpdatingSettings: false,

            hydrate: () => {
                const user = useAuthStore.getState().user;
                if (!user?.settings) return;

                set(
                    (state) => ({
                        settings: {
                            ...state.settings,
                            ...user.settings,
                        },
                    }),
                    false,
                    'settings/hydrate'
                );
            },

            setSetting: (key, value) =>
                set(
                    (state) => ({
                        settings: { ...state.settings, [key]: value },
                    }),
                    false,
                    `settings/setSetting(${String(key)})`
                ),

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
