import { AnimatePresence } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { useGoalStore } from '@/app/stores/useGoalStore';
import { StepFrame } from './components/StepFrame';
import { DEFAULT_TARGET_YEAR, STEP_SUBTITLES, STEP_TITLES } from './constants';
import { useOnboardingSubmit } from './hooks/useOnboardingSubmit';
import { type OnboardingSummary, StepFinish } from './steps/StepFinish';
import { StepGoal } from './steps/StepGoal';
import { StepProfile } from './steps/StepProfile';
import { StepXL } from './steps/StepXL';
import type {
    GoalFormData,
    OnboardingStep,
    ProfileFormData,
    XLFormData,
} from './types';

export function OnboardingFlow() {
    const user = useAuthStore((s) => s.user);
    const userGoal = useGoalStore((s) => s.userGoal);
    const branches = useGoalStore((s) => s.branches);
    const exams = useGoalStore((s) => s.exams);

    const { submit, retry, reset, isSubmitting, error, duplicateUsername } =
        useOnboardingSubmit();

    // ---- Accumulated form data ----
    // Initializers run once on mount. The gate in AppContent guarantees
    // user is non-null and auth/goal loading are complete by the time this
    // component renders, so initial values are always populated.
    const [profileData, setProfileData] = useState<ProfileFormData>(() => ({
        username: user?.username ?? '',
        fullName: user?.name ?? '',
        email: user?.email ?? '',
        college: user?.college ?? '',
        about: user?.about ?? '',
        socials: {},
    }));

    const [goalData, setGoalData] = useState<GoalFormData>(() => ({
        branchId: userGoal?.branch_id ?? '',
        targetExams: (userGoal?.target_exams as string[] | undefined) ?? [],
        targetYear: user?.targetYear ?? DEFAULT_TARGET_YEAR,
    }));

    const [xlData, setXLData] = useState<XLFormData>(() => ({
        xlOptionals:
            (userGoal?.additional_subjects as string[] | undefined) ?? [],
    }));

    // ---- Live step computation ----
    // Uses store data for already-saved values, form data for in-progress
    // values. That's what makes the XL step appear the moment the user
    // picks XL+GATE in StepGoal, before the goal is persisted.
    const steps = useMemo<OnboardingStep[]>(() => {
        const out: OnboardingStep[] = [];

        const needsProfile = !user?.username || !user?.name || !user?.about;
        if (needsProfile) out.push('profile');

        const savedGoalValid =
            !!userGoal?.branch_id &&
            Array.isArray(userGoal.target_exams) &&
            userGoal.target_exams.length > 0;

        if (!savedGoalValid) out.push('goal');

        const effectiveBranch = savedGoalValid
            ? (userGoal!.branch_id as string)
            : goalData.branchId;
        const effectiveExams = savedGoalValid
            ? (userGoal!.target_exams as string[])
            : goalData.targetExams;
        const effectiveOptionals = savedGoalValid
            ? ((userGoal!.additional_subjects as string[] | null) ?? [])
            : xlData.xlOptionals;

        const needsXL =
            effectiveBranch === 'xl' &&
            effectiveExams.includes('gate') &&
            effectiveOptionals.length !== 2;

        if (needsXL) out.push('xl');

        out.push('finish');
        return out;
    }, [
        user,
        userGoal,
        goalData.branchId,
        goalData.targetExams,
        xlData.xlOptionals,
    ]);

    const [stepIndex, setStepIndex] = useState(0);

    // Clamp stepIndex when steps array shrinks (e.g. XL step removed
    // after the user picks two optionals on a subsequent Back/Next cycle).
    useEffect(() => {
        if (stepIndex >= steps.length) {
            setStepIndex(steps.length - 1);
        }
    }, [stepIndex, steps.length]);

    const currentStep = steps[stepIndex] ?? 'finish';

    // ---- Transition handlers ----
    const goNext = () => setStepIndex((i) => Math.min(i + 1, steps.length - 1));
    const goBack = () => setStepIndex((i) => Math.max(i - 1, 0));

    const handleProfileNext = (data: ProfileFormData) => {
        setProfileData(data);
        reset(); // clear any stale submit error
        goNext();
    };

    const handleGoalNext = (data: GoalFormData) => {
        setGoalData(data);
        goNext();
    };

    const handleXLNext = (data: XLFormData) => {
        setXLData(data);
        goNext();
    };

    // ---- Finish step ----
    const summary: OnboardingSummary = useMemo(() => {
        const branchName =
            branches.find((b) => b.id === goalData.branchId)?.name ?? '';
        const examNames = goalData.targetExams
            .map((id) => exams.find((e) => e.id === id)?.short_name ?? id)
            .filter(Boolean);
        const socialsCount = Object.values(profileData.socials).filter(
            (v) => v.trim().length > 0
        ).length;

        return {
            username: profileData.username || (user?.username ?? ''),
            fullName: profileData.fullName,
            email: profileData.email,
            college: profileData.college,
            about: profileData.about,
            socialsCount,
            branchName,
            examNames,
            targetYear: goalData.targetYear ?? DEFAULT_TARGET_YEAR,
        };
    }, [branches, exams, goalData, profileData, user]);

    const handleComplete = async () => {
        // If the last submit failed on username uniqueness, the Finish
        // step shows "Try a different username" instead of "Get Started".
        // Clicking it should navigate back to Profile rather than resubmit.
        if (duplicateUsername) {
            reset();
            const profileIdx = steps.indexOf('profile');
            if (profileIdx >= 0) setStepIndex(profileIdx);
            return;
        }

        const isNewGoal =
            !userGoal?.branch_id ||
            !((userGoal.target_exams as string[] | undefined) ?? []).length;

        await submit({
            ...profileData,
            ...goalData,
            ...xlData,
            isNewGoal,
        });
    };

    // ---- Step dispatch ----
    const renderStep = () => {
        switch (currentStep) {
            case 'profile':
                return (
                    <StepProfile
                        defaultValue={profileData}
                        onNext={handleProfileNext}
                        onBack={goBack}
                        isFirst={stepIndex === 0}
                        isLast={false}
                    />
                );
            case 'goal':
                return (
                    <StepGoal
                        defaultValue={goalData}
                        onNext={handleGoalNext}
                        onBack={goBack}
                        isFirst={stepIndex === 0}
                        isLast={false}
                    />
                );
            case 'xl':
                return (
                    <StepXL
                        defaultValue={xlData}
                        onNext={handleXLNext}
                        onBack={goBack}
                        isFirst={stepIndex === 0}
                        isLast={false}
                    />
                );
            case 'finish':
                return (
                    <StepFinish
                        summary={summary}
                        onComplete={handleComplete}
                        onRetry={retry}
                        isSubmitting={isSubmitting}
                        error={error}
                        duplicateUsername={duplicateUsername}
                    />
                );
        }
    };

    return (
        <div className="h-dvh overflow-scroll bg-slate-50 dark:bg-zinc-950">
            <div className="mx-auto max-w-5xl px-6 py-16 md:py-24">
                <AnimatePresence mode="wait">
                    <StepFrame
                        key={currentStep}
                        title={STEP_TITLES[currentStep]}
                        subtitle={STEP_SUBTITLES[currentStep]}
                        currentStep={stepIndex + 1}
                        totalSteps={steps.length}
                    >
                        {renderStep()}
                    </StepFrame>
                </AnimatePresence>
            </div>
        </div>
    );
}
