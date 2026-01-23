import { getTestSession } from '@/storage/testSession';
import type { Attempt, Question, TestSession } from '@/types/storage';
import { useEffect, useState } from 'react';

export type TestData = {
    session: TestSession;
    questions: Question[];
    attempts: Attempt[];
};

const useTestLoader = (testId: string) => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<TestData | null>(null);

    useEffect(() => {
        let mounted = true;
        (async () => {
            const testSession = await getTestSession(testId);
            if (!testSession) return;
            const session = testSession.session;

            const attempts = testSession.attempts;
            const questions = testSession.questions;

            if (mounted) {
                setData({ session, attempts, questions });
                setLoading(false);
            }
        })();

        return () => {
            mounted = false;
        };
    }, [testId]);

    return { data, loading };
};

export default useTestLoader;
