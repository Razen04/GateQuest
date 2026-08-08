import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { appStorage } from '@/storage/storageService';
import { type Benchmark, fetchQuestionPeerStats } from '../api/quesitons';

// 12 hours in milliseconds
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function usePeerBenchmark(questionId: string | number) {
    const [benchmarkDetails, setBenchmarkDetails] = useState<Benchmark | null>(
        null
    );
    const [loading, setLoading] = useState<boolean>(true);
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => {
        const strQuestionId = String(questionId);

        if (!UUID_REGEX.test(strQuestionId)) return;

        let isMounted = true;

        const loadBenchmark = async () => {
            try {
                setLoading(true);

                // Check IndexedDB first
                const cached =
                    await appStorage.peer_benchmarks.get(strQuestionId);

                if (cached && Date.now() - cached.fetched_at < CACHE_TTL_MS) {
                    if (isMounted) {
                        if (cached.data) {
                            setBenchmarkDetails(cached.data);
                        } else {
                            setMessage(
                                'You are the first to attempt this question!'
                            );
                        }
                        setLoading(false);
                    }
                    return;
                }

                // Cache miss or expired: Fetch from Supabase
                const { data, error } =
                    await fetchQuestionPeerStats(strQuestionId);

                if (error && error.code !== 'PGRST116') {
                    console.error('Error fetching peer benchmark:', error);
                    toast.error('Unable to fetch peer benchmarks.');
                    if (isMounted) setLoading(false);
                    return;
                }

                if (!data) {
                    if (isMounted)
                        setMessage(
                            'You are the first to attempt this question!'
                        );
                } else {
                    if (isMounted) setBenchmarkDetails(data);
                }

                await appStorage.peer_benchmarks.put({
                    question_id: strQuestionId,
                    data: data || null,
                    fetched_at: Date.now(),
                });
            } catch (err) {
                console.error('Failed to load benchmark:', err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        loadBenchmark();

        return () => {
            isMounted = false;
        };
    }, [questionId]);

    return { benchmarkDetails, loading, message };
}
