// src/features/topic-test/api/topicTest.ts
import { supabase } from '@/shared/utils/supabaseClient';
import type { Attempt, Question } from '@/shared/types/storage';

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
    extraFields?: Record<string, any>,
) => {
    const { error } = await supabase
        .from('topic_tests')
        .update({ status, ...extraFields, updated_at: new Date().toISOString() })
        .eq('id', testId);
    return { error };
};

export const updateTestTime = async (testId: string, remainingSeconds: number) => {
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
    remainingTime: number,
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
    const { data, error } = await supabase.from('questions').select('*').in('id', ids);
    return { data, error };
};

type RawAttemptData = Attempt & {
    questions: Question | Question[];
};

// Replace inside: src/features/topic-test/api/topicTest.ts
export const fetchFullTestData = async (userId: string, branchId: string) => {
    const { data: testSession, error } = await supabase
        .from('topic_tests')
        .select(
            `
            *,
            topic_tests_attempts (
                *,
                questions (*)
            )
        `,
        )
        .eq('user_id', userId)
        .eq('branch_id', branchId)
        .in('status', ['ongoing', 'paused', 'created'])
        .maybeSingle();

    if (error || !testSession) return { testSession: null, attempts: null, questions: null };

    const rawAttempts = testSession.topic_tests_attempts || [];

    // Safely extract questions, handling whether Supabase returned an object or a [array]
    const questions = rawAttempts
        .flatMap((a: RawAttemptData) => (Array.isArray(a.questions) ? a.questions : [a.questions]))
        .filter(Boolean);

    // Strip the nested 'questions' object out of attempts so Dexie doesn't crash
    const pureAttempts = rawAttempts.map(({ questions, ...rest }: RawAttemptData) => rest);

    // Clean up the main testSession
    delete testSession.topic_tests_attempts;

    return {
        testSession,
        attempts: pureAttempts,
        questions,
    };
};
