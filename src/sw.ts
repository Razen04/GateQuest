/// <reference lib="webworker" />
/* eslint-disable no-undef */

import type { WorkboxPlugin } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst } from 'workbox-strategies';

// 'self' operates in the scope of service worker thread
declare let self: ServiceWorkerGlobalScope;

// Clean up previous service worker precache caches
cleanupOutdatedCaches();

// On build, Vite swaps out this to our master array of static cached assets
precacheAndRoute(self.__WB_MANIFEST);

// Cache KaTeX fonts on demand via CacheFirst (valid for 1 year)
registerRoute(
    ({ request, url }) =>
        request.destination === 'font' || url.pathname.includes('KaTeX_'),
    new CacheFirst({
        cacheName: 'katex-fonts-cache',
        plugins: [
            new ExpirationPlugin({
                maxEntries: 60,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
            }) as unknown as WorkboxPlugin,
        ],
    })
);

self.addEventListener('push', (event) => {
    if (!event.data) {
        console.warn('Push event is received but payload data is empty.');
        return;
    }

    try {
        const payload = event.data.json();

        const title = payload.title || 'GATEQuest';
        const body = payload.body || 'Keep practicing PYQs';
        const deepLinkUrl = payload.url || '/dashboard';

        event.waitUntil(
            self.registration.showNotification(title, {
                body: body,
                icon: '/icons/logo.svg',
                badge: '/icons/logo.svg',
                vibrate: [100, 50, 100],
                data: {
                    url: deepLinkUrl,
                },
            } as NotificationOptions)
        );
    } catch (err) {
        console.error(
            'Service worker failed to unpack push notification data: ',
            err
        );
    }
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const targetUrl = event.notification.data?.url || '/';
    const absoluteUrl = new URL(targetUrl, self.location.origin).href;

    event.waitUntil(
        self.clients
            .matchAll({ type: 'window', includeUncontrolled: true })
            .then((windowClients) => {
                for (const client of windowClients) {
                    if ('focus' in client && 'navigate' in client) {
                        return client
                            .navigate(absoluteUrl)
                            .then(() => client.focus());
                    }
                }

                if (self.clients.openWindow) {
                    return self.clients.openWindow(absoluteUrl);
                }
            })
    );
});
