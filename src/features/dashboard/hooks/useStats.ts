import { useContext } from 'react';
import StatsContext from '@/app/providers/StatsContext.ts';

export default function useStats() {
    const context = useContext(StatsContext);
    if (!context) {
        throw new Error('useStats must be used within a StatsProvider');
    }
    return context;
}
