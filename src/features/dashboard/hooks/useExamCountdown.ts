import { useEffect, useMemo, useState } from 'react';

export const useExamCountdown = (target: string) => {
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        const interval = setInterval(() => {
            setNow(new Date());
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    return useMemo(() => {
        const diff = Math.max(new Date(target).getTime() - now.getTime(), 0);

        return {
            days: Math.floor(diff / 86400000),
            hours: Math.floor((diff % 86400000) / 3600000),
            minutes: Math.floor((diff % 3600000) / 60000),
            seconds: Math.floor((diff % 60000) / 1000),
        };
    }, [now, target]);
};
