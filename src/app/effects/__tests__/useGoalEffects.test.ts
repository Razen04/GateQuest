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
    it('resets the fetch guard on SIGNED_OUT', () => {
        useGoalStore.setState({ userGoal: { id: 'g' } as any, loading: true });
        renderHook(() => useGoalEffects());
        authCallback('SIGNED_OUT');
        expect(useGoalStore.getState().userGoal).toBeNull();
        expect(useGoalStore.getState().loading).toBe(false);
    });
});
