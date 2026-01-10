import { createContext } from 'react';
import type useTestSession from '@/hooks/test-engine/useTestSession.ts';

type TestSessionContextType = ReturnType<typeof useTestSession> | null;

const TestSessionContext = createContext<TestSessionContextType>(null);
export default TestSessionContext;
