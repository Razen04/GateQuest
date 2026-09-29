import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Stats, SubjectStat } from '@/shared/types/Stats.ts';
import type { DashboardResponse } from '@/shared/types/StatsType.js';
import { getUserProfile } from '@/shared/utils/helper.ts';
import { supabase } from '@/shared/utils/supabaseClient.ts';
import { useGoalStore } from './useGoalStore.ts';

const defaultStats: Stats = {
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
};

type StatsState = {
    stats: Stats;
    loading: boolean;

    updateStats: () => Promise<void>;
    setLoading: (value: boolean) => void;
};

export const useStatsStore = create<StatsState>()(
    devtools(
        (set) => ({
            stats: defaultStats,
            loading: true,

            setLoading: (value) =>
                set({ loading: value }, false, 'stats/setLoading'),

            updateStats: async () => {
                const user = getUserProfile();

                if (
                    !user ||
                    user.id === '1' ||
                    user.version_number === undefined
                ) {
                    set({ loading: false }, false, 'stats/updateStats:noUser');
                    return;
                }

                set({ loading: true }, false, 'stats/updateStats:start');

                try {
                    const { data, error } =
                        await supabase.rpc('get_my_dashboard');

                    if (error || !data) {
                        console.error('Supabase RPC error:', error);
                        return;
                    }

                    const dashboardData = data as unknown as DashboardResponse;

                    // Read cross-store value at call time
                    const userGoal = useGoalStore.getState().userGoal;

                    // Normalize active exams array
                    const rawTargetExams = userGoal?.target_exams || ['gate'];
                    const activeExams = Array.isArray(rawTargetExams)
                        ? rawTargetExams
                              .filter((e): e is string => typeof e === 'string')
                              .map((e) => e.toLowerCase())
                        : ['gate'];
                    const primaryExam = activeExams[0] || 'gate';

                    const findExamStats = (examName: string) => {
                        const keys = Object.keys(
                            dashboardData.exam_stats || {}
                        );
                        const matchKey = keys.find(
                            (k) => k.toLowerCase() === examName.toLowerCase()
                        );
                        return matchKey
                            ? dashboardData.exam_stats[matchKey]
                            : null;
                    };

                    const primaryExamStats = findExamStats(primaryExam) || {
                        overall_accuracy: 0,
                        overall_attempted: 0,
                        total_available: 0,
                        subjects: [],
                    };

                    const newSubjectStatsMap: Record<string, SubjectStat[]> =
                        {};
                    activeExams.forEach((exam) => {
                        const examData = findExamStats(exam);
                        const upperKey = exam.toUpperCase();
                        newSubjectStatsMap[upperKey] = examData?.subjects || [];
                    });

                    const defaultSubjectStats = primaryExamStats.subjects || [];

                    try {
                        localStorage.setItem(
                            'subjectStats',
                            JSON.stringify(defaultSubjectStats)
                        );
                    } catch (e) {
                        console.warn(
                            'Failed to save subjectStats to localStorage',
                            e
                        );
                    }

                    const totalQuestions =
                        primaryExamStats.total_available || 0;
                    const uniqueAttemptCount =
                        primaryExamStats.overall_attempted || 0;
                    const remainingQuestions = Math.max(
                        totalQuestions - uniqueAttemptCount,
                        0
                    );
                    const overallUniqueProgressPercent =
                        totalQuestions > 0
                            ? Math.round(
                                  (uniqueAttemptCount / totalQuestions) * 100
                              )
                            : 0;

                    const dbStats = dashboardData.dashboard_stats || {};

                    set(
                        {
                            stats: {
                                progress: overallUniqueProgressPercent,
                                accuracy:
                                    primaryExamStats.overall_accuracy || 0,
                                subjectStats: defaultSubjectStats,
                                subjectStatsMap: newSubjectStatsMap,
                                question: new Set(),
                                heatmapData: dashboardData.heatmap || [],
                                streaks: {
                                    learning_current:
                                        dashboardData.streaks
                                            ?.learning_current || 0,
                                    learning_longest:
                                        dashboardData.streaks
                                            ?.learning_longest || 0,
                                    study_current:
                                        dashboardData.streaks?.study_current ||
                                        0,
                                    study_longest:
                                        dashboardData.streaks?.study_longest ||
                                        0,
                                },
                                studyPlan: {
                                    totalQuestions,
                                    uniqueAttemptCount,
                                    remainingQuestions,
                                    daysLeft: dbStats.days_left || 0,
                                    dailyQuestionTarget:
                                        dbStats.daily_question_target || 0,
                                    todayUniqueAttemptCount:
                                        dbStats.today_unique_attempt_count || 0,
                                    progressPercent:
                                        overallUniqueProgressPercent,
                                    todayProgressPercent:
                                        dbStats.today_progress_percent || 0,
                                    isTargetMetToday:
                                        dbStats.is_target_met_today || false,
                                },
                            },
                        },
                        false,
                        'stats/updateStats:success'
                    );
                } catch (err) {
                    console.error('Failed to update stats:', err);
                } finally {
                    set({ loading: false }, false, 'stats/updateStats:end');
                }
            },
        }),
        { name: 'StatsStore' }
    )
);
