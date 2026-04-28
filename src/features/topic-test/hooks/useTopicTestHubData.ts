import type { TestSession } from '@/shared/types/storage';
import { supabase } from '@/shared/utils/supabaseClient';
import { useEffect, useState } from 'react';
import { syncTestFromSupabaseToDexie } from '../services/testSyncService';
import { getOngoingTestSession } from '@/features/topic-test/services/testSession';

const useTopicTestHubData = (userId: string | undefined, branchId: string | undefined) => {
    const [activeTest, setActiveTest] = useState<TestSession | null>(null);
    const [history, setHistory] = useState<TestSession[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            if (!branchId) return;
            // first check in dexie for an activeTest
            let localSession = await getOngoingTestSession(branchId);

            if (!localSession.length) {
                await syncTestFromSupabaseToDexie(userId, branchId);
                localSession = await getOngoingTestSession(branchId);
            }

            setActiveTest(localSession[0] || null);

            // fetch last 10 completed tests
            const { data: supaTestSessions, error: supaError } = await supabase
                .from('topic_tests')
                .select('*')
                .eq('user_id', userId)
                .eq('branch_id', branchId)
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
    }, [userId, branchId]);

    return { loading, activeTest, history };
};

export default useTopicTestHubData;
