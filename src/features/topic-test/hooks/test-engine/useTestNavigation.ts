import { useState } from 'react';

interface useTestNavigationResult {
    next: () => boolean;
    prev: () => boolean;
    jumpTo: (i: number) => boolean;
    currentIndex: number;
    visitedIndices: Set<number>;
}
const useTestNavigation = (totalQuestions: number): useTestNavigationResult => {
    const [currentIndex, setCurrentIndex] = useState<number>(0);
    const [visitedIndices, setVisitedIndices] = useState<Set<number>>(() => new Set([0]));

    const markAsVisited = (index: number) => {
        setVisitedIndices((prev) => {
            return new Set(prev).add(index);
        });
    };

    const next = () => {
        if (currentIndex >= totalQuestions - 1) return false;

        let nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
        markAsVisited(nextIndex);
        return true;
    };

    const prev = () => {
        if (currentIndex === 0) return false;

        let prevIndex = currentIndex - 1;
        setCurrentIndex(prevIndex);
        markAsVisited(prevIndex);
        return true;
    };

    const jumpTo = (index: number) => {
        if (index < 0 || index >= totalQuestions) return false;
        setCurrentIndex(index);
        markAsVisited(index);
        return true;
    };

    return {
        next,
        prev,
        jumpTo,
        visitedIndices,
        currentIndex,
    };
};

export default useTestNavigation;
