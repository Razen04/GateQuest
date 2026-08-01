import React, { useEffect, useState, useCallback } from 'react';
import StatsContext from './StatsContext.js';
import { supabase } from '@/shared/utils/supabaseClient.ts';
import type { Stats, SubjectStat } from '@/shared/types/Stats.ts';
import useSmartRevision from '@/features/smart-revision/hooks/useSmartRevision.ts';
import { getUserProfile } from '@/shared/utils/helper.ts';
import { useGoals } from '@/shared/hooks/useGoals.js';
import type { DashboardResponse } from '@/shared/types/StatsType.js';

export const StatsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [stats, setStats] = useState<Stats>({
        progress: 0,
        accuracy: 0,
        subjectStats: [],
        subjectStatsMap: {},
        question: new Set(),
        streaks: {
            study_current: 0,
            study_longest: 0,
            learning_longest: 0,
            learning_current: 0,
        },
        heatmapData: [],
        studyPlan: {
            totalQuestions: 0,
            uniqueAttemptCount: 0,
            remainingQuestions: 0,
            daysLeft: 0,
            dailyQuestionTarget: 0,
            todayUniqueAttemptCount: 0,
            progressPercent: 0,
            todayProgressPercent: 0,
            isTargetMetToday: false,
        },
    });

    const [loading, setLoading] = useState(true);
    const { currentSet, fetchCurrentSet } = useSmartRevision();
    const { userGoal } = useGoals();

    const updateStats = useCallback(async () => {
        const user = getUserProfile();

        if (!user || user.id === '1' || user.version_number === undefined) {
            setLoading(false);
            return;
        }

        setLoading(true);

        try {
            const { data, error } = await supabase.rpc('get_my_dashboard');

            if (error || !data) {
                console.error('Supabase RPC error:', error);
                setLoading(false);
                return;
            }

            const dashboardData = data as unknown as DashboardResponse;
            console.log('Dashboard Data: ', dashboardData);

            // Normalize active exams array
            const rawTargetExams = userGoal?.target_exams || ['gate'];
            const activeExams = rawTargetExams.map((e) => e.toLowerCase());
            const primaryExam = activeExams[0] || 'gate';

            // Case-insensitive lookup helper for exam_stats JSON keys from DB
            const findExamStats = (examName: string) => {
                const keys = Object.keys(dashboardData.exam_stats || {});
                const matchKey = keys.find((k) => k.toLowerCase() === examName.toLowerCase());
                return matchKey ? dashboardData.exam_stats[matchKey] : null;
            };

            const primaryExamStats = findExamStats(primaryExam) || {
                overall_accuracy: 0,
                overall_attempted: 0,
                total_available: 0,
                subjects: [],
            };

            // Reconstruct Subject Stats Map for all targeted exams
            const newSubjectStatsMap: Record<string, SubjectStat[]> = {};
            activeExams.forEach((exam) => {
                const examData = findExamStats(exam);
                const upperKey = exam.toUpperCase();
                newSubjectStatsMap[upperKey] = examData?.subjects || [];
            });

            const defaultSubjectStats = primaryExamStats.subjects || [];

            // Persist to local storage
            try {
                localStorage.setItem('subjectStats', JSON.stringify(defaultSubjectStats));
            } catch (e) {
                console.warn('Failed to save subjectStats to localStorage', e);
            }

            // Global Metrics
            const totalQuestions = primaryExamStats.total_available || 0;
            const uniqueAttemptCount = primaryExamStats.overall_attempted || 0;
            const remainingQuestions = Math.max(totalQuestions - uniqueAttemptCount, 0);
            const overallUniqueProgressPercent =
                totalQuestions > 0 ? Math.round((uniqueAttemptCount / totalQuestions) * 100) : 0;

            const dbStats = dashboardData.dashboard_stats || {};

            setStats({
                progress: overallUniqueProgressPercent,
                accuracy: primaryExamStats.overall_accuracy || 0,
                subjectStats: defaultSubjectStats, // Ensures SubjectStats component updates dynamically
                subjectStatsMap: newSubjectStatsMap,
                question: new Set(),
                heatmapData: dashboardData.heatmap || [],
                streaks: {
                    learning_current: dashboardData.streaks?.learning_current || 0,
                    learning_longest: dashboardData.streaks?.learning_longest || 0,
                    study_current: dashboardData.streaks?.study_current || 0,
                    study_longest: dashboardData.streaks?.study_longest || 0,
                },
                studyPlan: {
                    totalQuestions,
                    uniqueAttemptCount,
                    remainingQuestions,
                    daysLeft: dbStats.days_left || 0,
                    dailyQuestionTarget: dbStats.daily_question_target || 0,
                    todayUniqueAttemptCount: dbStats.today_unique_attempt_count || 0,
                    progressPercent: overallUniqueProgressPercent,
                    todayProgressPercent: dbStats.today_progress_percent || 0,
                    isTargetMetToday: dbStats.is_target_met_today || false,
                },
            });
        } catch (err) {
            console.error('Failed to update stats:', err);
        } finally {
            setLoading(false);
        }
    }, [userGoal]);

    // Initial trigger
    useEffect(() => {
        const u = getUserProfile();
        if (!u || u.id === '1') {
            setLoading(false);
            return;
        }
        updateStats();
    }, [currentSet?.set_id, updateStats]);

    // Global Event Handlers
    useEffect(() => {
        const handleRevisionUpdate = () => fetchCurrentSet();
        const handleStatsUpdate = () => updateStats();

        window.addEventListener('REVISION_UPDATED', handleRevisionUpdate);
        window.addEventListener('STATS_UPDATED', handleStatsUpdate);
        return () => {
            window.removeEventListener('REVISION_UPDATED', handleRevisionUpdate);
            window.removeEventListener('STATS_UPDATED', handleStatsUpdate);
        };
    }, [fetchCurrentSet, updateStats]);

    return (
        <StatsContext.Provider value={{ stats, loading, updateStats }}>
            {children}
        </StatsContext.Provider>
    );
};

export default StatsProvider;
