import { useEffect } from 'react';
import { Button } from '@/shared/components/ui/button';
import { useWebPush } from '../hooks/useWebPush';

export const WebNotificationToggle = () => {
    const {
        status,
        isProcessing,
        enableNotifications,
        disableNotifications,
        dismissWidget,
    } = useWebPush();

    useEffect(() => {
        if (status === 'subscribed') {
            const autoDismissTimer = setTimeout(() => {
                dismissWidget();
            }, 5000);

            return () => clearTimeout(autoDismissTimer);
        }
    }, [status, dismissWidget]);

    if (
        status === 'loading' ||
        status === 'dismissed' ||
        status === 'unsupported'
    ) {
        return null; // Keep dashboard completely clean if loading, dismissed, or impossible
    }

    return (
        <div className="mb-2 flex flex-col justify-between gap-4 border border-border bg-card p-4 text-card-foreground transition-all sm:flex-row sm:items-center">
            <div className="space-y-1">
                <h3 className="text-base font-semibold text-foreground">
                    {status === 'subscribed'
                        ? 'Notifications Active'
                        : 'Boost Your GATE Consistency'}
                </h3>

                <p className="max-w-md text-xs text-muted-foreground">
                    {status === 'subscribed'
                        ? 'You are all set! We will notify you before your 24h smart revision package expires.'
                        : 'Get daily streak triggers, topic test alerts, and critical timelines directly on your device.'}
                </p>

                {status === 'denied' && (
                    <p className="mt-1 text-[11px] font-medium text-destructive">
                        ⚠️ Alerts are blocked. Reset permission settings in your
                        browser URL bar to resume.
                    </p>
                )}
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
                {status === 'ios-tab' ? (
                    <div className="border border-chart-4/30 bg-chart-4/10 p-2 text-[11px] text-foreground">
                        📲 Tap <strong className="font-semibold">Share</strong>{' '}
                        then{' '}
                        <strong className="font-semibold">
                            Add to Home Screen
                        </strong>{' '}
                        to unlock streak alerts.
                    </div>
                ) : status === 'subscribed' ? (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={disableNotifications}
                        disabled={isProcessing}
                        className="rounded-none border-border text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                        Disable Alerts
                    </Button>
                ) : (
                    <>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-none text-xs text-muted-foreground hover:text-foreground"
                            onClick={dismissWidget}
                            disabled={isProcessing}
                        >
                            Not Now
                        </Button>

                        <Button
                            size="sm"
                            onClick={enableNotifications}
                            disabled={status === 'denied' || isProcessing}
                            className="rounded-none text-xs font-medium"
                        >
                            {isProcessing
                                ? 'Connecting...'
                                : 'Enable Notifications'}
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
};
