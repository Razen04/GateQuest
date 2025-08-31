// src/lib/fetchQuestions.ts
import { describe, it, expect } from 'vitest';
import { supabase } from '../utils/supabaseClient.ts';

export async function fetchQuestions() {
    const { data, error } = await supabase.from('question_peer_stats').select('*').limit(5);

    if (error) throw new Error(error.message);
    return data;
}

describe('Supabase Query', () => {
    it('should return an array with at least 1 item', async () => {
        const data = await fetchQuestions();

        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBeGreaterThan(0);
    });
});
