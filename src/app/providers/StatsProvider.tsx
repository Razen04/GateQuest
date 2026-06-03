import React, { useEffect, useState, useCallback } from 'react';
import StatsContext from './StatsContext.js';
import { supabase } from '@/shared/utils/supabaseClient.ts';
import type { Stats, SubjectStat } from '@/shared/types/Stats.ts';
import useSmartRevision from '@/features/smart-revision/hooks/useSmartRevision.ts';
import { getUserProfile } from '@/shared/utils/helper.ts';
import { useGoals } from '@/shared/hooks/useGoals.js';

// The StatsProvider component orchestrates fetching and processing user activity data.
const StatsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [stats, setStats] = useState<Stats>({
        progress: 0,
        accuracy: 0,
        subjectStats: [],
        subjectStatsMap: {},
        question: new Set(),
        streaks: { current: 0, longest: 0 },
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

        // 1. Basic Validation
        if (
            !user ||
            user.id === '1' ||
            user.version_number === undefined ||
            !userGoal ||
            !userGoal.target_exams
        ) {
            setLoading(false);
            return;
        }

        setLoading(true);

        try {
            // ==========================================
            // STEP 1: The Single Database Call
            // ==========================================
            const { data, error } = await supabase.rpc('get_my_dashboard');

            if (error || !data) {
                console.error('Supabase RPC error:', error);
                setLoading(false);
                return;
            }

            // ==========================================
            // STEP 2: Extract RPC Data
            // ==========================================
            const activeExams = (userGoal.target_exams as string[]).map((e) => e.toLowerCase());
            const primaryExam = activeExams[0] || 'gate';

            const primaryExamStats = data.exam_stats[primaryExam] || {
                overall_accuracy: 0,
                overall_attempted: 0,
                total_available: 0,
                subjects: [],
            };

            // Reconstruct the Subject Stats Map (Now includes backend progress, icons, and colors!)
            const newSubjectStatsMap: Record<string, SubjectStat[]> = {};
            activeExams.forEach((exam) => {
                newSubjectStatsMap[exam.toUpperCase()] = data.exam_stats[exam]?.subjects || [];
            });

            const defaultSubjectStats = newSubjectStatsMap[primaryExam.toUpperCase()] || [];
            localStorage.setItem('subjectStats', JSON.stringify(defaultSubjectStats));

            // ==========================================
            // STEP 3: Map Global State directly from Backend
            // ==========================================
            const totalQuestions = primaryExamStats.total_available || 0;
            const uniqueAttemptCount = primaryExamStats.overall_attempted || 0;
            const remainingQuestions = Math.max(totalQuestions - uniqueAttemptCount, 0);
            const overallUniqueProgressPercent =
                totalQuestions > 0 ? Math.round((uniqueAttemptCount / totalQuestions) * 100) : 0;

            const dbStats = data.dashboard_stats;

            setStats({
                progress: overallUniqueProgressPercent,
                accuracy: primaryExamStats.overall_accuracy || 0,
                subjectStats: defaultSubjectStats,
                subjectStatsMap: newSubjectStatsMap,
                question: new Set(),
                heatmapData: data.heatmap,
                streaks: {
                    current: data.streaks.study_current || 0,
                    longest: data.streaks.study_longest || 0,
                },
                // All of this is now instantly fed by your powerful RPC
                studyPlan: {
                    totalQuestions,
                    uniqueAttemptCount,
                    remainingQuestions,
                    daysLeft: dbStats.days_left,
                    dailyQuestionTarget: dbStats.daily_question_target,
                    todayUniqueAttemptCount: dbStats.today_unique_attempt_count,
                    progressPercent: overallUniqueProgressPercent,
                    todayProgressPercent: dbStats.today_progress_percent,
                    isTargetMetToday: dbStats.is_target_met_today,
                },
            });
        } catch (err) {
            console.error('Failed to update stats:', err);
        } finally {
            setLoading(false);
        }
    }, [userGoal]);

    useEffect(() => {
        let u = getUserProfile();
        if (!u || u.id === '1') {
            setLoading(false);
            return;
        }
        updateStats();
    }, [currentSet?.set_id, userGoal, updateStats]);

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
