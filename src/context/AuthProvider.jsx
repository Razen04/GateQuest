// This file provides authentication context for the application.
// It manages user state, handles login/logout with Supabase, and synchronizes the user's profile with the database upon authentication.

import React, { useContext, useEffect, useState } from 'react'
import AuthContext from './AuthContext';
import { supabase } from '../../supabaseClient';
import StatsContext from './StatsContext';
import { toast } from 'sonner';

// The AuthProvider component handles all authentication logic.
// It exposes the user object, login/logout functions, and loading state to its children.
const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    // This state controls the visibility of a login modal/dialog.
    const [showLogin, setShowLogin] = useState(false);
    // We need the updateStats function from StatsContext to refresh stats after login.
    const { updateStats } = useContext(StatsContext)

    // True if a user object exists (includes guests, not just logged-in users).
    const isLogin = !!user;

    useEffect(() => {
        // This flag prevents the session handler from running multiple times on initialization.
        let initialized = false;

        // Processes a Supabase session to set the user state and sync their profile.
        const handleSession = async (session) => {
            if (initialized) return;
            initialized = true;

            const supaUser = session?.user || null;

            if (supaUser) {
                // If a user session exists, we 'upsert' their profile.
                // This creates a profile if it doesn't exist or updates it if it does.
                const { data, error } = await supabase.from('users').upsert({
                    id: supaUser.id,
                    email: supaUser.email,
                    name: supaUser.user_metadata.full_name,
                    avatar: supaUser.user_metadata.avatar_url,
                    // Sensible defaults for a new user profile.
                    show_name: true,
                    total_xp: 0,
                    settings: {
                        sound: true,
                        autoTimer: true
                        // Will add theme here itself in the future and remove the ThemeContext entirely, let's see.
                    }
                }).select(); // .select() returns the created/updated profile data.

                if (!error && data) {
                    // Ensure profile fields have default values to prevent runtime errors.
                    const profile = {
                        ...data[0],
                        bookmark_questions: data[0].bookmark_questions || [],
                        college: data[0].college || "",
                        targetYear: data[0].targetYear || 2026
                    };
                    // Store the user profile in localStorage for quick access elsewhere in the app.
                    localStorage.setItem("gate_user_profile", JSON.stringify(profile));
                    // Trigger a stats update now that we have a logged-in user.
                    updateStats(supaUser);
                    setUser(supaUser);
                }
            } else {
                // If there's no session, clear the user state and local storage.
                setUser(null);
                localStorage.removeItem("gate_user_profile");
            }

            setLoading(false);
        }

        // This function attempts to get the initial session, retrying a few times.
        // This can help with race conditions where the app initializes before the Supabase client.
        const initSession = async () => {
            for (let i = 0; i < 10; i++) {
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    await handleSession(session);
                    return; // Exit once the session is handled.
                }
                await new Promise(r => setTimeout(r, 500)); // Wait before retrying.
            }
            // If no session is found after retries, stop the loading state.
            setLoading(false);
        };

        initSession();

        // Listen for changes in the authentication state (e.g., login, logout).
        const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
            // Reset the initialized flag to allow the handler to process the new session state.
            initialized = false;
            handleSession(session);
        });

        // Cleanup the listener when the component unmounts to prevent memory leaks.
        return () => listener?.subscription.unsubscribe();
    }, []); // The empty dependency array ensures this effect runs only once on mount.

    // Initiates the Google OAuth login flow provided by Supabase.
    const handleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                // After login, Google redirects back to the application's origin URL.
                redirectTo: window.location.origin
            }
        });
        if (error) {
            toast.error('Login failed: ', error.message);
        }
    };

    // Signs the user out and reloads the page to ensure a clean state.
    const logout = async () => {
        await supabase.auth.signOut();
        window.location.reload();
    };

    // The context provider makes all auth-related state and functions available to child components.
    return (
        <AuthContext.Provider value={{ user, handleLogin, logout, isLogin, loading, showLogin, setShowLogin }}>{children}</AuthContext.Provider>
    );
};

export default AuthProvider