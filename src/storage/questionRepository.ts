import type { Question } from '@/types/storage';
import { appStorage } from './storageService';
const db = appStorage;

const getQuestionsBySubject = async (subject: string) => {
    return await db.questions.where('subject').equals(subject).toArray();
};

const getAllQuestions = async () => {
    return await db.questions.toArray();
};

// Write methods
const bulkUpsertQuestions = async (questions: Question[]) => {
    await db.questions.bulkPut(questions);
};

export { getQuestionsBySubject, getAllQuestions, bulkUpsertQuestions };
