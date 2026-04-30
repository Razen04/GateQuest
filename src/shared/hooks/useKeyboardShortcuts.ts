// This custom hook sets up global keyboard shortcuts for navigating and interacting with the practice question interface.

import { useEffect, type DependencyList } from 'react';

/**
 * Attaches global keyboard event listeners for practice card actions.
 * - Q: previous question
 * - W: next question
 * - Enter/Space: show answer
 * - Slash (/): open explanation
 * - Option selection using A/B/C/D/E or 1/2/3/4/5
 * The hook ensures these shortcuts don't interfere with text inputs.
 */

type useKeyboardShortcutsProps = {
    onPrev: () => void;
    onNext: () => void;
    onShowAnswer: () => void;
    onSubmit?: () => void;
    onExplain?: () => void;
    hasSelection?: boolean;
};
export default function useKeyboardShortcuts(
    { onPrev, onNext, onShowAnswer, onSubmit, onExplain, hasSelection }: useKeyboardShortcutsProps,
    deps: DependencyList = [], // Dependencies for the useEffect hook, passed from the calling component.
) {
    const getOptionCodeFromKey = (code: string) => {
        const map: Record<string, number> = {
            KeyA: 0,
            KeyB: 1,
            KeyC: 2,
            KeyD: 3,
            KeyE: 4,
            Digit1: 0,
            Digit2: 1,
            Digit3: 2,
            Digit4: 3,
            Digit5: 4,
            Numpad1: 0,
            Numpad2: 1,
            Numpad3: 2,
            Numpad4: 3,
            Numpad5: 4,
        };

        return map[code] ?? null;
    };
    useEffect(() => {
        // This function handles the 'keydown' event.
        const handleKeyStroke = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement)?.tagName;
            // We prevent the shortcuts from firing if the user is typing in an input field or if a modifier key (like Ctrl or Alt) is pressed.
            if (tag === 'INPUT' || tag === 'TEXTAREA' || e.metaKey || e.ctrlKey || e.altKey) {
                return;
            }

            // Option selection
            const optionIndex = getOptionCodeFromKey(e.code);
            if (optionIndex !== null) {
                window.dispatchEvent(
                    new CustomEvent('selectOptionByIndex', {
                        detail: optionIndex,
                    }),
                );
                return;
            }

            // A switch statement to handle the different key presses.
            switch (e.code) {
                case 'KeyQ': // 'Q' for previous
                case 'ArrowLeft': // 'ArrowLeft' for previous
                    e.preventDefault();
                    onPrev?.(); // Optional chaining in case a handler isn't provided.
                    break;
                case 'KeyW': // 'W' for next
                case 'ArrowRight':
                    e.preventDefault();
                    onNext?.();
                    break;
                case 'Enter': // 'Enter' to submit/show answer
                case 'Space':
                    e.preventDefault();
                    if (hasSelection && onSubmit) {
                        onSubmit();
                    } else {
                        onShowAnswer?.();
                    }
                    break;
                case 'Slash': // 'E' for explanation
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
