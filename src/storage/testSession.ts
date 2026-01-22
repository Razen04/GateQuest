import type { Attempt, Question, TestSession } from '@/types/storage';
import { appStorage } from './storageService';

const db = appStorage;

// Write Methods
// Initialize test
const initializeTestSession = async (
    session: TestSession,
    attempts: Attempt[],
    questions: Question[],
) => {
    await db.transaction('rw', db.sessions, db.attempts, db.questions, async () => {
        await db.sessions.put(session);
        await db.attempts.bulkPut(attempts);
        await db.questions.bulkPut(questions);
    });
};

// Loading a test session
const getTestSession = async (sessionId: string) => {
    const session = await db.sessions.get(sessionId);
    if (!session) return null;

    const attempts = await db.attempts.where('session_id').equals(sessionId).toArray();

    const questionIds = attempts.map((a) => a.question_id);

    const questions = questionIds.length
        ? await db.questions.where('id').anyOf(questionIds).toArray()
        : [];

    return { session, attempts, questions };
};

const updateAttempts = async (
    testId: string,
    updatedAttempts: Attempt[],
    attempted: number,
    totalScore: number,
    correctCount: number,
) => {
    await db.transaction('rw', db.attempts, db.sessions, async () => {
        await db.attempts.bulkPut(updatedAttempts);

        await db.sessions.update(testId, {
            score: totalScore,
            accuracy: attempted > 0 ? Math.round((correctCount / attempted) * 100) : 0,
            correct_count: correctCount,
            attempted_count: attempted,
            status: 'completed',
            completed_at: new Date().toString(),
            is_synced: 0,
        });
    });
};

const getOngoingTestSession = async () => {
    return await db.sessions.where('status').anyOf(['ongoing', 'paused', 'created']).toArray();
};

// Saving an Attempt locally using saveAttempt method
const saveAttempt = async (attempt: Attempt) => {
    return await db.attempts.put(attempt); // put is used for upserting
};

// Updating session time and status
const updateSessionTimeAndStatus = async (sessionId: string, time: number, status: string) => {
    const session = await db.sessions.get(sessionId);
    if (!session) return null;

    const updateSession = {
        remaining_time_seconds: time,
        status: status,
        is_synced: 0,
    };

    await db.sessions.update(sessionId, updateSession);
};

// Get pending sync attempts
const getPendingAttempts = async () => {
    return await db.attempts.where('is_synced').equals(0).toArray();
};

// Get pending sync session
const getPendingSessions = async () => {
    return await db.sessions.where('is_synced').equals(0).toArray();
};

const markAttemptsSynced = async (attempts: Attempt[]) => {
    db.attempts.bulkPut(attempts.map((a) => ({ ...a, is_synced: 1 })));
};

export {
    initializeTestSession,
    getTestSession,
    saveAttempt,
    updateSessionTimeAndStatus,
    getPendingAttempts,
    getPendingSessions,
    markAttemptsSynced,
    updateAttempts,
    getOngoingTestSession,
};
