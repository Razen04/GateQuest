import { useEffect } from 'react';
import { useOfflineStore } from '@/app/stores/useOfflineStore';

export function useOfflineEffects() {
    useEffect(() => {
        const handleOnline = () => useOfflineStore.getState().setIsOnline(true);
        const handleOffline = () =>
            useOfflineStore.getState().setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);
}
