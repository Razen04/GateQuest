import { initializeTestSession } from '@/storage/testSession';
import { supabase } from '@/utils/supabaseClient';

export const syncTestFromSupabaseToDexie = async (userId: string | undefined) => {
    if (!userId) return;

    // get the test session row
    const { data: testSession, error: sessionError } = await supabase
        .from('topic_tests')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['ongoing', 'paused', ['created']])
        .maybeSingle();

    if (sessionError) {
        console.error('Unable to get the test: ', sessionError);
        return;
    }

    if (!testSession) return;

    const testId = testSession.id;

    // get the attempts for that specific test session
    const { data: attempts, error: attemptsError } = await supabase
        .from('topic_tests_attempts')
        .select('*')
        .eq('session_id', testId);

    if (attemptsError) {
        console.error('Unable to get the attempts for the test: ', attemptsError);
        return;
    }

    // fetch the questions
    const questionIds = attempts.map((a) => a.question_id);

    const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .in('id', questionIds);

    if (questionsError) {
        console.error('Unable to get the questions for the test: ', questionsError);
        return;
    }

    // initializing things into Dexie
    await initializeTestSession(testSession, attempts, questions);
};
