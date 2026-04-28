import { createContext } from 'react';
import type useTestSession from '@/features/topic-test/hooks/test-engine/useTestSession';
type TestSessionContextType = ReturnType<typeof useTestSession> | null;

const TestSessionContext = createContext<TestSessionContextType>(null);
export default TestSessionContext;
