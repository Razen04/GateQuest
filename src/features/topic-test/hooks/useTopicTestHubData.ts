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
        setActiveTest(null);
        setHistory([]);
        setLoading(true);

        const loadData = async () => {
            if (!userId || !branchId) return;

            try {
                let localSession = await getOngoingTestSession(branchId);

                if (!localSession.length) {
                    await syncTestFromSupabaseToDexie(userId, branchId);
                    localSession = await getOngoingTestSession(branchId);
                }
                setActiveTest(localSession[0] || null);

                const { data: supaSessions, error: supaError } =
                    await fetchTestHistory(userId, branchId);

                if (supaError) {
                    console.error('Error fetching test history', supaError);
                    const localFallback =
                        (await getCompletedTestSessions(branchId)) ?? [];
                    setHistory(localFallback.slice(0, 10));
                } else if (supaSessions?.length) {
                    await cacheTestSessions(supaSessions);
                    const merged =
                        (await getCompletedTestSessions(branchId)) ?? [];
                    setHistory(merged.slice(0, 10));
                } else {
                    const localOnly =
                        (await getCompletedTestSessions(branchId)) ?? [];
                    setHistory(localOnly.slice(0, 10));
                }
            } catch (error) {
                console.error('Failed to load topic test hub data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [userId, branchId]);

    return { loading, activeTest, history };
};

export default useTopicTestHubData;
