import { useEffect, useRef, useState } from 'react';

interface useTestTimerPropsType {
    initialSeconds: number;
    onExpire?: () => void;
}

const useTestTimer = ({ initialSeconds, onExpire }: useTestTimerPropsType) => {
    const targetTimeRef = useRef<number | null>(null);
    const intervalRef = useRef<number | null>(null);
    const onExpireRef = useRef<(() => void) | undefined>(onExpire);
    const hasExpiredRef = useRef(false);

    const [secondsRemaining, setSecondsRemaining] = useState(initialSeconds);
    const [isExpired, setIsExpired] = useState(false);

    // Helper to format time: MM:SS
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;

        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    useEffect(() => {
        onExpireRef.current = onExpire;
    }, [onExpire]);

    useEffect(() => {
        // Calculate target end time
        if (!targetTimeRef.current) targetTimeRef.current = Date.now() + initialSeconds * 1000;

        const tick = () => {
            if (!targetTimeRef.current) return;

            const diffM = targetTimeRef.current - Date.now();
            const nextSeconds = Math.max(0, Math.ceil(diffM / 1000));

            setSecondsRemaining(nextSeconds);

            if (nextSeconds === 0 && !hasExpiredRef.current) {
                hasExpiredRef.current = true;
                setIsExpired(true);
                onExpireRef?.current?.();

                if (intervalRef.current) clearInterval(intervalRef.current);
            }
        };

        tick(); // run immediately

        intervalRef.current = window.setInterval(tick, 1000); // tick every second

        // cleanup
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []); // initialSeconds does not change mid-test so we don't include it in dependency array

    return {
        timeDisplay: formatTime(secondsRemaining),
        secondsRemaining,
        isExpired,
    };
};

export default useTestTimer;
