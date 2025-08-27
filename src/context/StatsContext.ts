import { createContext } from 'react';
import type { Stats } from '../types/Stats.ts';
import type { AppUser } from '../types/AppUser.ts';

type StatsContextType = {
    stats: Stats;
    loading: boolean;
    updateStats: (user: AppUser | null) => Promise<void>;
};

const StatsContext = createContext<StatsContextType | undefined>(undefined);
export default StatsContext;
