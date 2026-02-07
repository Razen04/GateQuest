// This file provides authentication context for the application.
// It manages user state, handles login/logout with Supabase, and synchronizes the user's profile with the database upon authentication.

import React, { useEffect, useRef, useState } from 'react';
import AuthContext from './AuthContext.js';
import { supabase } from '../utils/supabaseClient.ts';
import { toast } from 'sonner';
import type { AppUser } from '../types/AppUser.ts';
import type { Session } from '@supabase/supabase-js';
import useStudyPlan from '@/hooks/useStudyPlan.ts';
import { appStorage } from '@/storage/storageService.ts';

// The AuthProvider component handles all authentication logic.
// It exposes the user object, login/logout functions, and loading state to its children.
const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AppUser | null>(null);
    const [loading, setLoading] = useState(true);
    // This state controls the visibility of a login modal/dialog.
    const [showLogin, setShowLogin] = useState(false);
    // We need the updateStats function from StatsContext to refresh stats after login.
    const { refresh } = useStudyPlan();
    const userIdRef = useRef<string | null>(null);

    // True if a user object exists (includes guests, not just logged-in users).
    const isLogin = !!user && user.id !== '1';

    useEffect(() => {
        // Processes a Supabase session to set the user state and sync their profile.
        const handleSession = async (session: Session | null) => {
            const supaUser = session?.user || null;

            if (supaUser && userIdRef.current === supaUser.id) {
                setLoading(false);
                return;
            }

            if (supaUser) {
                userIdRef.current = supaUser.id;
                // If a user session exists, we 'upsert' their profile.
                // This creates a profile if it doesn't exist or updates it if it does.
                const { data, error } = await supabase
                    .from('users')
                    .upsert({
                        id: supaUser.id,
                        email: supaUser.email,
                        name: supaUser.user_metadata.full_name,
                        avatar: supaUser.user_metadata.avatar_url,
                        // Sensible defaults for a new user profile.
                        show_name: true,
                        total_xp: 0,
                        settings: {
                            sound: true,
                            autoTimer: true,
                            darkMode: true,
                        },
                    })
                    .select(); // .select() returns the created/updated profile data.

                if (!error && data) {
                    // Ensure profile fields have default values to prevent runtime errors.
                    const profile = {
                        ...data[0],
                        bookmark_questions: data[0].bookmark_questions || [],
                        college: data[0].college || '',
                        targetYear: data[0].targetYear || 2026,
                        version_number: data[0].version_number || 1,
                        settings: {
                            ...{
                                sound: true,
                                autoTimer: true,
                                darkMode: true,
                                shareProgress: false,
                                dataCollection: false,
                            },
                            ...data[0].settings,
                        },
                    };
                    // Store the user profile in localStorage for quick access elsewhere in the app.
                    localStorage.setItem('gate_user_profile', JSON.stringify(profile));
                    // Trigger a stats update now that we have a logged-in user.
                    refresh();
                    setUser(supaUser);
                }
            } else {
                // If there's no session, clear the user state and local storage.
                setUser(null);
                localStorage.removeItem('gate_user_profile');
            }

            setLoading(false);
        };

        // This function attempts to get the initial session, retrying a few times.
        // This can help with race conditions where the app initializes before the Supabase client.
        const initSession = async () => {
            for (let i = 0; i < 5; i++) {
                const {
                    data: { session },
                } = await supabase.auth.getSession();
                if (session) {
                    await handleSession(session);
                    return; // Exit once the session is handled.
                }
                await new Promise((r) => setTimeout(r, 500)); // Wait before retrying.
            }
            // If no session is found after retries, stop the loading state.
            setLoading(false);
        };

        initSession();

        // Listen for changes in the authentication state (e.g., login, logout).
        const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
            // Reset the initialized flag to allow the handler to process the new session state.
            handleSession(session);
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

    const clearStaleData = async () => {
        const staleKeys = [
            'last_checked_notification',
            'peer_benchmark_details',
            'subjectStats',
            'repo_stars',
            'weekly_set_info',
        ];

        try {
            staleKeys.forEach((k) => {
                if (k) {
                    localStorage.removeItem(k);
                }
            });
        } catch (e) {
            console.warn('⚠️ localStorage clearing error:', e);
        }

        try {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map((name) => caches.delete(name)));
        } catch (e) {
            console.warn('⚠️ Cache Storage clearing error:', e);
        }
    };

    // Signs the user out and reloads the page to ensure a clean state.
    const logout = async () => {
        await supabase.auth.signOut();
        await clearStaleData();
        await appStorage.nuke();
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
