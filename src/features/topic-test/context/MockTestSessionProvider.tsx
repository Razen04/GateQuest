import React from 'react';
import useMockTestLoader from '@/features/topic-test/hooks/test-engine/useMockTestLoader';
import type { TestData } from '@/features/topic-test/hooks/test-engine/useTestLoader';
import useTestSession from '@/features/topic-test/hooks/test-engine/useTestSession';
import ModernLoader from '@/shared/components/ModernLoader';
import TestSessionContext from './TestSessionContext';

interface MockTestSessionProviderProps {
    testId: string;
    children: React.ReactNode;
}

interface InitializeMockTestSessionProps {
    testId: string;
    data: TestData;
    children: React.ReactNode;
}

const InitializeMockTestSession = ({
    testId,
    data,
    children,
}: InitializeMockTestSessionProps) => {
    const engine = useTestSession(
        testId,
        data,
        (id) => `/mock-tests/result/${id}`
    );

    return (
        <TestSessionContext.Provider value={engine}>
            {children}
        </TestSessionContext.Provider>
    );
};

export const MockTestSessionProvider = ({
    testId,
    children,
}: MockTestSessionProviderProps) => {
    const { data, loading, error } = useMockTestLoader(testId);

    if (loading) return <ModernLoader />;

    if (error || !data) {
        return (
            <div className="p-8 text-center text-destructive">
                {error ?? 'Failed to load mock test.'}
            </div>
        );
    }

    return (
        <InitializeMockTestSession testId={testId} data={data}>
            {children}
        </InitializeMockTestSession>
    );
};
