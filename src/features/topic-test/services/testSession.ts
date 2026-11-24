import type { Attempt, Question, TestSession } from '@/shared/types/storage';
import { appStorage } from '@/storage/storageService';
import { isOfficialMockPaper } from '../utils/mockState';

const db = appStorage;

// Write Methods
// Initialize test
const initializeTestSession = async (
    session: TestSession,
    attempts: Attempt[],
    questions: Question[]
) => {
    await db.transaction(
        'rw',
        db.sessions,
        db.attempts,
        db.questions,
        async () => {
            await db.sessions.put(session);
            await db.attempts.bulkPut(attempts);
            await db.questions.bulkPut(questions);
        }
    );
};

// Loading a test session
const getTestSession = async (sessionId: string) => {
    const session = await db.sessions.get(sessionId);
    if (!session) return null;

    const attempts = (
        await db.attempts.where('session_id').equals(sessionId).toArray()
    ).sort((a, b) => (a.attempt_order ?? 0) - (b.attempt_order ?? 0));

    // Dexie's anyOf().toArray() returns rows in key order, not in the order
    // of the supplied ids. Build the question list from the sorted attempts
    // so questions[] always matches attempt_order (GA section first).
    const questionIds = attempts.map((a) => a.question_id);
    const byId = new Map(
        questionIds.length
            ? (await db.questions.where('id').anyOf(questionIds).toArray()).map(
                  (q) => [q.id, q]
              )
            : []
    );

    const questions = questionIds
        .map((id) => byId.get(id))
        .filter((q): q is NonNullable<typeof q> => Boolean(q));

    return { session, attempts, questions };
};

const updateAttempts = async (
    testId: string,
    updatedAttempts: Attempt[],
    attempted: number,
    totalScore: number,
    correctCount: number
) => {
    await db.transaction('rw', db.attempts, db.sessions, async () => {
        await db.attempts.bulkPut(updatedAttempts);

        await db.sessions.update(testId, {
            score: totalScore,
            accuracy:
                attempted > 0
                    ? Math.round((correctCount / attempted) * 100)
                    : 0,
            correct_count: correctCount,
            attempted_count: attempted,
            status: 'completed',
            completed_at: new Date().toString(),
            is_synced: 0,
        });
    });
};

const getOngoingTestSession = async (branchId?: string) => {
    const sessions = await db.sessions
        .where('status')
        .anyOf(['ongoing', 'paused', 'created'])
        .toArray();

    if (branchId) {
        return sessions.filter((session) => session.branch_id === branchId);
    }

    return sessions;
};

const getCompletedTestSessions = async (branchId?: string) => {
    const sessions = await db.sessions
        .where('status')
        .equals('completed')
        .toArray();

    if (!branchId) return sessions;

    let filtered = sessions;
    if (branchId) {
        filtered = sessions.filter((s) => s.branch_id === branchId);

        return filtered.sort((a, b) => {
            const dateA = new Date(a.completed_at || 0).getTime();
            const dateB = new Date(b.completed_at || 0).getTime();
            return dateB - dateA;
        });
    }
};

const cacheTestSessions = async (sessions: TestSession[]) => {
    await db.sessions.bulkPut(sessions);
};

/**
 * Mirror the server retention rule in IndexedDB.
 *
 * Free users keep the newest `keep` completed non-mock sessions for a
 * branch. Official mock attempts are never pruned (they back the
 * leaderboard and the `already_attempted` gate), and unsynced sessions
 * are always kept because the server may not know about them yet.
 *
 * Pass `keep = null` for donors: unlimited history is never pruned.
 */
const pruneLocalHistory = async (
    branchId: string,
    keep: number | null
): Promise<number> => {
    if (keep === null) return 0;

    const sessions = await db.sessions
        .where('status')
        .equals('completed')
        .and((session) => session.branch_id === branchId)
        .toArray();

    const doomed = sessions
        .filter((session) => !isOfficialMockPaper(session.paper_id))
        .sort((a, b) => {
            const dateA = new Date(a.completed_at || 0).getTime();
            const dateB = new Date(b.completed_at || 0).getTime();
            return dateB - dateA;
        })
        .slice(keep)
        // is_synced is absent on rows cached from Supabase; only the
        // explicit 0 marker means "created locally, not uploaded yet".
        .filter((session) => session.is_synced !== 0)
        .map((session) => session.id);

    if (!doomed.length) return 0;

    await db.transaction('rw', db.sessions, db.attempts, async () => {
        await db.attempts.where('session_id').anyOf(doomed).delete();
        await db.sessions.bulkDelete(doomed);
    });

    return doomed.length;
};

// Saving an Attempt locally using saveAttempt method
const saveAttempt = async (attempt: Attempt) => {
    return await db.attempts.put(attempt); // put is used for upserting
};

// Updating session time and status
const updateSessionTimeAndStatus = async (
    sessionId: string,
    time: number,
    status: string
) => {
    const session = await db.sessions.get(sessionId);
    if (!session) return null;

    if (session.status === 'completed' && status !== 'completed') {
        return null;
    }

    const updateSession = {
        remaining_time_seconds: time,
        status: status,
        is_synced: 0,
    };

    await db.sessions.update(sessionId, updateSession);
};

const getAttemptsBySessionId = async (sessionId: string) => {
    return await db.attempts.where('session_id').equals(sessionId).toArray();
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
    cacheTestSessions,
    getAttemptsBySessionId,
    getCompletedTestSessions,
    getOngoingTestSession,
    getPendingAttempts,
    getPendingSessions,
    getTestSession,
    initializeTestSession,
    markAttemptsSynced,
    pruneLocalHistory,
    saveAttempt,
    updateAttempts,
    updateSessionTimeAndStatus,
};
