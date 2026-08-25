import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { toast } from 'sonner';
import { supabase } from '@/shared/utils/supabaseClient';
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

export const GoalProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
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
                supabase
                    .from('user_goals')
                    .select('*')
                    .eq('is_active', true)
                    .maybeSingle(),
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

    console.log('userGoal: ', userGoal);
    console.log('subjects: ', subjects);

    const optionalSubjects = useMemo(() => {
        const XL_MANDATORY_SUBJECTS = new Set([
            'general-aptitude',
            'chemistry',
        ]);

        const subjectsInXL = new Set(
            branchSubjects
                .filter((bs) => bs.branch_id === 'xl')
                .map((bs) => bs.subject_id)
        );

        return subjects.filter(
            (subject) =>
                subjectsInXL.has(subject.id) &&
                !XL_MANDATORY_SUBJECTS.has(subject.slug)
        );
    }, [userGoal, subjects, branchSubjects]);

    const selectedOptionalSubjects = useMemo(() => {
        const selectedIds =
            (userGoal?.additional_subjects as string[] | null) ?? [];

        return optionalSubjects.filter((subject) =>
            selectedIds.includes(subject.id)
        );
    }, [userGoal, optionalSubjects]);

    console.log('optionalSubjects: ', optionalSubjects);

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
        async (
            branchId: string,
            examIds: string[],
            additionalSubjects: string[] = [],
            silent = false
        ): Promise<void> => {
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
                            additional_subjects:
                                branchId === 'xl' && examIds.includes('gate')
                                    ? additionalSubjects
                                    : null,
                            is_active: true,
                        },
                        { onConflict: 'user_id, branch_id' }
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
        []
    );

    /**
     * The Intersection Logic:
     * 1. Get subjects linked to current branch.
     * 2. Get subjects linked to selected exams.
     * 3. Return the intersection + any universal subjects.
     */
    const getPracticeSubjects = useCallback(() => {
        if (!userGoal) return [];

        const selectedExamIds = userGoal.target_exams as string[];

        const isGateXL =
            userGoal.branch_id === 'xl' && selectedExamIds.includes('gate');

        const additionalSubjectIds =
            (userGoal.additional_subjects as string[] | null) ?? [];

        // --------------------------------------------------
        // GATE XL
        // Only:
        //   1. General Aptitude
        //   2. Chemistry
        //   3. User's 2 selected XL subjects
        // --------------------------------------------------
        if (isGateXL) {
            return subjects.filter((subject) => {
                const isAptitude = subject.slug === 'aptitude';

                const isChemistry = subject.slug === 'chemistry';

                const isSelectedOptional = additionalSubjectIds.includes(
                    subject.id
                );

                return isAptitude || isChemistry || isSelectedOptional;
            });
        }

        // --------------------------------------------------
        // Normal branch/exam logic
        // --------------------------------------------------

        const subjectsInBranch = branchSubjects
            .filter((bs) => bs.branch_id === userGoal.branch_id)
            .map((bs) => bs.subject_id);

        const subjectsInExams = examSubjects
            .filter((es) => selectedExamIds.includes(es.exams_id))
            .map((es) => es.subject_id);

        return subjects.filter((subject) => {
            const isUniversal = subject.is_universal;
            const belongsToBranch = subjectsInBranch.includes(subject.id);
            const belongsToExam = subjectsInExams.includes(subject.id);

            return (isUniversal || belongsToBranch) && belongsToExam;
        });
    }, [userGoal, branchSubjects, examSubjects, subjects]);

    // Check whether a subject belongs to the user's current goal.
    // GATE XL is special:
    //   - General Aptitude
    //   - Chemistry
    //   - User's 2 selected additional subjects
    const isSubjectInGoal = useCallback(
        (subjectId: string) => {
            if (!userGoal) return false;

            const subject = subjects.find((s) => s.id === subjectId);

            if (!subject) return false;

            const selectedExamIds = (userGoal.target_exams as string[]) ?? [];

            const isGateXL =
                userGoal.branch_id === 'xl' && selectedExamIds.includes('gate');

            // GATE XL
            if (isGateXL) {
                const additionalSubjectIds =
                    (userGoal.additional_subjects as string[] | null) ?? [];

                const isAptitude = subject.slug === 'aptitude';
                const isChemistry = subject.slug === 'chemistry';
                const isSelectedAdditionalSubject =
                    additionalSubjectIds.includes(subjectId);

                return isAptitude || isChemistry || isSelectedAdditionalSubject;
            }

            // Normal branch/exam logic
            if (subject.is_universal) return true;

            return branchSubjects.some(
                (bs) =>
                    bs.branch_id === userGoal.branch_id &&
                    bs.subject_id === subjectId
            );
        },
        [userGoal, subjects, branchSubjects]
    );

    const value = useMemo(
        () => ({
            branches,
            exams,
            branchExams,
            subjects,
            userGoal,
            optionalSubjects,
            selectedOptionalSubjects,
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
            optionalSubjects,
            selectedOptionalSubjects,
            loading,
            error,
            setInitialGoal,
            getPracticeSubjects,
            isSubjectInGoal,
            fetchData,
        ]
    );

    return (
        <GoalContext.Provider value={value}>{children}</GoalContext.Provider>
    );
};
