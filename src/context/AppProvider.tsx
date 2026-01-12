// This file provides a context for managing general application settings.
// It handles loading settings from the user's profile, updating them in the local state, and persisting those changes back to localStorage and Supabase.

import React, { useEffect, useState } from 'react';
import AppSettingContext from './AppSettingContext.ts';
import { getUserProfile, syncUserToSupabase, updateUserProfile } from '../helper.ts';
import type { Settings } from '../types/Settings.ts';
import useAuth from '../hooks/useAuth.ts';

const defaultSettings: Settings = {
    sound: true,
    autoTimer: true,
    darkMode: true,
    shareProgress: true,
    dataCollection: true,
};

// The AppProvider component manages application-specific settings like sound, timers and dark mode.
const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isLogin } = useAuth();

    // Initialize settings state from the user's profile in localStorage.
    // If no profile exists, it falls back to a default set of settings.
    const [settings, setSettings] = useState<Settings>(() => {
        const profle = getUserProfile();
        return (profle?.settings || defaultSettings) as Settings;
    });

    // A generic function to toggle any boolean setting by its key.
    const handleSettingToggle = (key: keyof Settings) => {
        setSettings((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    // This effect runs whenever the settings object changes.
    // Its purpose is to persist the new settings to the user's profile.
    useEffect(() => {
        const profile = getUserProfile();

        if (profile) {
            // Create an updated profile object with the new settings.
            const updatedProfile = { ...profile, settings };

            // Update the profile in localStorage.
            updateUserProfile(updatedProfile);
            // Sync the updated profile to the Supabase database if the user is logged in.
            syncUserToSupabase(isLogin);
        }
    }, [isLogin, settings]); // The dependency array ensures this runs only when settings change.

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
        <AppSettingContext.Provider value={{ settings, handleSettingToggle }}>
            {children}
        </AppSettingContext.Provider>
    );
};

export default AppProvider;
