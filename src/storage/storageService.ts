import type { Attempt, Question, TestSession } from '@/types/storage';
import Dexie, { type Table } from 'dexie';

// Database name should not be changed ever
const DB_NAME = 'GATEQuestDB';

export class StorageService extends Dexie {
    // Tables
    questions!: Table<Question, string>;
    sessions!: Table<TestSession, string>;
    attempts!: Table<Attempt, [string, string]>; // session_id+question_id

    constructor() {
        super(DB_NAME);

        // Schema definition
        this.version(2).stores({
            questions:
                'id, subject, topic, year, difficulty, marks, question_type, verified, *tags, metadata.set, [subject+topic], updated_at',
            sessions: 'id, status, is_synced',
            attempts: '[session_id+question_id], session_id, is_synced', // composite primary key
        });
    }
}

export const appStorage = new StorageService();
