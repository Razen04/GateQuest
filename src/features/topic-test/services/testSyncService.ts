import { fetchFullTestData } from '../api/topicTest';
import { initializeTestSession } from './testSession';

export const syncTestFromSupabaseToDexie = async (
    userId: string | undefined,
    branchId: string | undefined
) => {
    if (!userId || !branchId) return;

    const { testSession, attempts, questions } = await fetchFullTestData(
        userId,
        branchId
    );

    if (!testSession || !attempts || !questions) return;

    // Mock sessions bypass Dexie entirely. Mock questions must never
    // enter the offline cache — they're fetched fresh from Supabase by
    // useMockSession (Phase 6) to close the devtools-extraction vector.
    if ((testSession as { paper_id?: string }).paper_id?.startsWith('mock-')) {
        return;
    }

    await initializeTestSession(testSession, attempts, questions);
};
