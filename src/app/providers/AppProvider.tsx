// This file provides a context for managing general application settings.
// It handles loading settings from the user's profile, updating them in the local state, and persisting those changes back to localStorage and Supabase.

import type React from 'react';
import { useEffect, useState } from 'react';
import { getCurrentUser } from '@/shared/api/auth.ts';
import { DEFAULT_TEMPLATE } from '@/shared/data/ai_prompt_template.ts';
import useAuth from '@/shared/hooks/useAuth.ts';
import type { Settings } from '@/shared/types/Settings.ts';
import {
    getUserProfile,
    syncUserToSupabase,
    updateUserProfile,
} from '@/shared/utils/helper.ts';
import { supabase } from '@/shared/utils/supabaseClient.ts';
import AppSettingContext from './AppSettingContext.ts';

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

// The AppProvider component manages application-specific settings like sound, timers and dark mode.
const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isLogin, user, setUser } = useAuth();

    const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);

    // Initialize settings state from the user's profile in localStorage.
    // If no profile exists, it falls back to a default set of settings.
    const [settings, setSettings] = useState<Settings>(() => {
        const profle = getUserProfile();
        return (profle?.settings || defaultSettings) as Settings;
    });

    // A generic function to toggle any boolean setting by its key, or explicitly set its value.
    const handleSettingToggle = <K extends keyof Settings>(
        key: K,
        value?: Settings[K]
    ) => {
        setSettings((prev) => ({
            ...prev,
            [key]: value !== undefined ? value : !prev[key],
        }));
    };

    // function to handle updating is_public for user anonymity
    const handleUserAnonymity = async (isPublic: boolean) => {
        const user = await getCurrentUser();
        if (!user?.id) return;

        const { error } = await supabase
            .from('users')
            .update({ is_public: isPublic })
            .eq('id', user.id);

        if (error) throw error;

        setUser((prev) => ({
            ...prev,
            is_public: isPublic,
        }));
    };

    useEffect(() => {
        const profile = getUserProfile();
        if (profile) {
            updateUserProfile({ ...profile, settings });
        }
    }, [settings]);

    useEffect(() => {
        if (!isLogin) return;

        const syncTimer = setTimeout(() => {
            setIsUpdatingSettings(true);

            syncUserToSupabase(isLogin)
                .catch((_err) => {})
                .finally(() => setIsUpdatingSettings(false));
        }, 1500);

        return () => clearTimeout(syncTimer);
    }, [isLogin]);

    // This allows Tailwind CSS's dark mode variants to work globally.
    useEffect(() => {
        const root = document.documentElement;
        if (settings.darkMode) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }, [settings.darkMode]);

    // The context provider makes the settings state and the toggle function available to child components.
    return (
        <AppSettingContext.Provider
            value={{
                settings,
                handleSettingToggle,
                handleUserAnonymity,
                isUpdatingSettings,
            }}
        >
            {children}
        </AppSettingContext.Provider>
    );
};

export default AppProvider;
