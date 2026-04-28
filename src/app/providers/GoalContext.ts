import type { Database } from '@/shared/types/supabase';
import { createContext } from 'react';

type Tables = Database['public']['Tables'];
export type Branch = Tables['branches']['Row'];
export type Exam = Tables['exams']['Row'];
export type BranchExam = Tables['branch_exams']['Row'];
export type Subject = Tables['subjects']['Row'];
export type UserGoal = Tables['user_goals']['Row'];
export type BranchSubjects = Tables['branch_subjects']['Row'];
export type ExamSubjects = Tables['exams_subjects']['Row'];

interface GoalContextType {
    branches: Branch[];
    exams: Exam[];
    branchExams: BranchExam[];
    subjects: Subject[];
    userGoal: UserGoal | null;
    loading: boolean;
    error: string | null;
    // Logic-derived helper
    setInitialGoal: (branchId: string, examIds: string[], silent: boolean) => Promise<void>;
    getPracticeSubjects: () => Subject[];
    isSubjectInGoal: (subjectId: string) => boolean | undefined;
    refresh: () => Promise<void>;
}

const GoalContext = createContext<GoalContextType | undefined>(undefined);
export default GoalContext;
