import { useContext, useCallback } from "react";
import StatsContext from "../context/StatsContext";
import { getUserProfile } from "../helper";

const useStudyPlan = (_params = {}) => {
    const { stats, loading, updateStats } = useContext(StatsContext);

    const refresh = useCallback(() => {
        const user = getUserProfile();
        if (user) {
            return updateStats(user);
        }
    }, [updateStats]);

    const sp = stats?.studyPlan || {};

    return {
        loading,
        error: null,
        uniqueAttemptCount: sp.uniqueAttemptCount || 0,
        todayUniqueAttemptCount: sp.todayUniqueAttemptCount || 0,
        dailyQuestionTarget: sp.dailyQuestionTarget || 0,
        daysLeft: sp.daysLeft || 0,
        isTargetMetToday: sp.isTargetMetToday || false,
        progressPercent: sp.progressPercent || 0,
        todayProgressPercent: sp.todayProgressPercent || 0,
        remainingQuestions: sp.remainingQuestions || 0,
        refresh,
    };
};

export default useStudyPlan;