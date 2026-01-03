import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import useTestNavigation from '../useTestNavigation';

describe('useTestNavigation hook tests', () => {
    // Test case 1
    describe('initialization', () => {
        it('initializes at index 0 and marks it visited', () => {
            const { result } = renderHook(() => useTestNavigation(10));

            expect(result.current.currentIndex).toBe(0);
            expect(result.current.visitedIndices.has(0)).toBe(true);
        });
    });

    // Test case 2
    describe('next() and prev()', () => {
        it('next() moves forward and prev() moves backward', () => {
            const { result } = renderHook(() => useTestNavigation(10));

            act(() => {
                result.current.next();
            });

            expect(result.current.currentIndex).toBe(1);

            act(() => {
                result.current.prev();
            });

            expect(result.current.currentIndex).toBe(0);
        });
    });

    // Test case 3
    describe('prev() and next() boundary', () => {
        it('next() does nothing when at index = lastIndex and prev() does nothing at index = 0', () => {
            const { result } = renderHook(() => useTestNavigation(1));

            act(() => {
                const success = result.current.next();
                expect(success).toBe(false);
            });

            expect(result.current.currentIndex).toBe(0);

            act(() => {
                const success = result.current.prev();
                expect(success).toBe(false);
            });

            expect(result.current.currentIndex).toBe(0);
        });
    });

    // Test case 4
    describe('jumpTo and visitedIndices', () => {
        it('jumptTo() moves to the given index and mark it as visited', () => {
            const { result } = renderHook(() => useTestNavigation(10));

            act(() => {
                result.current.jumpTo(5);
            });

            expect(result.current.currentIndex).toBe(5);
            expect(result.current.visitedIndices.has(0)).toBe(true);
            expect(result.current.visitedIndices.has(5)).toBe(true);
        });
    });
});
