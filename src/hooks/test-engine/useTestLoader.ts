import { appStorage } from '@/storage/storageService';
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
            const session = await appStorage.sessions.get(testId);
            if (!session) return;

            const attempts = await appStorage.attempts.where('session_id').equals(testId).toArray();
            const questionIds = attempts.map((a) => a.question_id);
            const questions = await appStorage.questions.where('id').anyOf(questionIds).toArray();

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
