import { useEffect, useRef } from 'react';
import { useGoalStore } from '@/app/stores/useGoalStore';
import { supabase } from '@/shared/utils/supabaseClient';

export function useGoalEffects() {
    // `undefined` = never initialized, `null` = guest, string = logged-in user.
    // Distinguishes "first event" (undefined → anything) from a true no-change.
    const userIdRef = useRef<string | null | undefined>(undefined);

    useEffect(() => {
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            const newUserId = session?.user?.id ?? null;
            const userChanged = userIdRef.current !== newUserId;

            if (
                (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') &&
                userChanged
            ) {
                userIdRef.current = newUserId;
                useGoalStore.getState().fetchData(true);
                return;
            }

            if (event === 'SIGNED_OUT') {
                userIdRef.current = null;
                useGoalStore.getState()._resetFetchGuard();
                useGoalStore.getState().setGuestGoal();
                useGoalStore.setState(
                    { loading: false },
                    false,
                    'goal/signedOut'
                );
            }
        });

        return () => subscription.unsubscribe();
    }, []);
}
