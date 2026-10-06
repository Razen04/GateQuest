import { useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
    selectIsSubjectInGoal,
    selectOptionalSubjects,
    selectPracticeSubjects,
    useGoalStore,
} from '@/app/stores/useGoalStore';

export default function useGoal() {
    const state = useGoalStore(
        useShallow((s) => ({
            branches: s.branches,
            exams: s.exams,
            branchExams: s.branchExams,
            subjects: s.subjects,
            userGoal: s.userGoal,
            loading: s.loading,
            error: s.error,
            setInitialGoal: s.setInitialGoal,
            refresh: s.refresh,
        }))
    );

    const optionalSubjects = useGoalStore(useShallow(selectOptionalSubjects));
    const getPracticeSubjects = useCallback(
        () => selectPracticeSubjects(useGoalStore.getState()),
        []
    );
    const isSubjectInGoal = useCallback(
        (id: string) => selectIsSubjectInGoal(useGoalStore.getState())(id),
        []
    );

    return {
        ...state,
        optionalSubjects,
        getPracticeSubjects,
        isSubjectInGoal,
    };
}
