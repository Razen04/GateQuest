import { useEffect, useState } from 'react';
import {
    cacheTestSessions,
    getCompletedTestSessions,
    getOngoingTestSession,
} from '@/features/topic-test/services/testSession';
import type { TestSession } from '@/shared/types/storage';
import { fetchTestHistory } from '../api/topicTest';
import { syncTestFromSupabaseToDexie } from '../services/testSyncService';

const useTopicTestHubData = (
    userId: string | undefined,
    branchId: string | undefined
) => {
    const [activeTest, setActiveTest] = useState<TestSession | null>(null);
    const [history, setHistory] = useState<TestSession[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            if (!userId || !branchId) return;

            try {
                // 1. Handle Active Test
                let localSession = await getOngoingTestSession(branchId);

                if (!localSession.length) {
                    await syncTestFromSupabaseToDexie(userId, branchId);
                    localSession = await getOngoingTestSession(branchId);
                }
                setActiveTest(localSession[0] || null);

                // 2. Fetch history from local Dexie first
                let localHistory = await getCompletedTestSessions(branchId);

                // 3. If Dexie history is empty, fetch from Supabase and cache it
                if (localHistory && localHistory.length === 0) {
                    const { data: supaTestSessions, error: supaError } =
                        await fetchTestHistory(userId, branchId);

                    if (supaError) {
                    } else if (
                        supaTestSessions &&
                        supaTestSessions.length > 0
                    ) {
                        await cacheTestSessions(supaTestSessions);
                        localHistory = supaTestSessions;
                    }
                }

                setHistory(localHistory.slice(0, 10));
            } catch (_error) {
            } finally {
                // GUARANTEES the loading state is removed even if an error is thrown
                setLoading(false);
            }
        };

        loadData();
    }, [userId, branchId]);

    return { loading, activeTest, history };
};

export default useTopicTestHubData;
