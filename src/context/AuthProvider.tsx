// This file provides authentication context for the application.
// It manages user state, handles login/logout with Supabase, and synchronizes the user's profile with the database upon authentication.

import React, { useEffect, useState } from 'react';
import AuthContext from './AuthContext.js';
import { supabase } from '../utils/supabaseClient.ts';
import { toast } from 'sonner';
import type { AppUser } from '../types/AppUser.ts';
import type { Session } from '@supabase/supabase-js';
import useStats from '../hooks/useStats.ts';

// The AuthProvider component handles all authentication logic.
// It exposes the user object, login/logout functions, and loading state to its children.
const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AppUser | null>(null);
    const [loading, setLoading] = useState(true);
    // This state controls the visibility of a login modal/dialog.
    const [showLogin, setShowLogin] = useState(false);
    // We need the updateStats function from StatsContext to refresh stats after login.
    const { updateStats } = useStats();

    // True if a user object exists (includes guests, not just logged-in users).
    const isLogin = !!user && user.id !== '1';

    useEffect(() => {
        setLoading(true);

        // onAuthStateChange has _events
        // 1. INITIAL_SESSION (on page load)
        // 2. SIGNED_IN (on new login)
        // 3. SIGNED_OUT (on logout)
        const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
            const supaUser = session?.user || null;
            setUser(supaUser);

            if (supaUser) {
                let profile = null;

                // Upsert runs only on New User Login
                if (_event === 'SIGNED_IN') {
                    const { data, error } = await supabase
                        .from('users')
                        .upsert({
                            id: supaUser.id,
                            email: supaUser.email,
                            name: supaUser.user_metadata.full_name,
                            avatar: supaUser.user_metadata.avatar_url,
                        })
                        .select()
                        .single();

                    if (error) {
                        console.error('An error occurred while logging in: ', error);
                        return;
                    }

                    // Set profile with the new data received
                    profile = data;
                } else if (_event === 'INITIAL_SESSION') {
                    // A select for a normal page load
                    const { data, error } = await supabase
                        .from('users')
                        .select('*')
                        .eq('id', supaUser.id)
                        .single();

                    if (error) {
                        console.error('An error occurred while loading session: ', error);
                        return;
                    }

                    // Set profile of the existing user
                    profile = data;
                }
                // Note: Nothing is done on TOKEN_REFRESHED

                if (profile) {
                    const normalizedProfile = {
                        ...profile,
                        bookmark_questions: profile.bookmark_questions || [],
                        college: profile.college || '',
                        target_year: profile.target_year || 2026,
                        settings: {
                            ...{
                                sound: true,
                                autoTimer: true,
                                darkMode: true,
                                shareProgress: true,
                                dataCollection: true,
                            },
                            ...profile.settings,
                        },
                    };

                    localStorage.setItem('gate_user_profile', JSON.stringify(normalizedProfile));
                    updateStats(supaUser); // This now only runs ONCE per load.
                }
            } else {
                if (_event === 'SIGNED_OUT') {
                    // Clear local storage on logout
                    localStorage.removeItem('gate_user_profile');
                }
            }

            setLoading(false);
        });

        // Cleanup the listener when the component unmounts to prevent memory leaks.
        return () => listener?.subscription.unsubscribe();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // The empty dependency array ensures this effect runs only once on mount.

    // Initiates the Google OAuth login flow provided by Supabase.
    const handleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                // After login, Google redirects back to the application's origin URL.
                redirectTo: window.location.origin,
            },
        });
        if (error) {
            if (error instanceof Error) {
                toast.error(`Login failed: ${error.message}`);
            }
        }
    };

    // Signs the user out and reloads the page to ensure a clean state.
    const logout = async () => {
        await supabase.auth.signOut();
        window.location.reload();
    };

    // The context provider makes all auth-related state and functions available to child components.
    return (
        <AuthContext.Provider
            value={{
                user,
                handleLogin,
                logout,
                isLogin,
                loading,
                showLogin,
                setShowLogin,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;
