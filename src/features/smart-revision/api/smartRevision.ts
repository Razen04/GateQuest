import { supabase } from '@/shared/utils/supabaseClient';
import type { RevisionQuestion } from '@/shared/types/storage';

// --- Types ---
export type WeeklySet = {
    success: boolean;
    set_id: string;
    start_of_week: string;
    status: 'pending' | 'created' | 'started' | 'completed' | 'existing';
    created_at: string;
    started_at: string | null;
    expires_at: string | null;
    total_questions: number;
    correct_count: number;
    accuracy: number;
    questions: RevisionQuestion[];
    message: string;
};

export type StartWeeklySetResponse = {
    success: boolean;
    set_id: string;
    started_at: string | null;
    expires_at: string | null;
    message: string;
};

// --- API Methods ---
export const fetchWeeklySet = async (branchId: string) => {
    const { data, error } = await supabase
        .rpc('get_weekly_set', { p_branch_id: branchId })
        .single();

    return { data: data as unknown as WeeklySet, error };
};

export const generateWeeklySet = async (
    validSubjects: string[],
    targetExams: string[],
    branchId: string,
) => {
    const { data, error } = await supabase.rpc('generate_weekly_revision_set', {
        p_valid_subjects: validSubjects,
        p_target_exams: targetExams,
        p_branch_id: branchId,
    });

    return { data: data as unknown as WeeklySet, error };
};

export const startWeeklySet = async (setId: string) => {
    const { data, error } = await supabase
        .rpc('start_weekly_revision_set', { v_set_id: setId })
        .single();

    return { data: data as unknown as StartWeeklySetResponse, error };
};

export const fetchCriticalQuestionCount = async (
    validSubjects: string[],
    targetExams: string[],
) => {
    return await supabase.rpc('get_critical_question_count', {
        p_valid_subjects: validSubjects,
        p_target_exams: targetExams,
    });
};
