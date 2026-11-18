import { useCallback, useEffect, useRef, useState } from 'react';

const MAX_STRIKES = 3;

interface UseFullscreenGuardOptions {
    enabled: boolean;
    onStrikeOut: () => void;
    /** Unique per-session key (e.g., `fs-guard-${testId}`) */
    storageKey: string;
}

interface UseFullscreenGuardResult {
    strikes: number;
    isSupported: boolean;
    reset: () => void;
}

function loadStrikes(key: string): number {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return 0;
        const n = parseInt(raw, 10);
        return Number.isFinite(n) && n >= 0 ? n : 0;
    } catch {
        return 0;
    }
}

function saveStrikes(key: string, n: number): void {
    try {
        localStorage.setItem(key, String(n));
    } catch {
        /* noop — private mode or quota */
    }
}

function clearStrikes(key: string): void {
    try {
        localStorage.removeItem(key);
    } catch {
        /* noop */
    }
}

export function useFullscreenGuard({
    enabled,
    onStrikeOut,
    storageKey,
}: UseFullscreenGuardOptions): UseFullscreenGuardResult {
    const [strikes, setStrikes] = useState(() => loadStrikes(storageKey));
    const [isSupported] = useState(
        () =>
            typeof document !== 'undefined' &&
            typeof document.documentElement.requestFullscreen === 'function'
    );

    // Ref pattern to avoid effect re-subscription on every parent render
    const onStrikeOutRef = useRef(onStrikeOut);
    useEffect(() => {
        onStrikeOutRef.current = onStrikeOut;
    }, [onStrikeOut]);

    // Track whether user was in fullscreen on the previous event.
    // Prevents false positives if the user wasn't in fullscreen when
    // the guard armed (e.g., requestFullscreen denied).
    const wasInFullscreenRef = useRef(
        typeof document !== 'undefined' && !!document.fullscreenElement
    );

    useEffect(() => {
        if (!enabled || !isSupported) return;

        const handleChange = () => {
            const nowInFullscreen = !!document.fullscreenElement;

            if (wasInFullscreenRef.current && !nowInFullscreen) {
                // Transition from in → out: count strike
                setStrikes((prev) => {
                    const next = prev + 1;
                    saveStrikes(storageKey, next);

                    if (next >= MAX_STRIKES) {
                        onStrikeOutRef.current();
                    }
                    return next;
                });
            }
            wasInFullscreenRef.current = nowInFullscreen;
        };

        document.addEventListener('fullscreenchange', handleChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleChange);
        };
    }, [enabled, isSupported, storageKey]);

    const reset = useCallback(() => {
        setStrikes(0);
        clearStrikes(storageKey);
        wasInFullscreenRef.current = !!document.fullscreenElement;
    }, [storageKey]);

    return { strikes, isSupported, reset };
}
