import { useState, useRef, useEffect } from 'react';

export const useQuestionTimer = (autoTimer, currentQuestion) => {
    const [isActive, setIsActive] = useState(autoTimer);
    const [time, setTime] = useState(0);
    const intervalRef = useRef(null);

    const start = () => {
        if (intervalRef.current) return;
        setIsActive(true);
        intervalRef.current = setInterval(() => {
            setTime(prev => prev + 1);
        }, 1000);
    };

    const stop = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        setIsActive(false);
    };

    const reset = () => {
        stop();
        setTime(0);
    };

    const toggle = () => {
        isActive ? stop() : start();
    };

    // Auto-start or stop based on settings
    useEffect(() => {
        if (autoTimer) {
            reset();
            start();
        } else {
            reset();
        }
        return () => clearInterval(intervalRef.current);
    }, [currentQuestion, autoTimer]);

    const minutes = String(Math.floor(time / 60)).padStart(2, '0');
    const seconds = String(time % 60).padStart(2, '0');

    return { time, minutes, seconds, isActive, toggle, stop, reset };
};