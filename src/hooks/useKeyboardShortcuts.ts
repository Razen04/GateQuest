// This custom hook sets up global keyboard shortcuts for navigating and interacting with the practice question interface.

import { useEffect, type DependencyList } from 'react';

/**
 * Attaches global keyboard event listeners for practice card actions.
 * - A: previous question
 * - D: next question
 * - Enter: show answer
 * - E: open explanation
 * The hook ensures these shortcuts don't interfere with text inputs.
 */

type useKeyboardShortcutsProps = {
    onPrev: () => void;
    onNext: () => void;
    onShowAnswer: () => void;
    onExplain?: () => void;
};
export default function useKeyboardShortcuts(
    { onPrev, onNext, onShowAnswer, onExplain }: useKeyboardShortcutsProps,
    deps: DependencyList = [], // Dependencies for the useEffect hook, passed from the calling component.
) {
    useEffect(() => {
        // This function handles the 'keydown' event.
        const handleKeyStroke = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement)?.tagName;
            // We prevent the shortcuts from firing if the user is typing in an input field or if a modifier key (like Ctrl or Alt) is pressed.
            if (tag === 'INPUT' || tag === 'TEXTAREA' || e.metaKey || e.ctrlKey || e.altKey) {
                return;
            }

            // A switch statement to handle the different key presses.
            switch (e.code) {
                case 'KeyA': // 'A' for previous
                    e.preventDefault();
                    onPrev?.(); // Optional chaining in case a handler isn't provided.
                    break;
                case 'KeyD': // 'D' for next
                    e.preventDefault();
                    onNext?.();
                    break;
                case 'Enter': // 'Enter' to submit/show answer
                    e.preventDefault();
                    onShowAnswer?.();
                    break;
                case 'KeyE': // 'E' for explanation
                    e.preventDefault();
                    onExplain?.();
                    break;
                default:
                    break;
            }
        };

        // Add the event listener to the document when the component mounts.
        document.addEventListener('keydown', handleKeyStroke);
        // The cleanup function removes the event listener when the component unmounts to prevent memory leaks.
        return () => document.removeEventListener('keydown', handleKeyStroke);
        // The eslint-disable comment is here because the dependencies (`deps`) are intentionally passed from the parent component to control when the effect re-runs.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);
}
