import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppUser } from '@/shared/types/AppUser';
import type { UserGoal } from '@/shared/types/Goal';
import { makeGoal, makeUser } from '../../__tests__/helper';
import { useOnboardingSteps } from '../useOnboardingSteps';

const mockUser = vi.fn<() => AppUser | null>(() => null);
const mockGoal = vi.fn<() => UserGoal | null>(() => null);

vi.mock('@/app/stores/useAuthStore', () => ({
    useAuthStore: (sel: (s: { user: AppUser | null }) => unknown) =>
        sel({ user: mockUser() }),
}));

vi.mock('@/app/stores/useGoalStore', () => ({
    useGoalStore: (sel: (s: { userGoal: UserGoal | null }) => unknown) =>
        sel({ userGoal: mockGoal() }),
}));

const setState = (user: AppUser | null, goal: UserGoal | null) => {
    mockUser.mockReturnValue(user);
    mockGoal.mockReturnValue(goal);
};

describe('useOnboardingSteps', () => {
    beforeEach(() => {
        mockUser.mockReset();
        mockGoal.mockReset();
    });

    describe('new user — nothing set', () => {
        it('returns profile, goal, finish', () => {
            setState(makeUser({ username: null, name: null }), null);
            const { result } = renderHook(() => useOnboardingSteps());
            expect(result.current).toEqual(['profile', 'goal', 'finish']);
        });
    });

    describe('profile requirements', () => {
        it('includes profile when username is null', () => {
            setState(
                makeUser({ username: null, name: 'X', about: 'bio' }),
                makeGoal()
            );
            const { result } = renderHook(() => useOnboardingSteps());
            expect(result.current).toContain('profile');
        });

        it('includes profile when full name is null', () => {
            setState(
                makeUser({ username: 'u', name: null, about: 'bio' }),
                makeGoal()
            );
            const { result } = renderHook(() => useOnboardingSteps());
            expect(result.current).toContain('profile');
        });

        it('includes profile when about is null', () => {
            setState(
                makeUser({ username: 'u', name: 'X', about: null }),
                makeGoal()
            );
            const { result } = renderHook(() => useOnboardingSteps());
            expect(result.current).toContain('profile');
        });

        it('excludes profile when username, name, about all set', () => {
            setState(
                makeUser({
                    username: 'u',
                    name: 'Full Name',
                    about: 'bio',
                }),
                makeGoal()
            );
            const { result } = renderHook(() => useOnboardingSteps());
            expect(result.current).not.toContain('profile');
        });

        it('does not require college (optional)', () => {
            setState(
                makeUser({
                    username: 'u',
                    name: 'X',
                    about: 'bio',
                    college: null,
                }),
                makeGoal()
            );
            const { result } = renderHook(() => useOnboardingSteps());
            expect(result.current).not.toContain('profile');
        });

        it('does not require socials (optional)', () => {
            setState(
                makeUser({
                    username: 'u',
                    name: 'X',
                    about: 'bio',
                }),
                makeGoal()
            );
            const { result } = renderHook(() => useOnboardingSteps());
            expect(result.current).not.toContain('profile');
        });
    });

    describe('goal requirements', () => {
        it('includes goal when no active goal exists', () => {
            setState(
                makeUser({ username: 'u', name: 'X', about: 'bio' }),
                null
            );
            const { result } = renderHook(() => useOnboardingSteps());
            expect(result.current).toContain('goal');
        });

        it('includes goal when branch is missing', () => {
            setState(
                makeUser({ username: 'u', name: 'X', about: 'bio' }),
                makeGoal({ branch_id: '' })
            );
            const { result } = renderHook(() => useOnboardingSteps());
            expect(result.current).toContain('goal');
        });

        it('includes goal when exams array is empty', () => {
            setState(
                makeUser({ username: 'u', name: 'X', about: 'bio' }),
                makeGoal({ target_exams: [] })
            );
            const { result } = renderHook(() => useOnboardingSteps());
            expect(result.current).toContain('goal');
        });

        it('excludes goal when branch and exams are valid', () => {
            setState(
                makeUser({ username: 'u', name: 'X', about: 'bio' }),
                makeGoal({ branch_id: 'cs', target_exams: ['gate'] })
            );
            const { result } = renderHook(() => useOnboardingSteps());
            expect(result.current).not.toContain('goal');
        });
    });

    describe('XL optional step', () => {
        it('includes xl when branch is xl and gate in exams and optionals missing', () => {
            setState(
                makeUser({ username: 'u', name: 'X', about: 'bio' }),
                makeGoal({
                    branch_id: 'xl',
                    target_exams: ['gate'],
                    additional_subjects: null,
                })
            );
            const { result } = renderHook(() => useOnboardingSteps());
            expect(result.current).toContain('xl');
        });

        it('includes xl when optionals have wrong count', () => {
            setState(
                makeUser({ username: 'u', name: 'X', about: 'bio' }),
                makeGoal({
                    branch_id: 'xl',
                    target_exams: ['gate'],
                    additional_subjects: ['s1'],
                })
            );
            const { result } = renderHook(() => useOnboardingSteps());
            expect(result.current).toContain('xl');
        });

        it('excludes xl when two optionals are set', () => {
            setState(
                makeUser({ username: 'u', name: 'X', about: 'bio' }),
                makeGoal({
                    branch_id: 'xl',
                    target_exams: ['gate'],
                    additional_subjects: ['s1', 's2'],
                })
            );
            const { result } = renderHook(() => useOnboardingSteps());
            expect(result.current).not.toContain('xl');
        });

        it('excludes xl when gate not in exams', () => {
            setState(
                makeUser({ username: 'u', name: 'X', about: 'bio' }),
                makeGoal({
                    branch_id: 'xl',
                    target_exams: ['isro'],
                    additional_subjects: null,
                })
            );
            const { result } = renderHook(() => useOnboardingSteps());
            expect(result.current).not.toContain('xl');
        });

        it('excludes xl when branch is not xl', () => {
            setState(
                makeUser({ username: 'u', name: 'X', about: 'bio' }),
                makeGoal({
                    branch_id: 'cs',
                    target_exams: ['gate'],
                    additional_subjects: null,
                })
            );
            const { result } = renderHook(() => useOnboardingSteps());
            expect(result.current).not.toContain('xl');
        });

        it('places xl after goal and before finish', () => {
            setState(
                makeUser({ username: 'u', name: 'X', about: 'bio' }),
                makeGoal({
                    branch_id: 'xl',
                    target_exams: ['gate'],
                    additional_subjects: null,
                })
            );
            const { result } = renderHook(() => useOnboardingSteps());
            const steps = result.current;
            const goalIdx = steps.indexOf('goal');
            const xlIdx = steps.indexOf('xl');
            const finishIdx = steps.indexOf('finish');
            expect(goalIdx).toBeLessThan(xlIdx);
            expect(xlIdx).toBeLessThan(finishIdx);
        });
    });

    describe('ordering', () => {
        it('always places profile before goal', () => {
            setState(makeUser({ username: null, name: null }), null);
            const { result } = renderHook(() => useOnboardingSteps());
            const steps = result.current;
            expect(steps.indexOf('profile')).toBeLessThan(
                steps.indexOf('goal')
            );
        });

        it('always ends with finish', () => {
            setState(makeUser({ username: null, name: null }), null);
            const { result } = renderHook(() => useOnboardingSteps());
            const steps = result.current;
            expect(steps[steps.length - 1]).toBe('finish');
        });

        it('returns only finish when everything is complete', () => {
            setState(
                makeUser({ username: 'u', name: 'X', about: 'bio' }),
                makeGoal({ branch_id: 'cs', target_exams: ['gate'] })
            );
            const { result } = renderHook(() => useOnboardingSteps());
            expect(result.current).toEqual(['finish']);
        });
    });

    describe('guest user', () => {
        it('returns empty array for guest (id "1")', () => {
            setState(makeUser({ id: '1' }), null);
            const { result } = renderHook(() => useOnboardingSteps());
            expect(result.current).toEqual([]);
        });

        it('returns empty array when user is null', () => {
            setState(null, null);
            const { result } = renderHook(() => useOnboardingSteps());
            expect(result.current).toEqual([]);
        });
    });
});
