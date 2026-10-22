import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { supabase } from '@/shared/utils/supabaseClient';
import { makeUser } from '../../__tests__/helper';
import type { SubmitPayload } from '../../types';
import { useOnboardingSubmit } from '../useOnboardingSubmit';

const mockSetUser = vi.fn();
const mockSetInitialGoal = vi.fn();

vi.mock('@/shared/utils/supabaseClient', () => ({
    supabase: { from: vi.fn() },
}));

vi.mock('@/app/stores/useAuthStore', () => ({
    useAuthStore: Object.assign(
        (sel: (s: { user: unknown }) => unknown) => sel({ user: makeUser() }),
        { getState: () => ({ user: makeUser(), setUser: mockSetUser }) }
    ),
}));

vi.mock('@/app/stores/useGoalStore', () => ({
    useGoalStore: {
        getState: () => ({ setInitialGoal: mockSetInitialGoal }),
    },
}));

const makePayload = (over: Partial<SubmitPayload> = {}): SubmitPayload => ({
    username: 'newuser',
    fullName: 'New User',
    email: 'user@example.com',
    college: '',
    about: 'Hi',
    socials: {},
    branchId: 'cs',
    targetExams: ['gate'],
    targetYear: new Date().getFullYear() + 1,
    xlOptionals: [],
    isNewGoal: true,
    ...over,
});

const makeUserUpdateChain = (result: { error: unknown } = { error: null }) => ({
    update: () => ({
        eq: vi.fn().mockResolvedValue(result),
    }),
    upsert: vi.fn().mockResolvedValue({ error: null }),
});

