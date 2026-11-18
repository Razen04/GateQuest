import { useState } from 'react';
import { Button } from '@/shared/components/ui/button';

interface FullscreenPromptProps {
    strikes: number;
    maxStrikes: number;
    onEnter: () => void | Promise<void>;
}

export function FullscreenPrompt({ strikes, onEnter }: FullscreenPromptProps) {
    const [error, setError] = useState<string | null>(null);

    const title =
        strikes === 0
            ? 'Fullscreen required'
            : strikes === 1
              ? 'Warning: Strike 1 of 3'
              : strikes === 2
                ? 'Final warning: Strike 2 of 3'
                : 'Attempt disqualified';

    const body =
        strikes === 0
            ? 'This mock runs in fullscreen. Exiting fullscreen 3 times will auto-submit your attempt.'
            : strikes === 1
              ? 'You exited fullscreen once. Two more exits will disqualify your attempt. Re-enter to continue.'
              : strikes === 2
                ? 'One more fullscreen exit will immediately disqualify and submit your attempt.'
                : 'Your attempt has been submitted for review.';

    return (
        <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-6 text-center">
            <h1
                className={`text-2xl font-bold mb-3 ${
                    strikes >= 2 ? 'text-destructive' : 'text-foreground'
                }`}
            >
                {title}
            </h1>
            <p className="max-w-md text-muted-foreground mb-6">{body}</p>
            <Button
                size="lg"
                className="rounded-none bg-chart-1 text-white hover:bg-chart-1/90"
                onClick={async () => {
                    setError(null);
                    try {
                        await onEnter();
                    } catch {
                        setError(
                            'Fullscreen was blocked. Please allow it and try again.'
                        );
                    }
                }}
            >
                Enter Fullscreen & Continue
            </Button>
            {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
        </div>
    );
}
