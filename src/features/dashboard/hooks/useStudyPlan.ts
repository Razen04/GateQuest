import { useCallback } from 'react';
import { useStatsStore } from '@/app/stores/useStatsStore';

interface StudyPlanType {
    uniqueAttemptCount: number;
    todayUniqueAttemptCount: number;
    dailyQuestionTarget: number;
    daysLeft: number;
    isTargetMetToday: boolean;
    progressPercent: number;
    todayProgressPercent: number;
    remainingQuestions: number;
}

interface UseStudyPlanReturnType extends StudyPlanType {
    loading: boolean;
    refresh: () => void;
}

const useStudyPlan = (): UseStudyPlanReturnType => {
    const stats = useStatsStore((s) => s.stats);
    const loading = useStatsStore((s) => s.loading);
    const updateStats = useStatsStore((s) => s.updateStats);

    const refresh = useCallback(() => {
        return updateStats();
    }, [updateStats]);

    const sp = stats?.studyPlan || {};

    return {
        loading,
        uniqueAttemptCount: sp.uniqueAttemptCount || 0,
        todayUniqueAttemptCount: sp.todayUniqueAttemptCount || 0,
        dailyQuestionTarget: sp.dailyQuestionTarget || 0,
        daysLeft: sp.daysLeft || 0,
        isTargetMetToday: sp.isTargetMetToday || false,
        progressPercent: sp.progressPercent || 0,
        todayProgressPercent: sp.todayProgressPercent || 0,
        remainingQuestions: sp.remainingQuestions || 0,
        refresh, // Expose the refresh function to the component.
    };
};

export default useStudyPlan;
