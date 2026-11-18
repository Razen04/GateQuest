import { X } from '@phosphor-icons/react';
import { useEffect } from 'react';
import { Button } from '@/shared/components/ui/button';
import type { ResolvedMock } from '@/shared/types/mock';

interface MockAnnouncementDialogProps {
    mock: ResolvedMock | null;
    onDismiss: () => void;
}

/**
 * One-shot announcement for a new or newly-live mock. Shows at most one
 * per picker visit. Dismissal is per-mock and persisted in localStorage;
 * un-dismissed announcements reappear on the next visit (e.g. a user who
 * closed the tab without dismissing).
 *
 * Only `live` and `upcoming` mocks have announcements. Once a mock ends
 * or is completed, the dialog never appears for it again.
 */
const MockAnnouncementDialog = ({
    mock,
    onDismiss,
}: MockAnnouncementDialogProps) => {
    // Escape closes
    useEffect(() => {
        if (!mock) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onDismiss();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [mock, onDismiss]);

    if (!mock?.announcement) return null;

    const isLive = mock.state === 'live';

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mock-announcement-title"
            onClick={onDismiss}
        >
            <div
                className="relative w-full max-w-md border border-border bg-card p-6 sm:p-8 shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onDismiss}
                    aria-label="Close announcement"
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="flex flex-wrap items-center gap-1.5 mb-3">
                    {mock.seriesNumber != null && mock.seriesNumber < 9000 && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-chart-1/10 text-chart-1 border border-chart-1/20">
                            Series {mock.seriesNumber}
                        </span>
                    )}
                    {isLive ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-chart-2/10 text-chart-2 border border-chart-2/20">
                            Live now
                        </span>
                    ) : (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-muted text-muted-foreground border border-border">
                            Coming up
                        </span>
                    )}
                    {mock.isBeta && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-chart-2/10 text-chart-2 border border-chart-2/20">
                            Beta
                        </span>
                    )}
                </div>

                <h2
                    id="mock-announcement-title"
                    className="text-lg font-bold text-foreground mb-2"
                >
                    {mock.label}
                </h2>

                <p className="text-sm text-foreground/90 whitespace-pre-line mb-6 leading-relaxed">
                    {mock.announcement}
                </p>

                <Button
                    onClick={onDismiss}
                    className="w-full rounded-none bg-chart-1 text-white hover:bg-chart-1/90"
                >
                    Got it
                </Button>
            </div>
        </div>
    );
};

export default MockAnnouncementDialog;
