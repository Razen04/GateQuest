import React, { useContext, useEffect, useState } from 'react'
import AuthContext from './AuthContext';
import { supabase } from '../../supabaseClient';
import StatsContext from './StatsContext';

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showLogin, setShowLogin] = useState(false);
    const { updateStats } = useContext(StatsContext)

    const isLogin = !!user;

    useEffect(() => {
        let initialized = false;

        const handleSession = async (session) => {

            const supaUser = session?.user || null;

            if (supaUser) {
                // 2. Get/update user profile
                const { data, error } = await supabase.from('users').upsert({
                    id: supaUser.id,
                    email: supaUser.email,
                    name: supaUser.user_metadata.full_name,
                    avatar: supaUser.user_metadata.avatar_url,
                    show_name: true,
                    total_xp: 0,
                    settings: {
                        sound: true,
                        autoTimer: true
                    }
                }).select();

                if (!error && data) {
                    const profile = {
                        ...data[0],
                        bookmark_questions: data[0].bookmark_questions || [],
                        college: data[0].college || "",
                        targetYear: data[0].targetYear || 2026
                    };
                    localStorage.setItem("gate_user_profile", JSON.stringify(profile));
                    updateStats(supaUser);
                    setUser(supaUser);
                }
            } else {
                setUser(null);
                localStorage.removeItem("gate_user_profile");
            }

            setLoading(false);
        }

        const initSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!initialized) {
                initialized = true;
                await handleSession(session);
            }
        }

        initSession();

        const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
            await handleSession(session);
        });

        return () => listener?.subscription.unsubscribe();
    }, []);

    // Login function
    const handleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        });
        if (error) {
            console.error('Login failed: ', error.message);
        }
    };

    // Logout function
    const logout = async () => {
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ user, handleLogin, logout, isLogin, loading, showLogin, setShowLogin }}>{children}</AuthContext.Provider>
    );
};

export default AuthProvider