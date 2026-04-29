import { useEffect, useState } from 'react';
import { supabase } from '@/shared/utils/supabaseClient';
import type { Database } from '@/shared/types/supabase';
import { toast } from 'sonner';
import { appStorage } from '@/storage/storageService';

type Benchmark = Database['public']['Tables']['question_peer_stats']['Row'];

// 12 hours in milliseconds
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;

export function usePeerBenchmark(questionId: string | number) {
    const [benchmarkDetails, setBenchmarkDetails] = useState<Benchmark | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!questionId || questionId == 0) return;

        let isMounted = true;
        const strQuestionId = String(questionId);

        const loadBenchmark = async () => {
            try {
                setLoading(true);

                // Check IndexedDB first
                const cached = await appStorage.peer_benchmarks.get(strQuestionId);

                if (cached && Date.now() - cached.fetched_at < CACHE_TTL_MS) {
                    if (isMounted) {
                        if (cached.data) {
                            setBenchmarkDetails(cached.data);
                        } else {
                            setMessage('You are the first to attempt this question!');
                        }
                        setLoading(false);
                    }
                    return;
                }

                // Cache miss or expired: Fetch from Supabase
                const { data, error } = await supabase
                    .from('question_peer_stats')
                    .select('*')
                    .eq('question_id', questionId);

                if (error) {
                    console.error('Error fetching peer benchmark:', error);
                    toast.error('Unable to fetch peer benchmarks.');
                    if (isMounted) setLoading(false);
                    return;
                }

                const match = data?.find((d) => String(d.question_id) === strQuestionId);

                if (!match) {
                    if (isMounted) setMessage('You are the first to attempt this question!');
                } else {
                    if (isMounted) setBenchmarkDetails(match);
                }

                await appStorage.peer_benchmarks.put({
                    question_id: strQuestionId,
                    data: match || null,
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
