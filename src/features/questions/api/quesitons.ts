import { supabase } from '@/shared/utils/supabaseClient';
import type { Database } from '@/shared/types/supabase';

export type Benchmark = Database['public']['Tables']['question_peer_stats']['Row'];

export async function fetchQuestionPeerStats(questionId: string) {
    return await supabase
        .from('question_peer_stats')
        .select('*')
        .eq('question_id', questionId)
        .maybeSingle();
}
