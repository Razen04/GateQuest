import { Button } from '@/shared/components/ui/button';
import { useWebPush } from '../hooks/useWebPush';

export const WebNotificationToggle = () => {
    const { status, isProcessing, enableNotifications, disableNotifications, dismissWidget } =
        useWebPush();

    // --- RENDER CONDITIONALS ---
    if (status === 'loading' || status === 'dismissed' || status === 'unsupported') {
        return null; // Keep dashboard completely clean if loading, dismissed, or impossible
    }

    return (
        <div className="flex flex-col mb-2 sm:flex-row sm:items-center justify-between rounded-lg border p-4 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 gap-4 transition-all">
            <div className="space-y-1">
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                    {status === 'subscribed'
                        ? 'Notifications Active'
                        : 'Boost Your GATE Consistency'}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md">
                    {status === 'subscribed'
                        ? 'You are all set! We will notify you before your 24h smart revision package expires.'
                        : 'Get daily streak triggers, topic test alerts, and critical timelines directly on your device.'}
                </p>
                {status === 'denied' && (
                    <p className="text-[11px] font-medium text-red-500 mt-1">
                        ⚠️ Alerts are blocked. Reset permission settings in your browser URL bar to
                        resume.
                    </p>
                )}
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
                {status === 'ios-tab' ? (
                    <div className="rounded bg-amber-50 dark:bg-amber-950/30 p-2 text-[11px] text-amber-700 dark:text-amber-400 border border-amber-200/40">
                        📲 Tap <strong className="font-semibold">Share</strong> then{' '}
                        <strong className="font-semibold">Add to Home Screen</strong> to unlock
                        streak alerts.
                    </div>
                ) : status === 'subscribed' ? (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={disableNotifications}
                        disabled={isProcessing}
                        className="text-xs text-red-500 hover:text-red-600 dark:border-zinc-800"
                    >
                        Disable Alerts
                    </Button>
                ) : (
                    <>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-zinc-400 hover:text-zinc-500"
                            onClick={dismissWidget}
                            disabled={isProcessing}
                        >
                            Not Now
                        </Button>
                        <Button
                            size="sm"
                            onClick={enableNotifications}
                            disabled={status === 'denied' || isProcessing}
                            className="text-xs font-medium"
                        >
                            {isProcessing ? 'Connecting...' : 'Enable Notifications'}
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
};
