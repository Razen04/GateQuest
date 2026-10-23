/// <reference lib="deno.ns" />

// Types
export type PushSubscription = {
    endpoint: string;
    auth_key: string;
    p256dh_key: string;
    user_id?: string;
};

export type PushPayload = {
    title: string;
    body: string;
    url?: string;
};

export type ErrorClass = 'dead' | 'retry' | 'ignore';

export type FanOutResult = {
    processed: number;
    delivered: number;
    dead: number;
    failed: number;
    deadEndpoints: string[];
};

// Pure helpers

/**
 * Splits an array into fixed-size chunks. The final chunk may be shorter.
 * Throws on non-positive size — a zero-size chunk would loop forever.
 */
export function chunkArray<T>(arr: T[], size: number): T[][] {
    if (size <= 0) {
        throw new Error(`chunkArray: size must be positive, got ${size}`);
    }
    if (arr.length === 0) return [];

    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
    }
    return chunks;
}

/**
 * Classifies an HTTP status from a push service response.
 *
 *   dead   — the subscription is gone. Delete it.
 *   retry  — transient failure. Leave it for the next dispatch.
 *   ignore — anything else. Log it, don't act.
 */
export function classifyEndpointError(status: number | undefined): ErrorClass {
    if (status === 404 || status === 410) return 'dead';
    if (status === 429) return 'retry';
    if (status !== undefined && status >= 500) return 'retry';
    return 'ignore';
}

/**
 * Maps a stored subscription row to the shape web-push expects.
 */
export function toWebPushSubscription(sub: PushSubscription) {
    return {
        endpoint: sub.endpoint,
        keys: {
            auth: sub.auth_key,
            p256dh: sub.p256dh_key,
        },
    };
}

// Fan-out

/**
 * Sends a single payload to many subscriptions, in bounded concurrency.
 *
 * Loads web-push lazily so importing this module does not require network
 * access — only calling fanOutPush does.
 */
export async function fanOutPush(
    subscriptions: PushSubscription[],
    payload: PushPayload,
    options: {
        vapidPublicKey: string;
        vapidPrivateKey: string;
        vapidSubject: string;
        chunkSize?: number;
        maxConcurrentChunks?: number;
    }
): Promise<FanOutResult> {
    const chunkSize = options.chunkSize ?? 50;
    const maxConcurrentChunks = options.maxConcurrentChunks ?? 10;

    if (subscriptions.length === 0) {
        return {
            processed: 0,
            delivered: 0,
            dead: 0,
            failed: 0,
            deadEndpoints: [],
        };
    }

    const webpush = (await import('npm:web-push')).default;

    webpush.setVapidDetails(
        options.vapidSubject,
        options.vapidPublicKey,
        options.vapidPrivateKey
    );

    const payloadStr = JSON.stringify(payload);
    const chunks = chunkArray(subscriptions, chunkSize);

    let delivered = 0;
    let failed = 0;
    const deadEndpoints: string[] = [];

    const processChunk = async (chunk: PushSubscription[]) => {
        const results = await Promise.allSettled(
            chunk.map((sub) =>
                webpush.sendNotification(toWebPushSubscription(sub), payloadStr)
            )
        );

        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            if (result.status === 'fulfilled') {
                delivered++;
                continue;
            }
            const sub = chunk[i];
            const err = result.reason as { statusCode?: number } | undefined;
            const kind = classifyEndpointError(err?.statusCode);
            if (kind === 'dead') {
                deadEndpoints.push(sub.endpoint);
            } else {
                failed++;
            }
        }
    };

    for (let i = 0; i < chunks.length; i += maxConcurrentChunks) {
        const pool = chunks.slice(i, i + maxConcurrentChunks).map(processChunk);
        await Promise.all(pool);
    }

    return {
        processed: subscriptions.length,
        delivered,
        dead: deadEndpoints.length,
        failed,
        deadEndpoints,
    };
}
