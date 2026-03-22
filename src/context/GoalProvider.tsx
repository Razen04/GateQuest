import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { toast } from 'sonner';
import type {
    Branch,
    BranchExam,
    BranchSubjects,
    Exam,
    ExamSubjects,
    Subject,
    UserGoal,
} from './GoalContext';
import GoalContext from './GoalContext';

export const GoalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [exams, setExams] = useState<Exam[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [userGoal, setUserGoal] = useState<UserGoal | null>(null);
    const [branchSubjects, setBranchSubjects] = useState<BranchSubjects[]>([]);
    const [examSubjects, setExamSubjects] = useState<ExamSubjects[]>([]);
    const [branchExams, setBranchExams] = useState<BranchExam[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchedRef = useRef(false);

    const fetchData = useCallback(async (force = false) => {
        const {
            data: { session },
        } = await supabase.auth.getSession();

        if (!session || (fetchedRef.current && !force)) return;
        try {
            setLoading(true);
            fetchedRef.current = true;

            // Fetch all metadata and user goals in parallel
            const [
                resBranches,
                resExams,
                resSubjects,
                resUserGoal,
                resBS, // branch_subjects mapping
                resES, // exams_subjects mapping
                resBE, // branch_exams mapping
            ] = await Promise.all([
                supabase.from('branches').select('*'),
                supabase.from('exams').select('*'),
                supabase.from('subjects').select('*'),
                supabase.from('user_goals').select('*').eq('is_active', true).maybeSingle(),
                supabase.from('branch_subjects').select('*'),
                supabase.from('exams_subjects').select('*'),
                supabase.from('branch_exams').select('*'),
            ]);

            if (resBranches.error) throw resBranches.error;
            if (resExams.error) throw resExams.error;
            if (resSubjects.error) throw resSubjects.error;
            if (resBS.error) throw resBS.error;
            if (resES.error) throw resES.error;
            if (resBE.error) throw resBE.error;

            setBranches(resBranches.data || []);
            setExams(resExams.data || []);
            setSubjects(resSubjects.data || []);
            setUserGoal(resUserGoal.data || null);
            setBranchSubjects(resBS.data || []);
            setExamSubjects(resES.data || []);
            setBranchExams(resBE.data || []);
        } catch (err: unknown) {
            fetchedRef.current = false;
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('An unexpected error occured.');
            }
            toast.error('Failed to sync goal data');
        } finally {
            setLoading(false);
        }
    }, []);

    // Inside GoalProvider.tsx
    useEffect(() => {
        // Listen for auth changes to re-fetch goals when a user logs in
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
                fetchData();
            }
            if (event === 'SIGNED_OUT') {
                // Clear local states on logout
                setUserGoal(null);
                setLoading(false);
                fetchedRef.current = false;
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [fetchData]);

    // API: Create a new goal record
    const setInitialGoal = useCallback(
        async (branchId: string, examIds: string[], silent = false): Promise<void> => {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) return;

            try {
                setLoading(true);

                // Deactivate all exisiting goals for the user
                await supabase
                    .from('user_goals')
                    .update({ is_active: false })
                    .eq('user_id', user.id);

                const { data, error } = await supabase
                    .from('user_goals')
                    .upsert(
                        {
                            user_id: user.id,
                            branch_id: branchId,
                            target_exams: examIds,
                            is_active: true,
                        },
                        { onConflict: 'user_id, branch_id' },
                    )
                    .select()
                    .single();

                if (error) {
                    if (!silent) toast.error('Failed to set your goals.');
                    return;
                }

                setUserGoal(data);
            } catch (err: unknown) {
                if (err instanceof Error) {
                    console.error(err);
                }
                toast.error('Failed to update your goals.');
            } finally {
                setLoading(false);
            }
        },
        [],
    );

    /**
     * The Intersection Logic:
     * 1. Get subjects linked to current branch.
     * 2. Get subjects linked to selected exams.
     * 3. Return the intersection + any universal subjects.
     */
    const getPracticeSubjects = useCallback(() => {
        if (!userGoal) return [];

        const selectedExamIds = userGoal.target_exams as string[]; // JSONB cast

        // 1. IDs of subjects in the user's branch
        const subjectsInBranch = branchSubjects
            .filter((bs) => bs.branch_id === userGoal.branch_id)
            .map((bs) => bs.subject_id);

        // 2. IDs of subjects in any of the selected exams
        const subjectsInExams = examSubjects
            .filter((es) => selectedExamIds.includes(es.exams_id))
            .map((es) => es.subject_id);

        // 3. Filter the main subjects list
        return subjects.filter((subject) => {
            const isUniversal = subject.is_universal;
            const belongsToBranch = subjectsInBranch.includes(subject.id);
            const belongsToExam = subjectsInExams.includes(subject.id);

            // Rule: (Universal OR Branch-Linked) AND (Exam-Linked)
            return (isUniversal || belongsToBranch) && belongsToExam;
        });
    }, [userGoal, branchSubjects, examSubjects, subjects]);

    // Check if a particular subject belong to the user goal for cases when they view the question shared to them belong to different branch
    const isSubjectInGoal = useCallback(
        (subjectId: string) => {
            if (!userGoal) return;

            const subject = subjects.find((s) => s.id === subjectId);
            if (subject?.is_universal) return true;

            return branchSubjects.some(
                (bs) => bs.branch_id === userGoal.branch_id && bs.subject_id === subjectId,
            );
        },
        [userGoal, subjects, branchSubjects],
    );

    const value = useMemo(
        () => ({
            branches,
            exams,
            branchExams,
            subjects,
            userGoal,
            loading,
            error,
            setInitialGoal,
            getPracticeSubjects,
            isSubjectInGoal,
            refresh: () => fetchData(true),
        }),
        [
            branches,
            exams,
            branchExams,
            subjects,
            userGoal,
            loading,
            error,
            setInitialGoal,
            getPracticeSubjects,
            isSubjectInGoal,
            fetchData,
        ],
    );

    return <GoalContext.Provider value={value}>{children}</GoalContext.Provider>;
};
