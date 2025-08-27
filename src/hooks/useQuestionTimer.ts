// This custom hook provides a flexible timer functionality for questions.
// It can be started, stopped, and reset, and supports an auto-start feature.

import { useState, useRef, useEffect, useCallback } from 'react';
import type { Question } from '../types/question.ts';

// Manages the state and logic for a question timer.
export const useQuestionTimer = (autoTimer = false, currentQuestion?: Question) => {
    // State to track if the timer is currently running.
    const [isActive, setIsActive] = useState(autoTimer);
    // State to store the elapsed time in seconds.
    const [time, setTime] = useState(0);
    // A ref to hold the interval ID, allowing us to clear it later.
    // Using a ref is important because it doesn't trigger a re-render on change.
    const intervalRef = useRef<number | null>(null);

    // Starts the timer. Wrapped in useCallback to ensure the function reference is stable.
    const start = useCallback(() => {
        // A guard to prevent creating multiple intervals if start is called more than once.
        if (intervalRef.current) return;
        setIsActive(true);
        intervalRef.current = window.setInterval(() => {
            setTime((prev) => prev + 1);
        }, 1000);
    }, []); // Empty dependency array as it has no external dependencies.

    // Stops the timer. Wrapped in useCallback for stability.
    const stop = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null; // Clear the ref after stopping.
        }
        setIsActive(false);
    }, []); // Empty dependency array.

    // Resets the timer to its initial state. Wrapped in useCallback.
    const reset = useCallback(() => {
        stop();
        setTime(0);
    }, [stop]); // Depends on the `stop` function.

    // Toggles the timer's state between active and inactive.
    // This function doesn't need useCallback as it's simple and its identity is not critical for dependency arrays in other hooks.
    const toggle = () => {
        if (isActive) {
            stop();
        } else {
            start();
        }
    };

    // This effect handles the auto-start behavior based on the user's settings.
    // It runs whenever the current question or the autoTimer setting changes.
    useEffect(() => {
        if (autoTimer) {
            // If auto-timer is on, reset and start the timer for the new question.
            reset();
            start();
        } else {
            // If it's off, just ensure the timer is reset.
            reset();
        }
        // The cleanup function ensures the interval is cleared when the component unmounts
        // or before the effect re-runs, preventing memory leaks.
        return () => {
            if (intervalRef.current !== null) {
                clearInterval(intervalRef.current);
            }
        };
    }, [currentQuestion, autoTimer, reset, start]); // Dependencies include the memoized functions.

    // Format the elapsed time into a 'MM:SS' string for display.
    const minutes = String(Math.floor(time / 60)).padStart(2, '0');
    const seconds = String(time % 60).padStart(2, '0');

    // Expose the timer's state and control functions to the component.
    return { time, minutes, seconds, isActive, toggle, stop, reset };
};
