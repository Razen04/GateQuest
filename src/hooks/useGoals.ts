import GoalContext from '@/context/GoalContext';
import { useContext } from 'react';

export const useGoals = () => {
    const context = useContext(GoalContext);
    if (!context) throw new Error('useGoals must be used within a GoalProvider');
    return context;
};
