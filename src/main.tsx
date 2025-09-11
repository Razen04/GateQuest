import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { Toaster } from 'sonner';
import { registerSW } from 'virtual:pwa-register';

const clearStaleData = () => {
    const staleKeys = [
        'CO & Architecture',
        'Aptitude',
        'Theory of Computation',
        'Operating System',
        'Data Structures',
        'Computer Networks',
        'Databases',
        'Compiler Design',
        'Algorithms',
    ];

    staleKeys.forEach((key) => localStorage.removeItem(key));
};

let updateSW: (reloadPage?: boolean) => void;
let swRegistered = false;

const showUpdateAvailablePrompt = () => {
    const userAccepted = window.confirm(
        'A new version is available. Update now? Note: Your unsynced attempts will not be synced (You can attempt them again)',
    );

    if (userAccepted) {
        clearStaleData();
        if (updateSW) updateSW(true);
    }
};

if (!swRegistered) {
    swRegistered = true;

    updateSW = registerSW({
        onNeedRefresh() {
            console.log('⚡ Update available...');
            showUpdateAvailablePrompt();
        },
        onOfflineReady() {
            console.log('✅ App ready to work offline');
        },
    });
}

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element with id root is not found.');

createRoot(rootEl).render(
    <StrictMode>
        <Toaster richColors position="top-right" closeButton />
        <App />
    </StrictMode>,
);
