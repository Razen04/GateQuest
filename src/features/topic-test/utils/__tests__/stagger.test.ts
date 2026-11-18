import { describe, expect, it } from 'vitest';
import {
    MOCK_START_MIN_WINDOW_SECONDS,
    MOCK_START_STAGGER_MS,
    MOCK_SUBMIT_STAGGER_MS,
    mockStartDelayMs,
    mockSubmitDelayMs,
    staggerDelayMs,
} from '../stagger';

describe('staggerDelayMs', () => {
    it('is deterministic for the same user and key', () => {
        const a = staggerDelayMs('user-1', 'mock-start:mock-a', 30_000);
        const b = staggerDelayMs('user-1', 'mock-start:mock-a', 30_000);
        expect(a).toBe(b);
    });

    it('stays inside the requested window', () => {
        for (let i = 0; i < 500; i++) {
            const delay = staggerDelayMs(
                `user-${i}`,
                'mock-start:mock-a',
                30_000
            );
            expect(delay).toBeGreaterThanOrEqual(0);
            expect(delay).toBeLessThan(30_000);
        }
    });

    it('returns 0 without a user', () => {
        expect(staggerDelayMs(undefined, 'key', 30_000)).toBe(0);
        expect(staggerDelayMs(null, 'key', 30_000)).toBe(0);
    });

    it('returns 0 for a non-positive window', () => {
        expect(staggerDelayMs('user-1', 'key', 0)).toBe(0);
        expect(staggerDelayMs('user-1', 'key', -1)).toBe(0);
    });

    it('spreads 500 users across a wide range of slots', () => {
        const slots = new Set<number>();
        for (let i = 0; i < 500; i++) {
            slots.add(
                Math.floor(
                    staggerDelayMs(
                        `user-${i}`,
                        'mock-start:mock-a',
                        MOCK_START_STAGGER_MS
                    ) / 1000
                )
            );
        }
        // 30 one-second buckets; a decent hash covers most of them.
        expect(slots.size).toBeGreaterThan(20);
    });
});

describe('mockStartDelayMs', () => {
    it('uses the full start window when there is no window deadline', () => {
        const delay = mockStartDelayMs('user-1', 'mock-a', null);
        expect(delay).toBeGreaterThanOrEqual(0);
        expect(delay).toBeLessThan(MOCK_START_STAGGER_MS);
    });

    it('clamps the delay to leave the final 90 seconds untouched', () => {
        const delay = mockStartDelayMs('user-1', 'mock-a', 60);
        expect(delay).toBe(0);
    });

    it('only allows the remaining safe time when the window is short', () => {
        const delay = mockStartDelayMs('user-1', 'mock-a', 95);
        expect(delay).toBeLessThanOrEqual(5_000);
    });

    it('keeps the full spread when the window is long', () => {
        // 3 hours is the normal case: no clamping should occur.
        const unclamped = staggerDelayMs(
            'user-1',
            'mock-start:mock-a',
            MOCK_START_STAGGER_MS
        );
        expect(mockStartDelayMs('user-1', 'mock-a', 3 * 3600)).toBe(unclamped);
        expect(MOCK_START_MIN_WINDOW_SECONDS).toBe(90);
    });
});

describe('mockSubmitDelayMs', () => {
    it('uses the submit window and is stable per session', () => {
        const a = mockSubmitDelayMs('user-1', 'session-1');
        const b = mockSubmitDelayMs('user-1', 'session-1');
        expect(a).toBe(b);
        expect(a).toBeGreaterThanOrEqual(0);
        expect(a).toBeLessThan(MOCK_SUBMIT_STAGGER_MS);
    });

    it('returns 0 without a user', () => {
        expect(mockSubmitDelayMs(undefined, 'session-1')).toBe(0);
    });
});
