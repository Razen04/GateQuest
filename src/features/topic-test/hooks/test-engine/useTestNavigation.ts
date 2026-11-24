import { useCallback, useState } from 'react';
import type { Question } from '@/shared/types/storage';
import { getAdjacentIndex } from '../../utils/questionPalette';

interface useTestNavigationResult {
    next: () => boolean;
    prev: () => boolean;
    jumpTo: (i: number) => boolean;
    currentIndex: number;
    visitedIndices: Set<number>;
    isFirst: boolean;
    isLast: boolean;
}
const useTestNavigation = (
    totalQuestions: number,
    questions: Question[] = []
): useTestNavigationResult => {
    const [currentIndex, setCurrentIndex] = useState<number>(0);
    const [visitedIndices, setVisitedIndices] = useState<Set<number>>(
        () => new Set([0])
    );

    const markAsVisited = useCallback((index: number) => {
        setVisitedIndices((prev) => new Set(prev).add(index));
    }, []);

    const next = useCallback(() => {
        const nextIndex = questions.length
            ? getAdjacentIndex(questions, currentIndex, 1)
            : currentIndex + 1;
        if (nextIndex == null || nextIndex >= totalQuestions) return false;
        setCurrentIndex(nextIndex);
        markAsVisited(nextIndex);
        return true;
    }, [currentIndex, questions, totalQuestions, markAsVisited]);

    const prev = useCallback(() => {
        const prevIndex = questions.length
            ? getAdjacentIndex(questions, currentIndex, -1)
            : currentIndex - 1;
        if (prevIndex == null || prevIndex < 0) return false;
        setCurrentIndex(prevIndex);
        markAsVisited(prevIndex);
        return true;
    }, [currentIndex, questions, markAsVisited]);

    const jumpTo = useCallback(
        (index: number) => {
            if (index < 0 || index >= totalQuestions) return false;
            setCurrentIndex(index);
            markAsVisited(index);
            return true;
        },
        [totalQuestions, markAsVisited]
    );

    const isFirst =
        questions.length > 0 &&
        getAdjacentIndex(questions, currentIndex, -1) === null;
    const isLast =
        questions.length > 0 &&
        getAdjacentIndex(questions, currentIndex, 1) === null;

    return {
        next,
        prev,
        jumpTo,
        visitedIndices,
        currentIndex,
        isFirst,
        isLast,
    };
};

export default useTestNavigation;
