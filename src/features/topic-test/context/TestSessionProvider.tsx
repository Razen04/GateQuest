import ModernLoader from '@/shared/components/ModernLoader';
import useTestLoader, {
    type TestData,
} from '@/features/topic-test/hooks/test-engine/useTestLoader';
import useTestSession from '@/features/topic-test/hooks/test-engine/useTestSession';
import React from 'react';
import TestSessionContext from './TestSessionContext';

interface TestSessionProviderPropTypes {
    testId: string;
    children: React.ReactNode;
}

interface InitializeTestSessionPropTypes {
    testId: string;
    data: TestData;
    children: React.ReactNode;
}

const InitializeTestSession = ({ testId, data, children }: InitializeTestSessionPropTypes) => {
    const engine = useTestSession(testId, data);

    return <TestSessionContext.Provider value={engine}>{children}</TestSessionContext.Provider>;
};

export const TestSessionProvider = ({ testId, children }: TestSessionProviderPropTypes) => {
    const { data, loading } = useTestLoader(testId);

    if (loading) {
        return <ModernLoader />;
    }

    if (!data) {
        return <div>failed to load test</div>;
    }

    return (
        <InitializeTestSession testId={testId} data={data}>
            {children}
        </InitializeTestSession>
    );
};
