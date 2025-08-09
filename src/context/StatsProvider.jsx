import React, { useState } from 'react';
import StatsContext from './StatsContext';
import { supabase } from '../../supabaseClient';
import subjects from '../data/subjects';
import {
    differenceInCalendarDays,
    parseISO,
    startOfDay,
    eachDayOfInterval,
    format,
    isAfter
} from 'date-fns';

const StatsProvider = ({ children }) => {
    const [stats, setStats] = useState({
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
        }
    });

    const [loading, setLoading] = useState(true);

    const updateStats = async (user) => {
        if (!user || user.id === 1) {
            setLoading(false);
            return;
        }

        setLoading(true);

        // ✅ Define start/end dates ONCE
        const startDate = parseISO("2025-02-07");
        const endDate = parseISO("2026-02-07");

        // Prevent invalid range
        if (isAfter(startDate, endDate)) {
            console.error("Invalid date range for heatmap");
            setStats(prev => ({ ...prev, heatmapData: [] }));
            setLoading(false);
            return;
        }

        const { data, error } = await supabase
            .from('user_question_activity')
            .select('*')
            .eq('user_id', user.id)
            .order('attempted_at', { ascending: true });

        if (error) {
            console.error("Supabase error:", error);
            setLoading(false);
            return;
        }

        // --- If no activity, generate empty heatmap ---
        if (!data || data.length === 0) {
            const fallback = eachDayOfInterval({ start: startDate, end: endDate }).map(day => ({
                date: format(day, "yyyy-MM-dd"),
                count: 0
            }));
            setStats(prev => ({ ...prev, heatmapData: fallback }));
            setLoading(false);
            return;
        }

        // --- Total questions ---
        const totalQuestions = subjects.reduce((sum, s) =>
            s.category !== "bookmarked" ? sum + s.questions : sum, 0
        );

        // --- Accuracy & Progress ---
        const attempted = data.length;
        const correctAttempts = data.filter(q => q.was_correct).length;
        const uniqueQuestionSet = new Set(data.map(a => a.question_id));
        const uniqueAttemptCount = uniqueQuestionSet.size;

        // --- Study Plan ---
        const GATE_EXAM_DATE = '2026-02-07';
        const QUESTIONS_COMPLETION_DATE = '2026-01-15';
        const now = new Date();

        let rawDaysLeft = differenceInCalendarDays(startOfDay(parseISO(GATE_EXAM_DATE)), startOfDay(now));
        let rawDaysBeforeComplete = differenceInCalendarDays(startOfDay(parseISO(QUESTIONS_COMPLETION_DATE)), startOfDay(now));

        if (rawDaysLeft < 0) rawDaysLeft = 0;
        if (rawDaysBeforeComplete < 0) rawDaysBeforeComplete = 0;

        const remainingQuestions = Math.max(totalQuestions - uniqueAttemptCount, 0);
        const dailyQuestionTarget = rawDaysBeforeComplete > 0
            ? Math.ceil(remainingQuestions / rawDaysBeforeComplete)
            : remainingQuestions;

        // ✅ Timezone-safe today's unique attempts
        const todayStart = startOfDay(now);
        const todayUniqueAttemptCount = new Set(
            data.filter(a => a.attempted_at && startOfDay(parseISO(a.attempted_at)) >= todayStart)
                .map(a => a.question_id)
        ).size;

        const overallUniqueProgressPercent = totalQuestions
            ? Math.round((uniqueAttemptCount / totalQuestions) * 100)
            : 0;
        const todayProgressPercent = dailyQuestionTarget
            ? Math.round((todayUniqueAttemptCount / dailyQuestionTarget) * 100)
            : 0;
        const isTargetMetToday = dailyQuestionTarget > 0 && todayUniqueAttemptCount >= dailyQuestionTarget;

        // --- Subject Stats ---
        const questionCounts = {};
        subjects.forEach(s => {
            if (s.category !== "bookmarked") {
                questionCounts[s.apiName] = s.questions;
            }
        });

        const grouped = {};
        data.forEach(({ subject, was_correct, question_id }) => {
            if (!grouped[subject]) {
                grouped[subject] = { total: 0, correct: 0, attemptedQuestions: new Set() };
            }
            grouped[subject].total++;
            if (was_correct) grouped[subject].correct++;
            grouped[subject].attemptedQuestions.add(question_id);
        });

        const subjectStats = Object.entries(grouped).map(([subject, stats]) => {
            const totalAvailable = questionCounts[subject] || 1;
            const attemptedCount = stats.attemptedQuestions.size;
            return {
                subject,
                accuracy: Math.round((stats.correct / stats.total) * 100),
                progress: Math.round((attemptedCount / totalAvailable) * 100),
                attemptedQuestionIds: stats.attemptedQuestions,
                attempted: attemptedCount,
                totalAvailable
            };
        });

        // --- Heatmap (Exact Feb 7 → Feb 7 range) ---
        const attemptsByDate = {};
        data.forEach(d => {
            const dateStr = format(parseISO(d.attempted_at), "yyyy-MM-dd");
            attemptsByDate[dateStr] = (attemptsByDate[dateStr] || 0) + 1;
        });

        const mappedHeatmap = eachDayOfInterval({ start: startDate, end: endDate }).map(day => {
            const dateStr = format(day, "yyyy-MM-dd");
            return { date: dateStr, count: attemptsByDate[dateStr] || 0 };
        });

        // --- Streaks (timezone-safe) ---
        let currentStreak = 0, longestStreak = 0, prevDate = null;
        const sortedDates = Object.keys(attemptsByDate).sort();

        sortedDates.forEach(date => {
            const dateObj = parseISO(date);
            if (!prevDate || differenceInCalendarDays(dateObj, prevDate) === 1) {
                currentStreak++;
            } else {
                currentStreak = 1;
            }
            if (currentStreak > longestStreak) longestStreak = currentStreak;
            prevDate = dateObj;
        });
        const dateStr = format(new Date(), "yyyy-MM-dd");
        console.log("Today's heatmap entry:", stats.heatmapData.find(d => d.date === dateStr));

        // --- Final Set ---
        setStats({
            progress: Math.round((attempted / totalQuestions) * 100),
            accuracy: attempted ? Math.round((correctAttempts / attempted) * 100) : 0,
            question: new Set(data.map(d => d.question_id)),
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
            }
        });

        setLoading(false);
    };

    return (
        <StatsContext.Provider value={{ stats, loading, updateStats }}>
            {children}
        </StatsContext.Provider>
    );
};

export default StatsProvider;