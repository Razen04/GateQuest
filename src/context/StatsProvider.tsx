// This file provides a context for managing and calculating all user-related statistics.
// It fetches user activity from Supabase and computes metrics like progress, accuracy, study streaks for heatmap, and a personalized study plan.

import React, { useEffect, useState } from 'react';
import StatsContext from './StatsContext.js';
import { supabase } from '../utils/supabaseClient.ts';
import subjects from '../data/subjects.ts';
import {
    differenceInCalendarDays,
    parseISO,
    startOfDay,
    eachDayOfInterval,
    format,
    isAfter,
} from 'date-fns';
import type { Stats } from '../types/Stats.ts';
import type { Database } from '../types/supabase.ts';
import useSmartRevision from '@/hooks/useSmartRevision.ts';
import { getUserProfile } from '@/helper.ts';

type UserQuestionActivity = Database['public']['Tables']['user_question_activity']['Row'];

// The StatsProvider component orchestrates fetching and processing user activity data.
// It exposes the calculated stats, loading state, and an update function to its children.
const StatsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Holds all computed statistics and the loading state.
    const [stats, setStats] = useState<Stats>({
        progress: 0,
        accuracy: 0,
        subjectStats: [],
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

    // 1. Listener Effect: Waits for the "Signal" from Dashboard
    useEffect(() => {
        const handleRevisionUpdate = () => {
            fetchCurrentSet();
        };

        // Add listener
        window.addEventListener('REVISION_UPDATED', handleRevisionUpdate);

        // Cleanup on unmount
        return () => {
            window.removeEventListener('REVISION_UPDATED', handleRevisionUpdate);
        };
    }, [fetchCurrentSet]);

    useEffect(() => {
        let u = getUserProfile();
        if (!u || u.id === '1') {
            setLoading(false);
            return;
        }

        updateStats();
    }, [currentSet?.set_id]);

    // Fetches and processes all user activity data to build the stats object.
    const updateStats = async () => {
        const user = getUserProfile();

        // If there's no user or it's a guest user, we don't need to fetch stats.
        if (!user || user.id === '1' || user.version_number === undefined) {
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
            .eq('user_version_number', user.version_number)
            .order('attempted_at', { ascending: true })
            .overrideTypes<UserQuestionActivity[]>();

        if (error) {
            console.error('Supabase error:', error);
            setLoading(false);
            return;
        }

        // If there's no activity, initialize with an empty heatmap for the full year.
        if (!data || data.length === 0) {
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

        // Calculate the total number of questions available in the app, excluding bookmarks from the subjects.js file present in the data folder.
        const totalQuestions = subjects.reduce(
            (sum, s) => (s.category !== 'bookmarked' ? sum + s.questions : sum),
            0,
        );

        // --- Accuracy & Progress ---
        const attempted = data.length;
        const correctAttempts = data.filter((q) => q.was_correct).length;
        // A Set is used to count unique questions attempted for progress calculation.
        const uniqueQuestionSet = new Set(data.map((d) => d.question_id));
        const uniqueAttemptCount = uniqueQuestionSet.size;

        // --- Study Plan ---
        // These are key dates for calculating the study plan timeline.
        const GATE_EXAM_DATE = '2026-02-08';
        const QUESTIONS_COMPLETION_DATE = '2027-02-07';
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

        // The daily target is the remaining unique questions spread over the days left.
        const remainingQuestions = Math.max(totalQuestions - uniqueAttemptCount, 0);
        const dailyQuestionTarget =
            rawDaysBeforeComplete > 0
                ? Math.ceil(remainingQuestions / rawDaysBeforeComplete)
                : remainingQuestions;

        // To calculate today's progress, we count unique questions attempted today.
        // Using startOfDay ensures this calculation is robust across different timezones.
        const todayStart = startOfDay(now);
        const todayUniqueAttemptCount = new Set(
            data
                .filter((a) => a.attempted_at && startOfDay(parseISO(a.attempted_at)) >= todayStart)
                .map((a) => a.question_id),
        ).size;

        // Calculate the percentage of the study plan completed overall and for today.
        const overallUniqueProgressPercent = totalQuestions
            ? Math.round((uniqueAttemptCount / totalQuestions) * 100)
            : 0;
        const todayProgressPercent = dailyQuestionTarget
            ? Math.round((todayUniqueAttemptCount / dailyQuestionTarget) * 100)
            : 0;
        const isTargetMetToday =
            dailyQuestionTarget > 0 && todayUniqueAttemptCount >= dailyQuestionTarget;

        // --- Subject Stats ---
        // First, create a map of total questions per subject for later progress calculation.
        type QuestionCounts = Record<string, number>;
        const questionCounts: QuestionCounts = {};
        subjects.forEach((s) => {
            if (s.category !== 'bookmarked') {
                questionCounts[s.apiName] = s.questions;
            }
        });

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

        // Group all attempts by subject to calculate accuracy and progress for each.
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
        data.forEach(({ subject, was_correct, question_id }) => {
            if (subject && question_id) {
                if (!grouped[subject]) {
                    grouped[subject] = {
                        total: 0,
                        correct: 0,
                        attemptedQuestions: new Set(),
                        revisionAttemptedQuestionIds: new Set(),
                    };
                }

                if (revisedQuestionIds?.has(question_id)) {
                    grouped[subject].revisionAttemptedQuestionIds.add(question_id);
                }

                if (question_id) grouped[subject].attemptedQuestions.add(question_id);
                grouped[subject].total++;
                if (was_correct) grouped[subject].correct++;
            }
        });

        // Map the grouped data into the final subjectStats array format.
        const subjectStats = Object.entries(grouped).map(([subject, stats]) => {
            const totalAvailable = questionCounts[subject] || 1;
            const attemptedCount = stats.attemptedQuestions.size;
            return {
                subject,
                accuracy: Math.round((stats.correct / stats.total) * 100),
                progress: Math.round((attemptedCount / totalAvailable) * 100),
                attemptedQuestionIds: stats.attemptedQuestions,
                revisionAttemptedQuestionIds: stats.revisionAttemptedQuestionIds,
                attempted: attemptedCount,
                totalAvailable,
            };
        });

        // --- Heatmap ---
        // Count the number of attempts for each day.
        type AttemptsByDateType = Record<string, number>;
        const attemptsByDate: AttemptsByDateType = {};
        data.forEach((d) => {
            if (d.attempted_at) {
                const dateStr = format(parseISO(d.attempted_at), 'yyyy-MM-dd');
                attemptsByDate[dateStr] = (attemptsByDate[dateStr] || 0) + 1;
            }
        });

        // Create the full heatmap data structure, filling in days with no attempts with a count of 0.
        // This ensures the heatmap displays all days in the range, not just active ones.
        const mappedHeatmap = eachDayOfInterval({
            start: startDate,
            end: endDate,
        }).map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            return { date: dateStr, count: attemptsByDate[dateStr] || 0 };
        });

        // --- Streaks ---
        // To calculate streaks, we iterate through the sorted dates of activity, these are not yet displayed in the UI but soon will in future not yet sure where to place it.
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

        const question = new Set(data.map((d) => d.question_id).filter((id): id is string => !!id));

        // --- Final Set ---
        // Finally, update the main stats state with all the newly computed values.
        setStats({
            progress: overallUniqueProgressPercent,
            accuracy: attempted ? Math.round((correctAttempts / attempted) * 100) : 0,
            question: question,
            subjectStats,
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
    };

    // The context provider makes the stats, loading state, and update function available to child components.
    return (
        <StatsContext.Provider value={{ stats, loading, updateStats }}>
            {children}
        </StatsContext.Provider>
    );
};

export default StatsProvider;
