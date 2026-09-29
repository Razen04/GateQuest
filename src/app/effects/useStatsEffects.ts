import { useEffect } from 'react';
import { useGoalStore } from '@/app/stores/useGoalStore.ts';
import { useStatsStore } from '@/app/stores/useStatsStore.ts';
import useSmartRevision from '@/features/smart-revision/hooks/useSmartRevision.ts';
import { getUserProfile } from '@/shared/utils/helper.ts';

export function useStatsEffects() {
    const { currentSet, fetchCurrentSet } = useSmartRevision();
    const userGoal = useGoalStore((s) => s.userGoal);

    useEffect(() => {
        const u = getUserProfile();
        if (!u || u.id === '1') {
            useStatsStore.getState().setLoading(false);
            return;
        }
        useStatsStore.getState().updateStats();
    }, [currentSet?.set_id, userGoal]);

    useEffect(() => {
        const handleRevisionUpdate = () => fetchCurrentSet();
        const handleStatsUpdate = () => useStatsStore.getState().updateStats();

        window.addEventListener('REVISION_UPDATED', handleRevisionUpdate);
        window.addEventListener('STATS_UPDATED', handleStatsUpdate);

        return () => {
            window.removeEventListener(
                'REVISION_UPDATED',
                handleRevisionUpdate
            );
            window.removeEventListener('STATS_UPDATED', handleStatsUpdate);
        };
    }, [fetchCurrentSet]);
}
