// This file provides a context for managing and calculating all user-related statistics.
// It fetches user activity from Supabase and computes metrics like progress, accuracy, study streaks for heatmap, and a personalized study plan.

import React, { useEffect, useState, useCallback } from 'react';
import StatsContext from './StatsContext.js';
import { supabase } from '@/shared/utils/supabaseClient.ts';
import { differenceInCalendarDays, parseISO, startOfDay, format } from 'date-fns';
import type { Stats, SubjectStat } from '@/shared/types/Stats.ts';
import type { Database } from '@/shared/types/supabase.ts';
import useSmartRevision from '@/features/smart-revision/hooks/useSmartRevision.ts';
import { getUserProfile } from '@/shared/utils/helper.ts';
import { useGoals } from '@/shared/hooks/useGoals.js';

type UserQuestionActivity = Database['public']['Tables']['user_question_activity']['Row'] & {
    subject_id?: string;
    exam_tags?: string[];
};

// The StatsProvider component orchestrates fetching and processing user activity data.
// It exposes the calculated stats, loading state, and an update function to its children.
const StatsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Holds all computed statistics and the loading state.
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
            console.log('Data: ', data);

            // ==========================================
            // STEP 2: Extract RPC Data
            // ==========================================
            const activeExams = (userGoal.target_exams as string[]).map((e) => e.toLowerCase());
            const primaryExam = activeExams[0] || 'gate'; // Fallback to 'gate'

            // Get the specific stats for their primary selected exam
            const primaryExamStats = data.exam_stats[primaryExam] || {
                overall_accuracy: 0,
                overall_attempted: 0,
                overall_total: 0,
                subjects: [],
            };

            // Reconstruct the Subject Stats Map for the UI
            const newSubjectStatsMap: Record<string, SubjectStat[]> = {};
            activeExams.forEach((exam) => {
                newSubjectStatsMap[exam.toUpperCase()] = data.exam_stats[exam]?.subjects || [];
            });

            // Set default subject stats for Practice.tsx fallback
            const defaultSubjectStats = newSubjectStatsMap[primaryExam.toUpperCase()] || [];
            localStorage.setItem('subjectStats', JSON.stringify(defaultSubjectStats));

            // Extract Today's Attempts from the Heatmap
            const todayStr = format(new Date(), 'yyyy-MM-dd');
            const todayHeatmapNode = data.heatmap.find((day: any) => day.date === todayStr);
            const todayUniqueAttemptCount = todayHeatmapNode ? todayHeatmapNode.count : 0;

            // ==========================================
            // STEP 3: Time-Based Local Math (Study Plan)
            // ==========================================
            const GATE_EXAM_DATE = '2027-02-08';
            const QUESTIONS_COMPLETION_DATE = '2027-02-15';
            const now = new Date();

            let rawDaysLeft = Math.max(
                0,
                differenceInCalendarDays(startOfDay(parseISO(GATE_EXAM_DATE)), startOfDay(now)),
            );
            let rawDaysBeforeComplete = Math.max(
                0,
                differenceInCalendarDays(
                    startOfDay(parseISO(QUESTIONS_COMPLETION_DATE)),
                    startOfDay(now),
                ),
            );

            const totalQuestions = primaryExamStats.overall_total || 0;
            const uniqueAttemptCount = primaryExamStats.overall_attempted || 0;
            const remainingQuestions = Math.max(totalQuestions - uniqueAttemptCount, 0);

            const dailyQuestionTarget =
                rawDaysBeforeComplete > 0
                    ? Math.ceil(remainingQuestions / rawDaysBeforeComplete)
                    : remainingQuestions;

            const overallUniqueProgressPercent =
                totalQuestions > 0 ? Math.round((uniqueAttemptCount / totalQuestions) * 100) : 0;

            const todayProgressPercent =
                dailyQuestionTarget > 0
                    ? Math.round((todayUniqueAttemptCount / dailyQuestionTarget) * 100)
                    : 0;

            // ==========================================
            // STEP 4: Update Global State
            // ==========================================
            setStats({
                progress: overallUniqueProgressPercent,
                accuracy: primaryExamStats.overall_accuracy || 0,
                subjectStats: defaultSubjectStats,
                subjectStatsMap: newSubjectStatsMap,
                question: new Set(), // Stripped out to save memory, assuming RPC handles uniqueness
                heatmapData: data.heatmap,
                streaks: {
                    current: data.streaks.study_current || 0,
                    longest: data.streaks.study_longest || 0,
                },
                studyPlan: {
                    totalQuestions,
                    uniqueAttemptCount,
                    remainingQuestions,
                    daysLeft: rawDaysLeft,
                    dailyQuestionTarget,
                    todayUniqueAttemptCount,
                    progressPercent: overallUniqueProgressPercent,
                    todayProgressPercent,
                    isTargetMetToday:
                        dailyQuestionTarget > 0 && todayUniqueAttemptCount >= dailyQuestionTarget,
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

    // Listener Effect: Waits for the "Signal" from Dashboard
    useEffect(() => {
        const handleRevisionUpdate = () => {
            fetchCurrentSet();
        };

        const handleStatsUpdate = () => {
            updateStats();
        };

        window.addEventListener('REVISION_UPDATED', handleRevisionUpdate);
        window.addEventListener('STATS_UPDATED', handleStatsUpdate);
        return () => {
            window.removeEventListener('REVISION_UPDATED', handleRevisionUpdate);
            window.removeEventListener('STATS_UPDATED', handleStatsUpdate);
        };
    }, [fetchCurrentSet, updateStats]);

    // The context provider makes the stats, loading state, and update function available to child components.
    return (
        <StatsContext.Provider value={{ stats, loading, updateStats }}>
            {children}
        </StatsContext.Provider>
    );
};

export default StatsProvider;
