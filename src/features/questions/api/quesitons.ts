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

type Report = {
    user_id: string;
    question_id: string;
    report_type: string;
    report_text: string;
};

// Handle report
export const handleReport = async (report: Report) => {
    return await supabase.from('question_reports').insert([report]);
};
