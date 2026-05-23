// This file provides a context for managing and calculating all user-related statistics.
// It fetches user activity from Supabase and computes metrics like progress, accuracy, study streaks for heatmap, and a personalized study plan.

import React, { useEffect, useState, useCallback } from 'react';
import StatsContext from './StatsContext.js';
import { supabase } from '@/shared/utils/supabaseClient.ts';
import {
    differenceInCalendarDays,
    parseISO,
    startOfDay,
    eachDayOfInterval,
    format,
    isAfter,
} from 'date-fns';
import type { Stats, SubjectStat } from '@/shared/types/Stats.ts';
import type { Database } from '@/shared/types/supabase.ts';
import useSmartRevision from '@/features/smart-revision/hooks/useSmartRevision.ts';
import { getUserProfile } from '@/shared/utils/helper.ts';
import { useGoals } from '@/shared/hooks/useGoals.ts';

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

    //  Importing the dynamic goal data
    const { getPracticeSubjects, userGoal } = useGoals();

    // Fetches and processes all user activity data to build the stats object.
    const updateStats = useCallback(async () => {
        const user = getUserProfile();

        // If there's no user or it's a guest user, we don't need to fetch stats.
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

        // Define the fixed date range for the activity heatmap (one full year).
        const startDate = parseISO('2026-02-07');
        const endDate = parseISO('2027-04-07');

        // A sanity check to prevent errors if the date range is invalid.
        if (isAfter(startDate, endDate)) {
            console.error('Invalid date range for heatmap');
            setStats((prev) => ({ ...prev, heatmapData: [] }));
            setLoading(false);
            return;
        }

        // Fetch all question activity for the given user, ordered by time.
        const { data, error } = await supabase
            .from('v_user_cycle_stats')
            .select('*')
            .eq('user_id', user.id)
            .or(`branch_id.eq.${userGoal?.branch_id},is_universal.eq.true`)
            .eq('user_version_number', user.version_number)
            .order('attempted_at', { ascending: true })
            .overrideTypes<UserQuestionActivity[]>();

        if (error) {
            console.error('Supabase error:', error);
            setLoading(false);
            return;
        }

        // -- Goal Driven Filtering --
        // Fetch the subjects relevant to the user's current goal
        const practiceSubjects = getPracticeSubjects();

        // Identifying the active exams for the dashboard to filter accordingly. Ensure it defaults to an empty array.
        const activeExams = (userGoal?.target_exams as string[])?.map((e) => e.toUpperCase()) || [];

        // get actual subject count
        const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

        // Helper to cleanly fetch and cache RPC calls for different exam combinations
        const fetchExamCounts = async (examsToFetch: string[]) => {
            const cacheKey = `exam_counts_${examsToFetch.sort().join('_')}`;
            const cachedData = localStorage.getItem(cacheKey);

            if (cachedData) {
                const { data, timestamp } = JSON.parse(cachedData);
                if (Date.now() - timestamp < CACHE_DURATION) return data;
            }

            const { data, error } = await supabase.rpc('get_exam_subject_counts', {
                target_exams: examsToFetch,
            });

            if (!error && data) {
                localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
                return data;
            }
            if (error) console.error('RPC Error:', error);
            return [];
        };

        // 1. Fetch UNION counts (For Global Study Plan, prevents double counting)
        const unionExamCounts = await fetchExamCounts(activeExams);

        // 2. Fetch INDIVIDUAL counts (For Exam-Specific Subject Stats)
        const individualExamCounts: Record<string, any[]> = {};
        for (const exam of activeExams) {
            individualExamCounts[exam] = await fetchExamCounts([exam]);
        }

        const universalSubjectIds = new Set(
            practiceSubjects.filter((s) => s.is_universal).map((s) => s.id),
        );

        const globalData = (data || []).filter((d) => {
            if (d.subject_id && universalSubjectIds.has(d.subject_id)) return true;

            const examTags = (d.exam_tags as string[]) || [];
            return examTags.some((tag) => activeExams.includes(tag.toUpperCase()));
        });

        // If there's no activity for the active goals, initialize with an empty heatmap for the full year.
        if (globalData.length === 0 && (!data || data.length === 0)) {
            const fallback = eachDayOfInterval({
                start: startDate,
                end: endDate,
            }).map((day) => ({
                date: format(day, 'yyyy-MM-dd'),
                count: 0,
            }));
            setStats((prev) => ({ ...prev, heatmapData: fallback }));
            setLoading(false);
            return;
        }

        // --- Accuracy & Progress (Global) ---
        const attempted = globalData.length;
        const correctAttempts = globalData.filter((q) => q.was_correct).length;
        // A Set is used to count unique questions attempted for progress calculation.
        const uniqueQuestionSet = new Set(globalData.map((d) => d.question_id));
        const uniqueAttemptCount = uniqueQuestionSet.size;

        // --- Study Plan (Global) ---
        // These are key dates for calculating the study plan timeline.
        const GATE_EXAM_DATE = '2027-02-08';
        const QUESTIONS_COMPLETION_DATE = '2027-02-15';
        const now = new Date();

        // Calculate days left until the exam and until the target completion date.
        let rawDaysLeft = differenceInCalendarDays(
            startOfDay(parseISO(GATE_EXAM_DATE)),
            startOfDay(now),
        );
        let rawDaysBeforeComplete = differenceInCalendarDays(
            startOfDay(parseISO(QUESTIONS_COMPLETION_DATE)),
            startOfDay(now),
        );

        // Ensure days left don't go negative if the date has passed.
        if (rawDaysLeft < 0) rawDaysLeft = 0;
        if (rawDaysBeforeComplete < 0) rawDaysBeforeComplete = 0;

        // To calculate today's progress, we count unique questions attempted today.
        // Using startOfDay ensures this calculation is robust across different timezones.
        const todayStart = startOfDay(now);
        const todayUniqueAttemptCount = new Set(
            globalData
                .filter((a) => a.attempted_at && startOfDay(parseISO(a.attempted_at)) >= todayStart)
                .map((a) => a.question_id),
        ).size;

        // --- Smart Revision Data ---
        let revisedQuestionIds = new Set<string>();
        if (currentSet) {
            const { data: revisionData, error: revisionError } = await supabase
                .from('revision_set_questions')
                .select('question_id')
                .eq('set_id', currentSet.set_id)
                .not('is_correct', 'is', null);

            if (!revisionError && revisionData) {
                // Populate the Set immediately
                revisedQuestionIds = new Set(revisionData.map((r) => r.question_id));
            }
        }

        // --- Subject Stats Segregation (Exam-Specific) ---
        const subjectMetaMap = practiceSubjects.reduce(
            (acc, s) => {
                const specificCount = unionExamCounts?.find(
                    (ec) => ec.subject_id === s.id,
                )?.exam_specific_count;

                acc[s.id] = {
                    name: s.name,
                    slug: s.slug,
                    count: Number(specificCount) || 0,
                };
                return acc;
            },
            {} as Record<string, { name: string; slug: string; count: number }>,
        );

        // Calculate the total number of questions available in the app for the current goal.
        const totalQuestions = Object.values(subjectMetaMap).reduce(
            (sum, s) => sum + (s.count || 0),
            0,
        );

        // The daily target is the remaining unique questions spread over the days left.
        const remainingQuestions = Math.max(totalQuestions - uniqueAttemptCount, 0);
        const dailyQuestionTarget =
            rawDaysBeforeComplete > 0
                ? Math.ceil(remainingQuestions / rawDaysBeforeComplete)
                : remainingQuestions;

        // Calculate the percentage of the study plan completed overall and for today.
        const overallUniqueProgressPercent = totalQuestions
            ? Math.round((uniqueAttemptCount / totalQuestions) * 100)
            : 0;
        const todayProgressPercent = dailyQuestionTarget
            ? Math.round((todayUniqueAttemptCount / dailyQuestionTarget) * 100)
            : 0;
        const isTargetMetToday =
            dailyQuestionTarget > 0 && todayUniqueAttemptCount >= dailyQuestionTarget;

        const subjectStatsMap: Record<string, SubjectStat[]> = {};

        // Build the subject stats for each active exam using globalData
        activeExams.forEach((exam) => {
            const examData = globalData.filter((d) => {
                const isUniversal = d.subject_id && universalSubjectIds.has(d.subject_id);
                const matchesCurrentExam = ((d.exam_tags as string[]) || []).some(
                    (t) => t.toUpperCase() === exam,
                );

                return isUniversal || matchesCurrentExam;
            });

            type GroupedType = Record<
                string,
                {
                    total: number;
                    correct: number;
                    attemptedQuestions: Set<string>;
                    revisionAttemptedQuestionIds: Set<string>;
                }
            >;
            const grouped: GroupedType = {};

            examData.forEach((row) => {
                const groupKey = row.subject_id || row.subject;
                const { was_correct, question_id } = row;

                if (groupKey && question_id) {
                    if (!grouped[groupKey]) {
                        grouped[groupKey] = {
                            total: 0,
                            correct: 0,
                            attemptedQuestions: new Set(),
                            revisionAttemptedQuestionIds: new Set(),
                        };
                    }

                    if (revisedQuestionIds?.has(question_id)) {
                        grouped[groupKey].revisionAttemptedQuestionIds.add(question_id);
                    }

                    grouped[groupKey].attemptedQuestions.add(question_id);
                    grouped[groupKey].total++;
                    if (was_correct) grouped[groupKey].correct++;
                }
            });

            subjectStatsMap[exam] = Object.entries(grouped).map(([groupKey, stats]) => {
                // Safely lookup metadata whether the key is an id or a slug
                const meta =
                    subjectMetaMap[groupKey] ||
                    Object.values(subjectMetaMap).find((m) => m.slug === groupKey);

                const subjectId = practiceSubjects.find(
                    (s) => s.slug === meta?.slug || s.id === groupKey,
                )?.id;
                const examSpecificData = individualExamCounts[exam]?.find(
                    (ec) => ec.subject_id === subjectId,
                );
                const totalAvailable = Number(examSpecificData?.exam_specific_count) || 0;

                const attemptedCount = stats.attemptedQuestions.size;

                return {
                    subjectName: meta?.name || 'Unknown Subject',
                    subject: meta?.slug || groupKey,
                    accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
                    progress:
                        totalAvailable > 0
                            ? Math.round((attemptedCount / totalAvailable) * 100)
                            : 0,
                    attemptedQuestionIds: stats.attemptedQuestions,
                    revisionAttemptedQuestionIds: stats.revisionAttemptedQuestionIds,
                    attempted: attemptedCount,
                    totalAvailable,
                };
            });
        });

        // Write the first active exam's stats to localStorage so Practice.tsx can read the latest progress
        const firstExam = activeExams[0];
        const defaultSubjectStats = (firstExam ? subjectStatsMap[firstExam] : []) ?? [];
        localStorage.setItem('subjectStats', JSON.stringify(defaultSubjectStats));

        // --- Heatmap (Global) ---
        // Count the number of attempts for each day using the filtered globalData.
        type AttemptsByDateType = Record<string, number>;
        const attemptsByDate: AttemptsByDateType = {};
        globalData.forEach((d) => {
            if (d.attempted_at) {
                const dateStr = format(parseISO(d.attempted_at), 'yyyy-MM-dd');
                attemptsByDate[dateStr] = (attemptsByDate[dateStr] || 0) + 1;
            }
        });

        // Create the full heatmap data structure, filling in days with no attempts with a count of 0.
        const mappedHeatmap = eachDayOfInterval({
            start: startDate,
            end: endDate,
        }).map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            return { date: dateStr, count: attemptsByDate[dateStr] || 0 };
        });

        // --- Streaks (Global) ---
        let currentStreak = 0,
            longestStreak = 0,
            prevDate: Date | null = null;
        const sortedDates = Object.keys(attemptsByDate).sort();

        sortedDates.forEach((date) => {
            const dateObj = parseISO(date);
            // A streak continues if the next active day is exactly one day after the previous one.
            if (!prevDate || differenceInCalendarDays(dateObj, prevDate) === 1) {
                currentStreak++;
            } else {
                // Otherwise, the streak resets to 1.
                currentStreak = 1;
            }
            if (currentStreak > longestStreak) longestStreak = currentStreak;
            prevDate = dateObj;
        });

        const question = new Set(
            globalData.map((d) => d.question_id).filter((id): id is string => !!id),
        );

        // --- Final Set ---
        setStats({
            progress: overallUniqueProgressPercent,
            accuracy: attempted ? Math.round((correctAttempts / attempted) * 100) : 0,
            question: question,
            subjectStats: defaultSubjectStats, // The current default fallback for components not yet updated to use subjectStatsMap
            subjectStatsMap,
            heatmapData: mappedHeatmap,
            streaks: { current: currentStreak, longest: longestStreak },
            studyPlan: {
                totalQuestions,
                uniqueAttemptCount,
                remainingQuestions,
                daysLeft: rawDaysLeft,
                dailyQuestionTarget,
                todayUniqueAttemptCount,
                progressPercent: overallUniqueProgressPercent,
                todayProgressPercent,
                isTargetMetToday,
            },
        });

        setLoading(false);
    }, [currentSet, getPracticeSubjects, userGoal]);

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
