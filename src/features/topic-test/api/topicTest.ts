import type { PyqPaper } from '@/shared/types/pyq';
import type { Attempt, Question } from '@/shared/types/storage';
import { supabase } from '@/shared/utils/supabaseClient';

type RawJoinedAttempt = {
    session_id: string;
    question_id: string;
    attempt_order: number | null;
    user_answer: number | number[] | null;
    marked_for_review: boolean | null;
    status: string | null;
    is_correct: boolean | null;
    score: number | null;
    time_spent_seconds: number | null;
    questions: Question | Question[] | null;
};

const toAttempt = (row: RawJoinedAttempt): Attempt => ({
    session_id: row.session_id,
    question_id: row.question_id,
    attempt_order: row.attempt_order ?? 0,
    user_answer: row.user_answer,
    marked_for_review: row.marked_for_review ?? false,
    status: row.status ?? 'unvisited',
    is_correct: row.is_correct ?? false,
    score: row.score ?? 0,
    time_spent_seconds: row.time_spent_seconds ?? 0,
    is_synced: 1,
});

// ---------- Test Session CRUD ----------
export const fetchTestById = async (testId: string) => {
    const { data, error } = await supabase
        .from('topic_tests')
        .select('*')
        .eq('id', testId)
        .single();
    return { data, error };
};

export const fetchTestHistory = async (userId: string, branchId: string) => {
    const { data, error } = await supabase
        .from('topic_tests')
        .select('*')
        .eq('user_id', userId)
        .eq('branch_id', branchId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(10);
    return { data, error };
};

export const getActiveTest = async (userId: string, branchId: string) => {
    const { data, error } = await supabase
        .from('topic_tests')
        .select('*')
        .eq('user_id', userId)
        .eq('branch_id', branchId)
        .in('status', ['ongoing', 'paused', 'created'])
        .maybeSingle();
    return { data, error };
};

export const updateTestStatus = async (
    testId: string,
    status: 'ongoing' | 'paused' | 'completed',
    extraFields?: Record<string, any>
) => {
    const { error } = await supabase
        .from('topic_tests')
        .update({
            status,
            ...extraFields,
            updated_at: new Date().toISOString(),
        })
        .eq('id', testId);
    return { error };
};

export const updateTestTime = async (
    testId: string,
    remainingSeconds: number
) => {
    const { error } = await supabase
        .from('topic_tests')
        .update({ remaining_time_seconds: remainingSeconds })
        .eq('id', testId);
    return { error };
};

// ---------- Attempts ----------
export const fetchAttemptsWithQuestions = async (testId: string) => {
    const { data, error } = await supabase
        .from('topic_tests_attempts')
        .select('*, questions(*)')
        .eq('session_id', testId)
        .order('attempt_order', { ascending: true });
    return { data, error };
};

export const upsertAttempts = async (payload: any[]) => {
    const { error } = await supabase
        .from('topic_tests_attempts')
        .upsert(payload, { onConflict: 'session_id, question_id' });
    return { error };
};

// ---------- Grading RPC ----------
export const submitTestGrading = async (
    sessionId: string,
    payload: Attempt[],
    remainingTime: number
) => {
    const { data, error } = await supabase.rpc('submit_test_grading', {
        p_session_id: sessionId,
        p_payload: payload,
        p_remaining_time_seconds: remainingTime,
    });
    return { data, error };
};

// ---------- Topics ----------
export const fetchTopicCounts = async (subjectId: string) => {
    const { data, error } = await supabase.rpc('get_topic_counts', {
        p_subject_id: subjectId,
    });
    return { data, error };
};

// ---------- Sync ----------
export const fetchQuestionsByIds = async (ids: string[]) => {
    const { data, error } = await supabase
        .from('questions')
        .select('*')
        .in('id', ids);
    return { data, error };
};

export const fetchFullTestData = async (userId: string, branchId: string) => {
    const { data: raw, error } = await supabase
        .from('topic_tests')
        .select(`
            *,
            topic_tests_attempts (
                *,
                questions (*)
            )
        `)
        .eq('user_id', userId)
        .eq('branch_id', branchId)
        .in('status', ['ongoing', 'paused', 'created'])
        .maybeSingle();

    if (error || !raw)
        return { testSession: null, attempts: null, questions: null };

    // Strip the join field so it never reaches Dexie (destructure, don't delete).
    const { topic_tests_attempts, ...testSession } = raw;
    const joined = (topic_tests_attempts ?? []) as RawJoinedAttempt[];

    const questions = joined.flatMap((row) =>
        row.questions
            ? Array.isArray(row.questions)
                ? row.questions
                : [row.questions]
            : []
    );

    const attempts: Attempt[] = joined.map(toAttempt);

    return { testSession, attempts, questions };
};

export const createTestFromPaper = async (
    paper: PyqPaper,
    branchId: string,
    recordActivity: boolean = true,
    optionalSubjectIds: string[] = []
) => {
    if (!paper.shift) return;
    const { data, error } = await supabase.rpc('create_test_from_paper', {
        p_paper_id: paper.id,
        p_paper_label: paper.label,
        p_year: paper.year,
        p_shift: paper.shift,
        p_branch: paper.branch,
        p_branch_id: branchId,
        p_duration_seconds: paper.durationMinutes * 60,
        p_record_activity: recordActivity,
        ...(optionalSubjectIds.length === 2
            ? { p_optional_subject_ids: optionalSubjectIds }
            : {}),
    });
    return { data, error };
};
