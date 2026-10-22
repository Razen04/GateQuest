export type OnboardingStep = 'profile' | 'goal' | 'xl' | 'finish';

export type ProfileFormData = {
    username: string;
    fullName: string;
    email: string;
    college: string;
    about: string;
    socials: Record<string, string>;
};

export type GoalFormData = {
    branchId: string;
    targetExams: string[];
    targetYear: number | null;
};

export type XLFormData = {
    xlOptionals: string[];
};

export type OnboardingFormData = ProfileFormData & GoalFormData & XLFormData;

export type SubmitPayload = OnboardingFormData & {
    isNewGoal: boolean;
};
