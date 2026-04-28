import { useContext } from 'react';
import TestSessionContext from '@/features/topic-test/context/TestSessionContext';

export default function useTest() {
    const context = useContext(TestSessionContext);
    if (!context) {
        throw new Error('useTest must be used within a TestSessionProvider');
    }
    return context;
}
