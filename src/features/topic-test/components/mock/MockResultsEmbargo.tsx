import { Lock } from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { formatCountdown, formatDateTime } from '../../utils/mockFormat';

interface MockResultsEmbargoProps {
    /** ISO timestamp when results release */
    resultsAt: string;
    /** Fired exactly once when the countdown reaches zero */
    onReleased?: () => void;
    className?: string;
}

function remainingSeconds(resultsAt: string): number {
    const ms = new Date(resultsAt).getTime() - Date.now();
    return Math.max(0, Math.floor(ms / 1000));
}

const MockResultsEmbargo = ({
    resultsAt,
    onReleased,
    className = '',
}: MockResultsEmbargoProps) => {
    const [remaining, setRemaining] = useState(() =>
        remainingSeconds(resultsAt)
    );
    const firedRef = useRef(false);

    useEffect(() => {
        setRemaining(remainingSeconds(resultsAt));
        firedRef.current = false;
    }, [resultsAt]);

    useEffect(() => {
        if (remaining <= 0) {
            if (!firedRef.current) {
                firedRef.current = true;
                onReleased?.();
            }
            return;
        }
        const id = setInterval(() => {
            setRemaining(remainingSeconds(resultsAt));
        }, 1000);
        return () => clearInterval(id);
    }, [remaining, resultsAt, onReleased]);

    return (
        <div
            className={`border border-border bg-card/60 backdrop-blur-2xl p-6 sm:p-8 text-center ${className}`}
        >
            <div className="inline-flex items-center justify-center h-14 w-14 bg-chart-4/10 text-chart-4 mb-4">
                <Lock size={28} weight="fill" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">
                Results locked
            </h2>
            <p className="text-sm text-muted-foreground mb-1">
                Your attempt is saved. Scores, analysis, and leaderboard unlock
                when the mock window closes.
            </p>
            <p className="font-mono text-2xl font-bold text-chart-4 mt-4 mb-1">
                {formatCountdown(remaining) || 'Releasing…'}
            </p>
            <p className="text-xs text-muted-foreground">
                Unlocks {formatDateTime(resultsAt)}
            </p>
            {remaining <= 0 && (
                <Button
                    variant="outline"
                    className="mt-4 rounded-none"
                    onClick={() => {
                        firedRef.current = false;
                        onReleased?.();
                    }}
                >
                    Reload Results
                </Button>
            )}
        </div>
    );
};

export default MockResultsEmbargo;
