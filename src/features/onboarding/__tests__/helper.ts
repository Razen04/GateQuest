import type { AppUser } from '@/shared/types/AppUser';
import type { UserGoal } from '@/shared/types/Goal';

export const makeUser = (over: Partial<AppUser> = {}): AppUser =>
    ({
        id: 'u1',
        email: 'user@example.com',
        name: 'Test User',
        username: null,
        avatar: null,
        college: null,
        about: null,
        targetYear: null,
        settings: {},
        is_public: false,
        show_name: true,
        total_xp: 0,
        version_number: 1,
        joined_at: '2026-01-01T00:00:00Z',
        deleted_at: null,
        bookmark_questions: null,
        onboarding_completed: false,
        ...over,
    }) as AppUser;

export const makeGoal = (over: Partial<UserGoal> = {}): UserGoal =>
    ({
        id: 'g1',
        user_id: 'u1',
        branch_id: 'cs',
        target_exams: ['gate'],
        additional_subjects: null,
        is_active: true,
        ...over,
    }) as UserGoal;

export const makeBranch = (id: string, name: string) => ({ id, name });

export const makeExam = (id: string, name: string, short_name: string) => ({
    id,
    name,
    short_name,
});

export const makeBranchExam = (branch_id: string, exam_id: string) => ({
    branch_id,
    exam_id,
});

export const makeSubject = (id: string, slug: string, name: string) => ({
    id,
    slug,
    name,
});
