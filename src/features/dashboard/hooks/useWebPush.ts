import { urlBase64ToUint8Array } from '@/shared/utils/cryptoUtils';
import { useEffect, useState } from 'react';
import { deleteNotificationDetails, pushNotificationDetails } from '../api/webpush';

// State tracking types for the internal state machine
type PushStatus =
    | 'loading'
    | 'unsupported'
    | 'ios-tab'
    | 'dismissed'
    | 'unsubscribed'
    | 'subscribed'
    | 'denied';

export const useWebPush = () => {
    const [status, setStatus] = useState<PushStatus>('loading');
    const [isProcessing, setIsProcessing] = useState(false);

    // Grab the VAPID public key from your environment variables
    const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

    useEffect(() => {
        const determineInitialStatus = async () => {
            // Checking if user previously dismissed this card aggressively
            if (localStorage.getItem('gatequest_push_dismissed') === 'true') {
                setStatus('dismissed');
                return;
            }

            // does the browser even support workers and push?
            if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
                setStatus('unsupported');
                return;
            }

            // Is this an iPhone/iPad running standard Safari?
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
            const isStandalone =
                window.matchMedia('(display-mode: standalone)').matches ||
                (navigator as any).standalone === true;

            if (isIOS && !isStandalone) {
                setStatus('ios-tab');
                return;
            }

            // has the device physically blocked us in browser settings?
            if (Notification.permission === 'denied') {
                setStatus('denied');
                return;
            }

            try {
                // Wait for worker to be ready, then check browser cache
                const registration = await navigator.serviceWorker.ready;
                const existingSubscription = await registration.pushManager.getSubscription();

                if (existingSubscription) {
                    setStatus('subscribed');
                } else {
                    setStatus('unsubscribed');
                }
            } catch (error) {
                console.error('Failed to inspect push manager system state:', error);
                setStatus('unsubscribed');
            }
        };

        determineInitialStatus();
    }, []);

    // Enable Notifications
    const enableNotifications = async () => {
        setIsProcessing(true);
        try {
            // Prompt the native browser permission dialog pop-up
            const permission = await Notification.requestPermission();
            if (permission === 'denied') {
                setStatus('denied');
                return;
            }

            // Fetch active service worker registration mapping
            const registration = await navigator.serviceWorker.ready;

            // Convert our public credential into raw binary format
            const binaryApplicationKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);

            // Request a pristine cryptographic routing endpoint string from browser engine
            const newSubscription = await registration.pushManager.subscribe({
                userVisibleOnly: true, // Required rule promising only user-visible alerts
                applicationServerKey: binaryApplicationKey as any,
            });

            // Extract raw cryptographic keys into string parts
            const subscriptionJSON = newSubscription.toJSON();
            const endpoint = subscriptionJSON.endpoint;
            const auth_key = subscriptionJSON.keys?.auth;
            const p256dh_key = subscriptionJSON.keys?.p256dh;

            if (!endpoint || !auth_key || !p256dh_key) {
                throw new Error('Browser network failed to construct public signature payload.');
            }

            // Securely push into your Postgres table using upsert (ignores structural duplicates)
            await pushNotificationDetails(endpoint, auth_key, p256dh_key);
            setStatus('subscribed');
        } catch (err) {
            console.error('Handshake failure saving token to Supabase:', err);
        } finally {
            setIsProcessing(false);
        }
    };

    // Disable Notifications (Settings Toggles)
    const disableNotifications = async () => {
        setIsProcessing(true);
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                const storedEndpoint = subscription.endpoint;

                // Revoke permission locally on the hardware device level
                await subscription.unsubscribe();

                // Erase row from database table securely bypassing client blocks via RLS
                await deleteNotificationDetails(storedEndpoint);
            }

            setStatus('unsubscribed');
        } catch (err) {
            console.error('🔴 Disconnect error scrubbing token rows:', err);
        } finally {
            setIsProcessing(false);
        }
    };

    // Clean local handling for user "No" action
    const dismissWidget = () => {
        localStorage.setItem('gatequest_push_dismissed', 'true');
        setStatus('dismissed');
    };

    return {
        status,
        isProcessing,
        enableNotifications,
        disableNotifications,
        dismissWidget,
    };
};
