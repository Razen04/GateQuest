import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import useTestTimer from '../useTestTimer';

describe('useTestTimer hook', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    // Test case 1
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

    // Test case 2
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

    // Test case 3
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

    // Test case 4
    describe('drift test', () => {
        it('corrects drift when system time jumps forward', () => {
            const { result } = renderHook(() => useTestTimer({ initialSeconds: 60 }));

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
});
