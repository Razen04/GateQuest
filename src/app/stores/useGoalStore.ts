import { toast } from 'sonner';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
    Branch,
    BranchExam,
    BranchSubjects,
    Exam,
    ExamSubjects,
    Subject,
    UserGoal,
} from '@/shared/types/Goal';
import { supabase } from '@/shared/utils/supabaseClient';

let hasFetched = false;

type GoalState = {
    branches: Branch[];
    exams: Exam[];
    subjects: Subject[];
    userGoal: UserGoal | null;
    branchSubjects: BranchSubjects[];
    examSubjects: ExamSubjects[];
    branchExams: BranchExam[];

    loading: boolean;
    error: string | null;

    fetchData: (force?: boolean) => Promise<void>;
    setGuestGoal: () => void;
    refresh: () => Promise<void>;
    setInitialGoal: (
        branchId: string,
        examIds: string[],
        additionalSubjects?: string[],
        silent?: boolean
    ) => Promise<void>;
    _resetFetchGuard: () => void;
};

export const useGoalStore = create<GoalState>()(
    devtools(
        (set, get) => ({
            branches: [],
            exams: [],
            subjects: [],
            userGoal: null,
            branchSubjects: [],
            examSubjects: [],
            branchExams: [],
            loading: true,
            error: null,

            fetchData: async (force = false) => {
                if (hasFetched && !force) return;

                const {
                    data: { session },
                } = await supabase.auth.getSession();

                try {
                    set({ loading: true }, false, 'goal/fetchData:start');
                    hasFetched = true;

                    const [
                        resBranches,
                        resExams,
                        resSubjects,
                        resBS,
                        resES,
                        resBE,
                    ] = await Promise.all([
                        supabase.from('branches').select('*'),
                        supabase.from('exams').select('*'),
                        supabase.from('subjects').select('*'),
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

                    set(
                        {
                            branches: resBranches.data || [],
                            exams: resExams.data || [],
                            subjects: resSubjects.data || [],
                            branchSubjects: resBS.data || [],
                            examSubjects: resES.data || [],
                            branchExams: resBE.data || [],
                            error: null,
                        },
                        false,
                        'goal/fetchData:success'
                    );

                    if (session) {
                        const { data } = await supabase
                            .from('user_goals')
                            .select('*')
                            .eq('is_active', true)
                            .maybeSingle();
                        set(
                            { userGoal: data || null, error: null },
                            false,
                            'goal/fetchData:userGoal'
                        );
                    } else {
                        get().setGuestGoal();
                    }
                } catch (err: unknown) {
                    hasFetched = false;
                    const message =
                        err instanceof Error
                            ? err.message
                            : 'An unexpected error occured.';
                    set({ error: message }, false, 'goal/fetchData:error');
                    toast.error('Failed to sync goal data');
                } finally {
                    set({ loading: false }, false, 'goal/fetchData:end');
                }
            },

            setGuestGoal: () =>
                set(
                    {
                        userGoal: {
                            id: 'guest-goal',
                            user_id: '1',
                            branch_id: 'cs',
                            target_exams: ['gate'],
                            additional_subjects: null,
                            is_active: true,
                        },
                        error: null,
                    },
                    false,
                    'goal/setGuestGoal'
                ),

            refresh: () => get().fetchData(true),

            setInitialGoal: async (
                branchId,
                examIds,
                additionalSubjects = [],
                silent = false
            ) => {
                const {
                    data: { user },
                } = await supabase.auth.getUser();
                if (!user) return;

                try {
                    set({ loading: true }, false, 'goal/setInitialGoal:start');

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
                                    branchId === 'xl' &&
                                    examIds.includes('gate')
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

                    set(
                        { userGoal: data },
                        false,
                        'goal/setInitialGoal:success'
                    );
                } catch (err: unknown) {
                    if (err instanceof Error) console.error(err);
                    toast.error('Failed to update your goals.');
                } finally {
                    set({ loading: false }, false, 'goal/setInitialGoal:end');
                }
            },

            _resetFetchGuard: () => {
                hasFetched = false;
            },
        }),
        { name: 'GoalStore' }
    )
);

// Every XL subject except the two mandatory ones (aptitude, chemistry).
// This is the *menu* of optional subjects an XL student picks from.
export const selectOptionalSubjects = (state: GoalState): Subject[] => {
    const XL_MANDATORY_SUBJECTS = new Set(['general-aptitude', 'chemistry']);

    const subjectsInXL = new Set(
        state.branchSubjects
            .filter((bs) => bs.branch_id === 'xl')
            .map((bs) => bs.subject_id)
    );

    return state.subjects.filter(
        (subject) =>
            subjectsInXL.has(subject.id) &&
            !XL_MANDATORY_SUBJECTS.has(subject.slug)
    );
};

// The set of subjects the user will actually be tested on.
// Handles the GATE XL special case.
export const selectPracticeSubjects = (state: GoalState): Subject[] => {
    const { userGoal, subjects, branchSubjects, examSubjects } = state;
    if (!userGoal) return [];

    const selectedExamIds = userGoal.target_exams as string[];
    const isGateXL =
        userGoal.branch_id === 'xl' && selectedExamIds.includes('gate');
    const additionalSubjectIds =
        (userGoal.additional_subjects as string[] | null) ?? [];

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
};

// Curried so it can be used as a Zustand selector with a baked-in subjectId.
export const selectIsSubjectInGoal =
    (state: GoalState) =>
    (subjectId: string): boolean => {
        const { userGoal, subjects, branchSubjects } = state;
        if (!userGoal) return false;

        const subject = subjects.find((s) => s.id === subjectId);
        if (!subject) return false;

        const selectedExamIds = (userGoal.target_exams as string[]) ?? [];
        const isGateXL =
            userGoal.branch_id === 'xl' && selectedExamIds.includes('gate');

        if (isGateXL) {
            const additionalSubjectIds =
                (userGoal.additional_subjects as string[] | null) ?? [];
            const isAptitude = subject.slug === 'aptitude';
            const isChemistry = subject.slug === 'chemistry';
            const isSelectedAdditionalSubject =
                additionalSubjectIds.includes(subjectId);
            return isAptitude || isChemistry || isSelectedAdditionalSubject;
        }

        if (subject.is_universal) return true;

        return branchSubjects.some(
            (bs) =>
                bs.branch_id === userGoal.branch_id &&
                bs.subject_id === subjectId
        );
    };
