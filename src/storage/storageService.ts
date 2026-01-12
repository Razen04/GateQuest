import type { Attempt, Question, TestSession } from '@/types/storage';
import Dexie, { type Table } from 'dexie';

// Database name should not be changed ever
const DB_NAME = 'TopicTestDB';

export class StorageService extends Dexie {
    // Tables
    questions!: Table<Question, string>;
    sessions!: Table<TestSession, string>;
    attempts!: Table<Attempt, [string, string]>; // session_id+question_id

    constructor() {
        super(DB_NAME);

        // Schema definition
        this.version(1).stores({
            questions: 'id, topic',
            sessions: 'id, status, is_synced',
            attempts: '[session_id+question_id], session_id, is_synced', // composite primary key
        });
    }

    // Write Methods
    // Initialize test
    async initializeTestSession(session: TestSession, attempts: Attempt[], questions: Question[]) {
        await this.transaction('rw', this.sessions, this.attempts, this.questions, async () => {
            await this.sessions.put(session);
            await this.attempts.bulkPut(attempts);
            await this.questions.bulkPut(questions);
        });
    }

    // Loading a test session
    async getTestSession(sessionId: string) {
        const session = await this.sessions.get(sessionId);
        if (!session) return null;

        const attempts = await this.attempts.where('session_id').equals(sessionId).toArray();

        const questionIds = attempts.map((a) => a.question_id);

        const questions = questionIds.length
            ? await this.questions.where('id').anyOf(questionIds).toArray()
            : [];

        return { session, attempts, questions };
    }

    // Saving an Attempt locally using saveAttempt method
    saveAttempt(attempt: Attempt) {
        return this.attempts.put(attempt); // put is used for upserting
    }

    // Updating session time and status
    async updateSessionTimeAndStatus(sessionId: string, time: number, status: string) {
        const session = await this.sessions.get(sessionId);
        if (!session) return null;

        const updateSession = {
            remaining_time_seconds: time,
            status: status,
            is_synced: 0,
        };

        await this.sessions.update(sessionId, updateSession);
    }

    // Get pending sync attempts
    getPendingAttempts() {
        return this.attempts.where('is_synced').equals(0).toArray();
    }

    // Get pending sync session
    getPendingSessions() {
        return this.sessions.where('is_synced').equals(0).toArray();
    }
}

export const appStorage = new StorageService();
