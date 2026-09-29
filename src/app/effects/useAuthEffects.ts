import type { Session } from '@supabase/supabase-js';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/app/stores/useAuthStore.ts';
import useStudyPlan from '@/features/dashboard/hooks/useStudyPlan.js';
import type { AppUser } from '@/shared/types/AppUser.ts';
import { getUserProfile } from '@/shared/utils/helper.js';
import { supabase } from '@/shared/utils/supabaseClient.ts';

export function useAuthEffects() {
    const { refresh } = useStudyPlan();

    const userIdRef = useRef<string | null>(null);
    const refreshRef = useRef(refresh);
    const lastBetaStateRef = useRef<boolean | null>(null);

    useEffect(() => {
        refreshRef.current = refresh;
    }, [refresh]);

    useEffect(() => {
        let isMounted = true;

        const handleSession = async (session: Session | null) => {
            const supaUser = session?.user || null;

            if (!supaUser) {
                userIdRef.current = null;
                useAuthStore.getState().setUser(null);
                useAuthStore.getState().setNeedsUsername(false);
                localStorage.removeItem('gate_user_profile');
                if (isMounted) useAuthStore.getState().setLoading(false);
                return;
            }

            const localProfile = getUserProfile();
            const currentBetaState = localProfile?.settings?.is_beta ?? false;
            const betaModeChanged =
                lastBetaStateRef.current !== null &&
                lastBetaStateRef.current !== currentBetaState;
            lastBetaStateRef.current = currentBetaState;

            if (betaModeChanged) userIdRef.current = null;

            if (userIdRef.current === supaUser.id && !betaModeChanged) {
                if (isMounted) useAuthStore.getState().setLoading(false);
                return;
            }

            userIdRef.current = supaUser.id;

            try {
                const { data: existingUser, error: selectError } =
                    await supabase
                        .from('users')
                        .select('*')
                        .eq('id', supaUser.id)
                        .maybeSingle();

                if (selectError) throw selectError;

                let finalProfile = existingUser;

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
                            useAuthStore.getState().setNeedsUsername(true);
                        } else {
                            useAuthStore.getState().setNeedsUsername(false);
                        }
                    }

                    localStorage.setItem(
                        'gate_user_profile',
                        JSON.stringify(profile)
                    );
                    refreshRef.current();
                    useAuthStore
                        .getState()
                        .setUser(profile as unknown as AppUser);
                }
            } catch (err) {
                console.error('Session initialization / sync error:', err);
                toast.error('Session initialization error.');
            } finally {
                if (isMounted) useAuthStore.getState().setLoading(false);
            }
        };

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
}
