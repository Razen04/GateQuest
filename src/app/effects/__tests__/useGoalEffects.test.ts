import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useGoalStore } from '@/app/stores/useGoalStore';
import { useGoalEffects } from '../useGoalEffects';

let authCallback: (event: string) => void;
vi.mock('@/shared/utils/supabaseClient', () => ({
    supabase: {
        auth: {
            onAuthStateChange: (cb: any) => {
                authCallback = cb;
                return { data: { subscription: { unsubscribe: vi.fn() } } };
            },
        },
    },
}));

describe('useGoalEffects', () => {
    it('resets to a guest goal on SIGNED_OUT', () => {
        renderHook(() => useGoalEffects());
        authCallback('SIGNED_OUT');
        expect(useGoalStore.getState().userGoal?.id).toBe('guest-goal');
        expect(useGoalStore.getState().userGoal?.branch_id).toBe('cs');
        expect(useGoalStore.getState().loading).toBe(false);
    });
});
