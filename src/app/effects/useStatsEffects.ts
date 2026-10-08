import { useEffect } from 'react';
import { useGoalStore } from '@/app/stores/useGoalStore.ts';
import { useStatsStore } from '@/app/stores/useStatsStore.ts';
import useSmartRevision from '@/features/smart-revision/hooks/useSmartRevision.ts';

export function useStatsEffects() {
    const { currentSet, fetchCurrentSet } = useSmartRevision();

    const userGoalKey = useGoalStore((s) => {
        const g = s.userGoal;
        if (!g) return null;
        const exams = Array.isArray(g.target_exams)
            ? g.target_exams.join(',')
            : '';
        const optionals = Array.isArray(g.additional_subjects)
            ? g.additional_subjects.join(',')
            : '';
        return `${g.id}:${g.branch_id}:${exams}:${optionals}`;
    });

    useEffect(() => {
        // existing body
        useStatsStore.getState().updateStats();
    }, [currentSet?.set_id, userGoalKey]);

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
