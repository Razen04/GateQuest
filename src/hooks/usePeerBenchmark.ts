import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient.ts';
import type { Database } from '../types/supabase.ts';

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
        if (!questionId) return;

        const cached = localStorage.getItem('peer_benchmark_details');

        if (cached) {
            const { rows, expiry } = JSON.parse(cached);

            if (Date.now() < expiry) {
                const questionDetails = rows.find(
                    (d: Benchmark) => String(d.question_id) === String(questionId),
                );

                if (!questionDetails) {
                    setMessage('Your are the first to attempt this question!');
                } else {
                    console.log('questionDetails: ', questionDetails);
                    setBenchmarkDetails(questionDetails);
                }
                setLoading(false);
                return;
            }
        }

        const fetchData = async () => {
            setLoading(true);

            const { data, error } = await supabase.from('question_peer_stats').select('*');

            if (error) {
                console.error('There was an error fetching the peer benchmark details.');
                setLoading(false);
                return;
            }

            localStorage.setItem(
                'peer_benchmark_details',
                JSON.stringify({ rows: data ?? [], expiry: getNextMidnight() }),
            );

            const questionDetails = data.find(
                (d: Benchmark) => String(d.question_id) === String(questionId),
            );

            if (!questionDetails) {
                setMessage('Your are the first to attempt this question!');
            } else {
                setBenchmarkDetails(questionDetails);
            }
            setLoading(false);
        };

        fetchData();
    }, [questionId]);

    return { benchmarkDetails, loading, message };
}
