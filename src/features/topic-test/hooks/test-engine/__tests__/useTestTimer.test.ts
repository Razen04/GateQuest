import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import useTestTimer from '@/features/topic-test/hooks/test-engine/useTestTimer';

vi.mock('@/shared/utils/supabaseClient', () => ({
    supabase: {
        auth: { onAuthStateChange: vi.fn(), signOut: vi.fn() },
        from: vi.fn(),
        rpc: vi.fn(),
    },
}));

describe('useTestTimer hook', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('Time formatting', () => {
        it('formats time correctly (300s -> 05:00)', () => {
            const { result } = renderHook(() => {
                return useTestTimer({ initialSeconds: 300 });
            });

            expect(result.current.timeDisplay).toBe('05:00');
            expect(result.current.secondsRemaining).toBe(300);
            expect(result.current.isExpired).toBe(false);
        });
    });

    describe('boundaries', () => {
        it('stops at 0 and does not go negative', () => {
            const { result } = renderHook(() => {
                return useTestTimer({ initialSeconds: 1 });
            });

            // advance time by 5s
            act(() => {
                vi.advanceTimersByTime(5000);
            });

            expect(result.current.timeDisplay).toBe('00:00');
            expect(result.current.secondsRemaining).toBe(0);
            expect(result.current.isExpired).toBe(true);
        });
    });

    describe('expiry callback', () => {
        it('fires onExpire callback once only when timer reaches 0', () => {
            const onExpire = vi.fn();

            renderHook(() => useTestTimer({ initialSeconds: 1, onExpire }));

            // advance time by 5s
            act(() => {
                vi.advanceTimersByTime(5000);
            });

            expect(onExpire).toHaveBeenCalledTimes(1);
        });
    });

    describe('drift test', () => {
        it('corrects drift when system time jumps forward', () => {
            const { result } = renderHook(() =>
                useTestTimer({ initialSeconds: 60 })
            );

            // 1 second passes normally
            act(() => {
                vi.advanceTimersByTime(1000);
            });

            expect(result.current.secondsRemaining).toBe(59);

            vi.setSystemTime(new Date('2024-01-01T00:00:00Z').getTime() + 5000);

            act(() => {
                vi.advanceTimersByTime(1000);
            });

            expect(result.current.secondsRemaining).toBe(54);
        });
    });

    it('does not fire onExpire before expiry', () => {
        const onExpire = vi.fn();
        renderHook(() => useTestTimer({ initialSeconds: 10, onExpire }));
        act(() => {
            vi.advanceTimersByTime(5000);
        });
        expect(onExpire).not.toHaveBeenCalled();
    });

    it('clears the interval on unmount', () => {
        const clear = vi.spyOn(window, 'clearInterval');
        const { unmount } = renderHook(() =>
            useTestTimer({ initialSeconds: 10 })
        );
        unmount();
        expect(clear).toHaveBeenCalled();
    });

    it('expires immediately when initialSeconds is 0', () => {
        const { result } = renderHook(() =>
            useTestTimer({ initialSeconds: 0 })
        );
        expect(result.current.secondsRemaining).toBe(0);
        expect(result.current.isExpired).toBe(true);
    });

    it('ignores updates to initialSeconds after mount', () => {
        const { result, rerender } = renderHook(
            ({ s }) => useTestTimer({ initialSeconds: s }),
            { initialProps: { s: 60 } }
        );
        act(() => {
            vi.advanceTimersByTime(10000);
        });
        expect(result.current.secondsRemaining).toBe(50);
        rerender({ s: 999 });
        expect(result.current.secondsRemaining).toBe(50);
    });
});
