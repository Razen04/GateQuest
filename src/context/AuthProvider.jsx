import React, { useEffect, useState } from 'react'
import AuthContext from './AuthContext';
import { supabase } from '../../supabaseClient';

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLogin, setIsLogin] = useState(false);

    const toggleLogin = () => {
        setIsLogin(!isLogin);
    }

    useEffect(() => {
        if (user) {
            setIsLogin(false)
        }
    }, [user])

    useEffect(() => {
        const getSession = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        }

        getSession();

        const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
            const supaUser = session?.user || null
            setUser(supaUser);
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

                const profile = {
                    ...data[0],
                    bookmark_questions: data[0].bookmark_questions || [],
                    college: data[0].college || "",
                    targetYear: data[0].targetYear || 2026
                }

                if (error) {
                    console.error("User upsert failed:", error);
                } else if (data) {
                    localStorage.setItem("gate_user_profile", JSON.stringify(profile));
                }
            }
        })

        return () => {
            listener.subscription.unsubscribe();
        }
    }, [])

    // Login function
    const login = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google'
        })

        if (error) {
            console.error('Login failed: ', error.message)
        }
    }

    // Logout function
    const logout = async () => {
        await supabase.auth.signOut();
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, isLogin, toggleLogin }}>{children}</AuthContext.Provider>
    )
}

export default AuthProvider