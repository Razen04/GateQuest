// This custom hook provides a convenient interface for accessing the user's study plan data.
// It abstracts the logic of retrieving data from the global StatsContext.

import { useContext, useCallback } from 'react';
import StatsContext from '../context/StatsContext.ts';

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

// A hook to easily consume and interact with the study plan portion of the stats.
const useStudyPlan = (): UseStudyPlanReturnType => {
    // Access the global stats context, which contains all the calculated user statistics.
    const context = useContext(StatsContext);
    if (!context) {
        throw new Error('useStudyPlan must be used within a StatsProvider');
    }
    const { stats, loading, updateStats } = context;

    // A memoized function to manually trigger a refresh of the user's stats.
    // This is useful for components that need to ensure they have the latest data.
    const refresh = useCallback(() => {
        return updateStats();
    }, [updateStats]); // Depends on the updateStats function from the context.

    // Safely access the studyPlan object from the stats, providing an empty object as a fallback.
    const sp = stats?.studyPlan || {};

    // Return a flattened object with all the relevant study plan data.
    // Default values (0 or false) are provided for each metric to prevent errors if the data is not yet available.
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
