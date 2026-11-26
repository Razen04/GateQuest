import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import useTestNavigation from '@/features/topic-test/hooks/test-engine/useTestNavigation';
import type { Question } from '@/shared/types/storage';

const makeQuestion = (section: string): Question =>
    ({ id: section, metadata: { section } }) as Question;

describe('useTestNavigation hook tests', () => {
    it('initializes at index 0 and marks it visited', () => {
        const { result } = renderHook(() => useTestNavigation(10));

        expect(result.current.currentIndex).toBe(0);
        expect(result.current.visitedIndices.has(0)).toBe(true);
    });

    it('next() moves forward and prev() moves backward', () => {
        const { result } = renderHook(() => useTestNavigation(10));

        act(() => {
            result.current.next();
        });

        expect(result.current.currentIndex).toBe(1);
        expect(result.current.visitedIndices.has(1)).toBe(true);

        act(() => {
            result.current.prev();
        });

        expect(result.current.currentIndex).toBe(0);
    });

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

    it('jumptTo() rejects out of range indices', () => {
        const { result } = renderHook(() => useTestNavigation(10));
        let success = false;
        act(() => {
            success = result.current.jumpTo(11);
        });

        expect(success).toBe(false);

        expect(result.current.currentIndex).toBe(0);
    });

    it('jumptTo() moves to the given index and mark it as visited', () => {
        const { result } = renderHook(() => useTestNavigation(10));

        act(() => {
            result.current.jumpTo(5);
        });

        expect(result.current.currentIndex).toBe(5);
        expect(result.current.visitedIndices.has(0)).toBe(true);
        expect(result.current.visitedIndices.has(5)).toBe(true);
    });

    it('navigates across the GA/TECH boundary in paper order', () => {
        const questions = [
            makeQuestion('GA'),
            makeQuestion('GA'),
            makeQuestion('TECH'),
            makeQuestion('TECH'),
        ];
        const { result } = renderHook(() =>
            useTestNavigation(questions.length, questions)
        );

        expect(result.current.isFirst).toBe(true);
        act(() => {
            result.current.next();
        });
        expect(result.current.currentIndex).toBe(1);
        expect(result.current.isLast).toBe(false);

        // Last GA -> first TECH
        let success = true;
        act(() => {
            success = result.current.next();
        });
        expect(success).toBe(true);
        expect(result.current.currentIndex).toBe(2);
        expect(result.current.isFirst).toBe(false);

        // First TECH -> last GA
        act(() => {
            result.current.prev();
        });
        expect(result.current.currentIndex).toBe(1);

        // Only the ends of the paper stop navigation
        act(() => {
            result.current.jumpTo(3);
        });
        expect(result.current.isLast).toBe(true);
        act(() => {
            success = result.current.next();
        });
        expect(success).toBe(false);
        expect(result.current.currentIndex).toBe(3);
    });
});
