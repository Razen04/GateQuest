import type { Session } from '@supabase/supabase-js';
import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import useStudyPlan from '@/features/dashboard/hooks/useStudyPlan.js';
import type { AppUser } from '@/shared/types/AppUser.ts';
import { getUserProfile } from '@/shared/utils/helper.js';
import { supabase } from '@/shared/utils/supabaseClient.ts';
import { appStorage } from '@/storage/storageService.ts';
import AuthContext from './AuthContext.js';

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [user, setUser] = useState<AppUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [showLogin, setShowLogin] = useState(false);
    const [needsUsername, setNeedsUsername] = useState(false);

    const { refresh } = useStudyPlan();
    const userIdRef = useRef<string | null>(null);
    const refreshRef = useRef(refresh);
    const lastBetaStateRef = useRef<boolean | null>(null);

    const isLogin = !!user && user.id !== '1';

    // Keep ref up to date without re-subscribing the effect
    useEffect(() => {
        refreshRef.current = refresh;
    }, [refresh]);

    useEffect(() => {
        let isMounted = true;

        const handleSession = async (session: Session | null) => {
            const supaUser = session?.user || null;

            if (!supaUser) {
                userIdRef.current = null;
                setUser(null);
                setNeedsUsername(false);
                localStorage.removeItem('gate_user_profile');
                if (isMounted) setLoading(false);
                return;
            }

            // Check if beta mode changed in localStorage since last run
            const localProfile = getUserProfile();
            const currentBetaState = localProfile?.settings?.is_beta ?? false;
            const betaModeChanged =
                lastBetaStateRef.current !== null &&
                lastBetaStateRef.current !== currentBetaState;

            lastBetaStateRef.current = currentBetaState;

            // Invalidate cache ref if beta mode changed
            if (betaModeChanged) {
                userIdRef.current = null;
            }

            // Skip re-fetch if user ID is unchanged AND beta mode hasn't changed
            if (userIdRef.current === supaUser.id && !betaModeChanged) {
                if (isMounted) setLoading(false);
                return;
            }

            userIdRef.current = supaUser.id;

            try {
                // Fetch existing profile first
                const { data: existingUser, error: selectError } =
                    await supabase
                        .from('users')
                        .select('*')
                        .eq('id', supaUser.id)
                        .maybeSingle();

                if (selectError) throw selectError;

                let finalProfile = existingUser;

                // If profile doesn't exist, we create it
                if (!existingUser) {
                    const newProfile = {
                        id: supaUser.id,
                        email: supaUser.email ?? null,
                        name: supaUser.user_metadata?.full_name || '',
                        avatar: supaUser.user_metadata?.avatar_url ?? null,
                        show_name: true,
                        total_xp: 0,
                        settings: {
                            sound: true,
                            autoTimer: true,
                            darkMode: true,
                            is_beta: false,
                        },
                    };

                    const { data: insertedData, error: insertError } =
                        await supabase
                            .from('users')
                            .insert(newProfile)
                            .select()
                            .single();

                    if (insertError) throw insertError;
                    finalProfile = insertedData;
                }

                if (finalProfile && isMounted) {
                    const rawSettings =
                        typeof finalProfile.settings === 'object' &&
                        finalProfile.settings !== null
                            ? (finalProfile.settings as Record<string, boolean>)
                            : {};

                    const profile = {
                        ...finalProfile,
                        bookmark_questions:
                            finalProfile.bookmark_questions || [],
                        college: finalProfile.college || '',
                        targetYear: finalProfile.targetYear || 2027,
                        version_number: finalProfile.version_number || 1,
                        settings: {
                            sound: true,
                            autoTimer: true,
                            darkMode: true,
                            is_beta: false,
                            shareProgress: false,
                            dataCollection: false,
                            ...rawSettings,
                        },
                    };

                    if (profile.settings.is_beta) {
                        if (supaUser.id !== '1' && !profile.username) {
                            setNeedsUsername(true);
                        } else {
                            setNeedsUsername(false);
                        }
                    }

                    localStorage.setItem(
                        'gate_user_profile',
                        JSON.stringify(profile)
                    );
                    refreshRef.current();
                    setUser(profile as unknown as AppUser);
                }
            } catch (err) {
                console.error('Session initialization / sync error:', err);
                toast.error('Session initialization error.');
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        // Rely on onAuthStateChange for session initialization & updates
        const { data: listener } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                handleSession(session);
            }
        );

        return () => {
            isMounted = false;
            listener?.subscription.unsubscribe();
        };
    }, []);

    const handleLogin = async (credential: string) => {
        const { error } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: credential,
        });

        if (error) {
            console.error('Auth error:', error.message);
            toast.error('Failed to log in');
        } else {
            setShowLogin(false);
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
                localStorage.removeItem(k);
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

    const logout = async () => {
        await supabase.auth.signOut();
        await clearStaleData();
        await appStorage.nuke();
        window.location.reload();
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                setUser,
                handleLogin,
                logout,
                isLogin,
                loading,
                showLogin,
                setShowLogin,
                needsUsername,
                setNeedsUsername,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;
