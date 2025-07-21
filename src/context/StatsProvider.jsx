import React, { useState } from 'react'
import StatsContext from './StatsContext';
import { supabase } from '../../supabaseClient';

const INACTIVITY_THRESHOLD_MINUTES = 10;

function calculateStudyTime(attempts) {
    if (!attempts || attempts.length === 0) return 0;

    const sorted = attempts
        .filter(a => a.attempted_at)
        .sort((a, b) => new Date(a.attempted_at) - new Date(b.attempted_at));

    let totalMillis = 0;
    for (let i = 1; i < sorted.length; i++) {
        const prev = new Date(sorted[i - 1].attempted_at);
        const curr = new Date(sorted[i].attempted_at);
        const diff = curr - prev;

        // If diff < 15 minutes, count it
        if (diff <= INACTIVITY_THRESHOLD_MINUTES * 60 * 1000) {
            totalMillis += diff;
        }
    }

    return Math.round(totalMillis / (1000 * 3600)).toFixed(2); // in seconds
}

const StatsProvider = ({ children }) => {

    const [stats, setStats] = useState({
        progress: 0,
        accuracy: 0,
        totalTime: 0
    });
    const [loading, setLoading] = useState(true)

    const updateStats = async (userData) => {

        if (!userData) {
            return;
        }

        setLoading(true);

        const user = userData;
        if (!user) {
            setLoading(false);
            return;
        }

        const { data, error } = await supabase.from('user_question_activity').select('*').eq('user_id', user.id);

        if (error) {
            console.error("Supabase error:", error);
            setLoading(false);
            return;
        }

        if (!data || data.length === 0) {
            console.warn("No matching user activity found for user ID:", user.id);
            setLoading(false);
            return;
        }

        const totalQuestions = 382;
        const attempted = data.length;
        const correctAttempts = data.filter(q => q.was_correct == true).length
        const totalStudyTime = calculateStudyTime(data)

        // calculating each subject stats
        const questionCounts = { "CO & Architecture": 146, "Aptitude": 236 };

        const grouped = {};

        data.forEach(({ subject, was_correct, question_id }) => {
            if (!grouped[subject]) {
                grouped[subject] = { total: 0, correct: 0, attemptedQuestions: new Set() }
            }

            grouped[subject].total++;
            if (was_correct) grouped[subject].correct++;
            grouped[subject].attemptedQuestions.add(question_id);
        })

        const result = Object.entries(grouped).map(([subject, stats]) => {
            const totalAvailable = questionCounts[subject] || 1;
            const attemptedQuestionIds = stats.attemptedQuestions;
            const attempted = stats.attemptedQuestions.size;

            return {
                subject,
                accuracy: Math.round((stats.correct / stats.total) * 100),
                progress: Math.round((attempted / totalAvailable) * 100),
                attemptedQuestionIds: attemptedQuestionIds,
                attempted: attempted,
                totalAvailable
            }
        })

        setStats({
            progress: Math.round((attempted / totalQuestions) * 100),
            accuracy: Math.round((correctAttempts / totalQuestions) * 100),
            totalTime: totalStudyTime,
            question: new Set(data.question_id),
            subjectStats: result
        });

        setLoading(false);
    }

    return (
        <StatsContext.Provider value={{ stats, loading, updateStats }}>{children}</StatsContext.Provider>
    )
}

export default StatsProvider