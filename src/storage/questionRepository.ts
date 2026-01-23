import type { Question } from '@/types/storage';
import { appStorage } from './storageService';
const db = appStorage;

const getQuestionsBySubject = async (subject: string) => {
    return await db.questions.where('subject').equals(subject).toArray();
};

const getAllQuestions = async () => {
    return await db.questions.toArray();
};

const getQuestionByIds = async (ids: string[]) => {
    return await db.questions.where('id').anyOf(ids).toArray();
};

const getSubjectSyncMetadata = async (subject: string) => {
    return await db.questions_sync_metadata.get(subject);
};

// Write methods
const bulkUpsertQuestions = async (questions: Question[]) => {
    if (questions.length === 0) return;
    await db.questions.bulkPut(questions);
};

const updateSubjectSyncMetadata = async (subject: string, last_fetched_at?: string | undefined) => {
    let payload;
    if (!last_fetched_at) {
        payload = { subject, last_sync: Date.now().toString() };
        await db.questions_sync_metadata.update(subject, payload);
    } else {
        payload = {
            subject,
            last_fetched_at,
            last_sync: Date.now().toString(),
        };
        await db.questions_sync_metadata.put(payload);
    }
};

export {
    getQuestionsBySubject,
    getAllQuestions,
    getQuestionByIds,
    bulkUpsertQuestions,
    getSubjectSyncMetadata,
    updateSubjectSyncMetadata,
};
