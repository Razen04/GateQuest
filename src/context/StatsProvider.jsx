import React, { useState } from 'react'
import StatsContext from './StatsContext';
import { getUserProfile } from '../helper'
import { supabase } from '../../supabaseClient';

const StatsProvider = ({ children }) => {

    const [stats, setStats] = useState({
        progress: 0
    });
    const [loading, setLoading] = useState(true)

    const updateStats = async (isLogin) => {

        if(!isLogin) {
            console.log("Not Running updateStats");
            return;
        }
        
        console.log("Running updateStats")
        setLoading(true);

        const user = getUserProfile();
        if (!user) {
            setLoading(false);
            return;
        }

        const { data, error } = await supabase.from('user_question_activity').select('*').eq('user_id', user.id);

        if (error || !data) {
            setLoading(false);
            return;
        }

        console.log("Data: ", data)
        const totalQuestions = 200;
        const attempted = data.length;
        const correct = data.filter(q => q.was_correct).length;

        setStats({
            progress: attempted && totalQuestions ? Math.round((attempted) / totalQuestions) * 100 : 0
        });

        setLoading(false);
    }

    return (
        <StatsContext.Provider value={{ stats, loading, updateStats }}>{children}</StatsContext.Provider>
    )
}

export default StatsProvider