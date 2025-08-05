import React, { useState } from 'react'
import StatsContext from './StatsContext';
import { supabase } from '../../supabaseClient';
import subjects from '../data/subjects';

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
        if (!user || user.id === 1) {
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

        const totalQuestions = subjects.reduce((sum, s) => {
            if(s.category !== "bookmarked") {
                return sum+s.questions;
            }
            return sum;
        }, 0)
        console.log("totalQuestions: ", totalQuestions)
        const attempted = data.length;
        const correctAttempts = data.filter(q => q.was_correct == true).length

        let questionCounts = {};
        subjects.map((s) => {
            if(!questionCounts[s.apiName]) {
                questionCounts[s.apiName] = 0;
            }

            if(s.category !== "bookmarked") {
                questionCounts[s.apiName] = s.questions;
            }

            return questionCounts;
        })

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

        console.log("attempted: ", attempted)
        setStats({
            progress: Math.round((attempted / totalQuestions) * 100),
            accuracy: Math.round((correctAttempts / totalQuestions) * 100),
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