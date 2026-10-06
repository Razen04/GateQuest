import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

type OfflineState = {
    isOnline: boolean;
    setIsOnline: (value: boolean) => void;
};

export const useOfflineStore = create<OfflineState>()(
    devtools(
        (set) => ({
            // Initial value from the browser, defaulting to true if unavailable.
            // `navigator` won't exist during any future SSR, hence the guard.
            isOnline:
                typeof navigator !== 'undefined' ? navigator.onLine : true,

            setIsOnline: (value) =>
                set({ isOnline: value }, false, 'offline/setIsOnline'),
        }),
        { name: 'OfflineStore' }
    )
);
