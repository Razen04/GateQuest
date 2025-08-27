import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { Toaster } from 'sonner';
import { registerSW } from 'virtual:pwa-register';

registerSW();

const rootEl = document.getElementById('root');

if (!rootEl) {
    throw new Error('Root element with id root is not found.');
}

createRoot(rootEl).render(
    <StrictMode>
        <Toaster richColors position="top-right" closeButton />
        <App />
    </StrictMode>,
);
