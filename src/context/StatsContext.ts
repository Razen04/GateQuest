import { createContext } from 'react';
import type { Stats } from '../types/Stats.ts';

type StatsContextType = {
    stats: Stats;
    loading: boolean;
    updateStats: () => Promise<void>;
};

const StatsContext = createContext<StatsContextType | undefined>(undefined);
export default StatsContext;
