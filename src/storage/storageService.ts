import type { Attempt, Question, QuestionSyncMetadata, TestSession } from '@/types/storage';
import Dexie, { type Table } from 'dexie';

// Database name should not be changed ever
const DB_NAME = 'GATEQuestDB';

export class StorageService extends Dexie {
    // Tables
    questions!: Table<Question, string>;
    questions_sync_metadata!: Table<QuestionSyncMetadata, string>;
    sessions!: Table<TestSession, string>;
    attempts!: Table<Attempt, [string, string]>; // session_id+question_id

    constructor() {
        super(DB_NAME);

        // Schema definition
        this.version(2).stores({
            questions:
                'id, subject, topic, year, difficulty, marks, question_type, verified, *tags, metadata.set, [subject+topic], updated_at',
            questions_sync_metadata: 'subject, last_fetched_at, last_sync',
            sessions: 'id, status, is_synced',
            attempts: '[session_id+question_id], session_id, is_synced', // composite primary key
        });
    }
}

export const appStorage = new StorageService();
