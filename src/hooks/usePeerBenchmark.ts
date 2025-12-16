import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient.ts';
import type { Database } from '../types/supabase.ts';
import { toast } from 'sonner';
import { compress, decompress } from 'lz-string';

type Benchmark = Database['public']['Tables']['question_peer_stats']['Row'];

function getNextMidnight() {
    const now = new Date();
    now.setHours(24, 0, 0, 0);
    return now.getTime();
}

export function usePeerBenchmark(questionId: string | number) {
    const [benchmarkDetails, setBenchmarkDetails] = useState<Benchmark | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!questionId || questionId == 0) return;

        const fetchData = async (existingRows: Benchmark[]) => {
            setLoading(true);

            const { data, error } = await supabase
                .from('question_peer_stats')
                .select('*')
                .eq('question_id', questionId);

            if (error) {
                console.error('There was an error fetching the peer benchmark details.');
                toast.error('Unable to fetch peer benchmarks.');
                setLoading(false);
                return;
            }

            const newRow = data || [];
            const match = newRow.find((d) => String(d.question_id) === String(questionId));

            if (!match) {
                setMessage('You are the first to attempt this question!');
            } else {
                setBenchmarkDetails(match);
            }

            const otherRows = existingRows.filter(
                (r) => String(r.question_id) !== String(questionId),
            );
            const updatedCache = [...otherRows, ...newRow];

            try {
                localStorage.setItem(
                    'peer_benchmark_details',
                    compress(JSON.stringify({ rows: updatedCache, expiry: getNextMidnight() })),
                );
            } catch (e) {
                console.error('Failed to save benchmark cache', e);
            }

            setLoading(false);
        };

        let cachedRows: Benchmark[] = [];
        let cacheHit = false;

        try {
            const cached = localStorage.getItem('peer_benchmark_details');
            if (cached) {
                const parsed = JSON.parse(decompress(cached));

                if (parsed && Array.isArray(parsed.rows) && parsed.expiry > Date.now()) {
                    cachedRows = parsed.rows;

                    const match = cachedRows.find(
                        (d: Benchmark) => String(d.question_id) === String(questionId),
                    );

                    if (match) {
                        setBenchmarkDetails(match);
                        setLoading(false);
                        cacheHit = true;
                    }
                }
            }
        } catch (err) {
            console.error('Cache read error, clearing:', err);
            localStorage.removeItem('peer_benchmark_details');
        }

        if (!cacheHit) {
            fetchData(cachedRows);
        }
    }, [questionId]);

    return { benchmarkDetails, loading, message };
}
