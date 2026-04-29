import type { Attempt, Question, QuestionSyncMetadata, TestSession } from '@/shared/types/storage';
import type { Database } from '@/shared/types/supabase';
import Dexie, { type Table } from 'dexie';

export type BenchmarkRow = Database['public']['Tables']['question_peer_stats']['Row'];
export interface PeerBenchmarkCache {
    question_id: string;
    data: BenchmarkRow | null;
    fetched_at: number;
}

// Database name should not be changed ever
const DB_NAME = 'GATEQuestDB';

export class StorageService extends Dexie {
    // Tables
    questions!: Table<Question, string>;
    questions_sync_metadata!: Table<QuestionSyncMetadata, string>;
    sessions!: Table<TestSession, string>;
    attempts!: Table<Attempt, [string, string]>; // session_id+question_id
    peer_benchmarks!: Table<PeerBenchmarkCache, string>;

    constructor() {
        super(DB_NAME);

        // Schema definition
        this.version(4)
            .stores({
                questions:
                    'id, subject, subject_id, topic, year, difficulty, marks, question_type, verified, *tags, metadata.set, metadata.exam, [subject_id+topic], updated_at',
                questions_sync_metadata: 'subject_id, last_fetched_at, last_sync',
                sessions: 'id, status, branch_id, is_synced',
                attempts: '[session_id+question_id], session_id, is_synced', // composite primary key
                peer_benchmarks: 'question_id',
            })
            .upgrade(async (tx) => {
                // clear old cache
                await tx.table('questions').clear();
                await tx.table('questions_sync_metadata').clear();
            });
    }

    // nuke the entire Db when doing logout.
    async nuke() {
        try {
            this.close();
            await Dexie.delete(DB_NAME);
            console.log('IndexedDB deleted successfully');
        } catch (error) {
            console.error('Error nuking IndexedDB:', error);
            throw error;
        }
    }
}

export const appStorage = new StorageService();
