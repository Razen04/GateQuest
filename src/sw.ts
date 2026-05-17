/// <reference lib="webworker" />
/* eslint-disable no-undef */

import { precacheAndRoute } from 'workbox-precaching';

// 'self' operates in the scope of service worker thread
declare let self: ServiceWorkerGlobalScope;

// On build, Vite swaps out this to our master array of static cached assets
precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener('push', (event) => {
    if (!event.data) {
        console.warn('Push event is received but payload data is emty.');
        return;
    }

    try {
        const payload = event.data.json();

        const title = payload.title || 'GATEQuest';
        const body = payload.body || 'Keep practicing PYQs';
        const deepLinkUrl = payload.url || '/dashboard';

        // waitUntil tells the browser to keep the background thread alive until the promise is completely resolved
        event.waitUntil(
            self.registration.showNotification(title, {
                body: body,
                icon: '/logo.svg',
                badge: '/logo.svg',
                vibrate: [100, 50, 100],
                data: {
                    url: deepLinkUrl,
                },
            } as NotificationOptions),
        );
    } catch (err) {
        console.error('Service worker failed to unpack push notification data: ', err);
    }
});

// Handle banner clock and deep link routing
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const targetUrl = event.notification.data?.url || '/dashboard';

    event.waitUntil(
        self.clients
            .matchAll({ type: 'window', includeUncontrolled: true })
            .then((windowclients) => {
                for (const client of windowclients) {
                    if (client.url && 'focus' in client) {
                        return client.navigate(targetUrl).then(() => client.focus());
                    }
                }

                if (self.clients.openWindow) {
                    return self.clients.openWindow(targetUrl);
                }
            }),
    );
});
