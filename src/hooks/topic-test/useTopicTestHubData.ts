import { appStorage } from '@/storage/storageService';
import type { TestSession } from '@/types/storage';
import { supabase } from '@/utils/supabaseClient';
import { useEffect, useState } from 'react';
import { syncTestFromSupabaseToDexie } from './service/testSyncService';

const useTopicTestHubData = (userId: string | undefined) => {
    const [activeTest, setActiveTest] = useState<TestSession | null>(null);
    const [history, setHistory] = useState<TestSession[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            // first check in dexie for an activeTest
            let localSession = await appStorage.sessions
                .where('status')
                .anyOf(['ongoing', 'paused', 'created'])
                .toArray();

            if (!localSession.length) {
                await syncTestFromSupabaseToDexie(userId);
                localSession = await appStorage.sessions
                    .where('status')
                    .anyOf(['ongoing', 'paused', 'created'])
                    .toArray();
            }

            setActiveTest(localSession[0] || null);

            // fetch last 10 completed tests
            const { data: supaTestSessions, error: supaError } = await supabase
                .from('topic_tests')
                .select('*')
                .eq('user_id', userId)
                .eq('status', 'completed')
                .order('completed_at', { ascending: false })
                .limit(10);

            if (supaError) {
                console.error('Error fetching test history', supaError);
            }

            setHistory(supaTestSessions || []);
            setLoading(false);
        };

        loadData();
    }, [userId]);

    return { loading, activeTest, history };
};

export default useTopicTestHubData;
