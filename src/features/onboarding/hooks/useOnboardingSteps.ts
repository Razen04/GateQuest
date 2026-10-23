import { useMemo } from 'react';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { useGoalStore } from '@/app/stores/useGoalStore';
import type { OnboardingStep } from '../types';

export function useOnboardingSteps(): OnboardingStep[] {
    const user = useAuthStore((s) => s.user);
    const userGoal = useGoalStore((s) => s.userGoal);

    return useMemo(() => {
        if (!user || user.id === '1') return [];

        const steps: OnboardingStep[] = [];

        // Profile step covers: username, full name, about.
        // College and socials are optional; their absence never triggers
        // the step on its own.
        const needsProfile = !user.username || !user.name || !user.about;
        if (needsProfile) {
            steps.push('profile');
        }

        const targetExams = Array.isArray(userGoal?.target_exams)
            ? (userGoal!.target_exams as string[])
            : [];
        const hasValidGoal = !!userGoal?.branch_id && targetExams.length > 0;
        if (!hasValidGoal) {
            steps.push('goal');
        }

        const xlOptionals = Array.isArray(userGoal?.additional_subjects)
            ? (userGoal!.additional_subjects as string[])
            : [];
        const needsXL =
            userGoal?.branch_id === 'xl' &&
            targetExams.includes('gate') &&
            xlOptionals.length !== 2;
        if (needsXL) {
            steps.push('xl');
        }

        steps.push('finish');
        return steps;
    }, [user, userGoal]);
}
