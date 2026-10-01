import { WifiSlash } from '@phosphor-icons/react';
import { useOfflineStore } from '@/app/stores/useOfflineStore';

export function OfflineBanner() {
    const isOnline = useOfflineStore((s) => s.isOnline);

    if (isOnline) return null;

    return (
        <div
            role="status"
            aria-live="polite"
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 border border-amber-400 bg-amber-50 px-4 py-2 text-sm text-amber-800 shadow-lg dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200"
        >
            <WifiSlash weight="bold" className="h-4 w-4 shrink-0" />
            <span>You're offline. Please connect to the internet.</span>
        </div>
    );
}
