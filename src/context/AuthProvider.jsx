import React, { useContext, useEffect, useState } from 'react'
import AuthContext from './AuthContext';
import { supabase } from '../../supabaseClient';
import StatsContext from './StatsContext';

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showLogin, setShowLogin] = useState(false);

    const isLogin = !!user;

    const { updateStats } = useContext(StatsContext)
    useEffect(() => {
        const getSession = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            setLoading(false);
        };

        getSession();

        const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
            const supaUser = session?.user || null;

            if (!supaUser) {
                setShowLogin(false);
                localStorage.removeItem("gate_user_profile");
                setUser(null);
                setLoading(false);
                return;
            }

            if (supaUser) {
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
                    updateStats(true)
                    setUser(supaUser);
                }

                setLoading(false);
            }
        });

        return () => listener.subscription.unsubscribe();
    }, []);

    useEffect(() => {
        const profile = JSON.parse(localStorage.getItem("gate_user_profile"));
        if (profile && profile.id) {
            setUser(profile);
        } else {
            setUser(null);
        }
    }, []);

    // Login function
    const handleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google'
        });
        if (error) {
            console.error('Login failed: ', error.message);
        }
    };

    // Logout function
    const logout = async () => {
        console.log("Clicked")
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ user, handleLogin, logout, isLogin, loading, showLogin, setShowLogin }}>{children}</AuthContext.Provider>
    );
};

export default AuthProvider