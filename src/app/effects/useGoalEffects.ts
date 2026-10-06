import { useEffect } from 'react';
import { useGoalStore } from '@/app/stores/useGoalStore';
import { supabase } from '@/shared/utils/supabaseClient';

export function useGoalEffects() {
    useEffect(() => {
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_IN') {
                useGoalStore.getState().fetchData(true);
            }
            if (event === 'INITIAL_SESSION') {
                useGoalStore.getState().fetchData();
            }
            if (event === 'SIGNED_OUT') {
                useGoalStore.setState(
                    { userGoal: null, loading: false },
                    false,
                    'goal/signedOut'
                );
                useGoalStore.getState()._resetFetchGuard();
                useGoalStore.getState().setGuestGoal();
                useGoalStore.setState(
                    { userGoal: null, loading: false },
                    false,
                    'goal/signedOut'
                );
            }
        });

        return () => subscription.unsubscribe();
    }, []);
}
