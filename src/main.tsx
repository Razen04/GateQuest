// main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { Toaster } from 'sonner';
import { registerSW } from 'virtual:pwa-register';

// --- helper to clear localStorage + Cache Storage ---
const clearStaleData = async () => {
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
        'Discrete Maths',
        'Digital Logic',
        'Engineering Mathematics',
    ];

    try {
        staleKeys.forEach((k) => {
            if (k) {
                localStorage.removeItem(k);
            }
        });
    } catch (e) {
        console.warn('⚠️ localStorage clearing error:', e);
    }

    try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
    } catch (e) {
        console.warn('⚠️ Cache Storage clearing error:', e);
    }
};

// --- instrument service worker lifecycle & registration ---
if ('serviceWorker' in navigator) {
    // Clear when a new SW takes control
    navigator.serviceWorker.addEventListener('controllerchange', async () => {
        await clearStaleData();
    });

    // Register SW
    registerSW({
        immediate: true,
        onRegistered(registration) {
            if (registration) {
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            console.log('installing worker statechange:', newWorker.state);
                        });
                    }
                });
            }
        },
        onRegisterError(err) {
            console.error('🔴 SW registration error:', err);
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
