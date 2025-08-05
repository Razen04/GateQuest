import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { differenceInCalendarDays, parseISO, startOfDay } from "date-fns";

const useStudyPlan = ({ userId, totalQuestions = 817 }) => {
    const GATE_EXAM_DATE = "2026-02-01";
    const QUESTIONS_COMPLETION_DATE = "2026-01-15";
    const [dailyQuestionTarget, setDailyQuestionTarget] = useState(null);
    const [uniqueAttemptCount, setUniqueAttemptCount] = useState(0);
    const [todayUniqueAttemptCount, setTodayUniqueAttemptCount] = useState(0);
    const [daysLeft, setDaysLeft] = useState(0);
    const [isTargetMetToday, setIsTargetMetToday] = useState(false);
    const [progressPercent, setProgressPercent] = useState(0);
    const [todayProgressPercent, setTodayProgressPercent] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const compute = useCallback(async () => {
        if (!userId || !totalQuestions) return;

        setLoading(true);
        setError(null);

        try {
            const { data: attempts, error: fetchErr } = await supabase
                .from('user_question_activity')
                .select('question_id, attempted_at')
                .eq('user_id', userId);

            if (fetchErr) {
                throw fetchErr;
            }

            // Unique Questions attempted overall
            const uniqueQuestionSet = new Set(
                (attempts || []).map((a => a.question_id))
            );
            const uniqueCount = uniqueQuestionSet.size;

            // Compute Days Left
            const now = new Date();
            const targetDate = parseISO(GATE_EXAM_DATE);
            let rawDaysLeft = differenceInCalendarDays(
                startOfDay(targetDate),
                startOfDay(now)
            )

            const completionTargetDate = parseISO(QUESTIONS_COMPLETION_DATE);
            let rawDaysBeforeToCompleteQuestions = differenceInCalendarDays(
                startOfDay(completionTargetDate),
                startOfDay(now)
            )
            if (rawDaysLeft < 0) rawDaysLeft = 0;
            if (rawDaysBeforeToCompleteQuestions < 0) rawDaysBeforeToCompleteQuestions = 0;
            const effectiveDaysLeft = rawDaysLeft;
            const effectiveDaysLeftForCompletion = rawDaysBeforeToCompleteQuestions;

            const remainingQuestions = Math.max(totalQuestions - uniqueCount, 0);

            const perDayTarget = effectiveDaysLeftForCompletion > 0
                ? Math.ceil(remainingQuestions / effectiveDaysLeftForCompletion)
                : remainingQuestions;

            const todayStart = startOfDay(now);
            const todayQuestionSet = new Set(
                (attempts || []).filter((a) => {
                    if (!a.attempted_at) return false;
                    const at = new Date(a.attempted_at);
                    return at >= todayStart;
                }).map((a) => a.question_id)
            )
            const todayQuestionSetCount = todayQuestionSet.size;

            // Overall Progress
            const overallProgress = totalQuestions > 0
                ? Math.round((uniqueCount / totalQuestions) * 100)
                : 0

            const todayProgress = perDayTarget > 0
                ? Math.round((todayQuestionSetCount / perDayTarget) * 100)
                : 0

            setUniqueAttemptCount(uniqueCount);
            setTodayUniqueAttemptCount(todayQuestionSetCount);
            setDailyQuestionTarget(perDayTarget);
            setIsTargetMetToday(todayQuestionSetCount >= perDayTarget && perDayTarget > 0);
            setProgressPercent(overallProgress);
            setTodayProgressPercent(todayProgress);
            setDaysLeft(effectiveDaysLeft);
        } catch (e) {
            console.error("useStudyPlan error: ", e);
            setError(e);
        } finally {
            setLoading(false);
        }
    }, [userId, totalQuestions])

    useEffect(() => {
        compute()
    }, [compute])

    return {
        loading,
        error,
        uniqueAttemptCount, // total unique questions done
        todayUniqueAttemptCount, // unique done today
        dailyQuestionTarget,
        daysLeft,
        isTargetMetToday,
        progressPercent,
        todayProgressPercent,
        remainingQuestions: Math.max(totalQuestions - uniqueAttemptCount, 0),
        refresh: compute,
    }
}

export default useStudyPlan;