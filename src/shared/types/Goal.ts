import type { Database } from './supabase';

type Tables = Database['public']['Tables'];
export type Branch = Tables['branches']['Row'];
export type Exam = Tables['exams']['Row'];
export type BranchExam = Tables['branch_exams']['Row'];
export type Subject = Tables['subjects']['Row'];
export type UserGoal = Tables['user_goals']['Row'];
export type BranchSubjects = Tables['branch_subjects']['Row'];
export type ExamSubjects = Tables['exams_subjects']['Row'];