describe('useOnboardingSubmit', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockSetInitialGoal.mockResolvedValue(undefined);
        (supabase.from as Mock).mockReturnValue(makeUserUpdateChain());
    });

    describe('success path', () => {
        it('calls setInitialGoal, then update, then setUser in order', async () => {
            const { result } = renderHook(() => useOnboardingSubmit());
            const data = makePayload();

            await act(async () => {
                await result.current.submit(data);
            });

            const goalCallOrder =
                mockSetInitialGoal.mock.invocationCallOrder[0];
            const updateCallOrder = (supabase.from as Mock).mock
                .invocationCallOrder[0];
            const setUserCallOrder = mockSetUser.mock.invocationCallOrder[0];

            expect(goalCallOrder).toBeLessThan(updateCallOrder);
            expect(updateCallOrder).toBeLessThan(setUserCallOrder);
        });

        it('passes correct args to setInitialGoal', async () => {
            const { result } = renderHook(() => useOnboardingSubmit());
            const data = makePayload();

            await act(async () => {
                await result.current.submit(data);
            });

            expect(mockSetInitialGoal).toHaveBeenCalledWith(
                'cs',
                ['gate'],
                [],
                true
            );
        });

        it('passes xl optionals when branch is xl and gate is target', async () => {
            const { result } = renderHook(() => useOnboardingSubmit());
            const data = makePayload({
                branchId: 'xl',
                xlOptionals: ['s1', 's2'],
            });

            await act(async () => {
                await result.current.submit(data);
            });

            expect(mockSetInitialGoal).toHaveBeenCalledWith(
                'xl',
                ['gate'],
                ['s1', 's2'],
                true
            );
        });

        it('skips setInitialGoal when goal already exists', async () => {
            const { result } = renderHook(() => useOnboardingSubmit());
            const data = makePayload({ isNewGoal: false });

            await act(async () => {
                await result.current.submit(data);
            });

            expect(mockSetInitialGoal).not.toHaveBeenCalled();
        });

        it('updates user with onboarding_completed true', async () => {
            const eqMock = vi.fn().mockResolvedValue({ error: null });
            const updateMock = vi.fn(() => ({ eq: eqMock }));
            const upsertMock = vi.fn().mockResolvedValue({ error: null });
            (supabase.from as Mock).mockReturnValue({
                update: updateMock,
                upsert: upsertMock,
            });

            const { result } = renderHook(() => useOnboardingSubmit());
            const data = makePayload({
                college: 'IIT',
                socials: { github: 'https://github.com/x' },
                isNewGoal: false,
            });

            await act(async () => {
                await result.current.submit(data);
            });

            expect(updateMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    username: 'newuser',
                    name: 'New User',
                    college: 'IIT',
                    about: 'Hi',
                    onboarding_completed: true,
                })
            );
        });

        it('calls setUser with updated user object', async () => {
            const { result } = renderHook(() => useOnboardingSubmit());
            const data = makePayload({ isNewGoal: false });

            await act(async () => {
                await result.current.submit(data);
            });

            expect(mockSetUser).toHaveBeenCalledWith(
                expect.objectContaining({
                    username: 'newuser',
                    name: 'New User',
                    onboarding_completed: true,
                })
            );
        });
    });

    describe('error paths', () => {
        it('does not update profile when goal write fails', async () => {
            mockSetInitialGoal.mockRejectedValueOnce(new Error('goal failed'));
            const updateMock = vi.fn();
            (supabase.from as Mock).mockReturnValue({ update: updateMock });

            const { result } = renderHook(() => useOnboardingSubmit());
            const data = makePayload();

            await act(async () => {
                await result.current.submit(data);
            });

            expect(updateMock).not.toHaveBeenCalled();
            expect(mockSetUser).not.toHaveBeenCalled();
            expect(result.current.error).toBeTruthy();
        });

        it('detects duplicate username (23505) and returns username-specific error', async () => {
            (supabase.from as Mock).mockReturnValue(
                makeUserUpdateChain({
                    error: {
                        code: '23505',
                        message:
                            'duplicate key value violates unique constraint',
                    },
                })
            );

            const { result } = renderHook(() => useOnboardingSubmit());
            const data = makePayload({ username: 'taken', isNewGoal: false });

            await act(async () => {
                await result.current.submit(data);
            });

            expect(result.current.error).toMatch(/username/i);
            expect(result.current.duplicateUsername).toBe(true);
        });

        it('does not set onboarding_completed when profile update fails', async () => {
            (supabase.from as Mock).mockReturnValue(
                makeUserUpdateChain({
                    error: { code: '500', message: 'boom' },
                })
            );

            const { result } = renderHook(() => useOnboardingSubmit());
            const data = makePayload({ isNewGoal: false });

            await act(async () => {
                await result.current.submit(data);
            });

            expect(mockSetUser).not.toHaveBeenCalled();
            expect(result.current.error).toBeTruthy();
        });

        it('supports retry after profile-only failure (goal already saved)', async () => {
            (supabase.from as Mock).mockReturnValueOnce(
                makeUserUpdateChain({
                    error: { code: '500', message: 'boom' },
                })
            );
            (supabase.from as Mock).mockReturnValueOnce(makeUserUpdateChain());

            const { result } = renderHook(() => useOnboardingSubmit());
            const data = makePayload({ isNewGoal: false });

            await act(async () => {
                await result.current.submit(data);
            });
            expect(result.current.error).toBeTruthy();

            await act(async () => {
                await result.current.retry();
            });
            expect(mockSetUser).toHaveBeenCalled();
        });
    });

    describe('loading state', () => {
        it('sets isSubmitting true during submit and false after', async () => {
            let resolveUpdate: () => void;
            const pending = new Promise<{ error: null }>((res) => {
                resolveUpdate = () => res({ error: null });
            });
            (supabase.from as Mock).mockReturnValue({
                update: () => ({
                    eq: vi.fn().mockReturnValue(pending),
                }),
                upsert: vi.fn().mockResolvedValue({ error: null }),
            });

            const { result } = renderHook(() => useOnboardingSubmit());
            const data = makePayload({ isNewGoal: false });

            let submitPromise: Promise<void>;
            act(() => {
                submitPromise = result.current.submit(data);
            });
            expect(result.current.isSubmitting).toBe(true);

            await act(async () => {
                resolveUpdate!();
                await submitPromise!;
            });
            expect(result.current.isSubmitting).toBe(false);
        });
    });
});
