import { fetchFullTestData } from '../api/topicTest';
import { initializeTestSession } from './testSession';

export const syncTestFromSupabaseToDexie = async (
    userId: string | undefined,
    branchId: string | undefined,
) => {
    if (!userId || !branchId) return;

    const { testSession, attempts, questions } = await fetchFullTestData(userId, branchId);

    if (!testSession || !attempts || !questions) return;

    await initializeTestSession(testSession, attempts, questions);
};
