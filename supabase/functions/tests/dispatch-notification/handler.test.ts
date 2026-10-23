/// <reference lib="deno.ns" />

import {
    assertEquals,
    assertExists,
} from 'https://deno.land/std@0.224.0/assert/mod.ts';
import {
    assertSpyCalls,
    spy,
} from 'https://deno.land/std@0.224.0/testing/mock.ts';
import type {
    FanOutResult,
    PushSubscription,
} from '../../_shared/pushFanout.ts';
import { handleDispatch } from '../../dispatch-notification/handler.ts';

// =============================================================================
// Environment (must be set before handler reads them)
// =============================================================================

Deno.env.set('SUPABASE_URL', 'http://localhost:54321');
Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'test-service-key');
Deno.env.set('CRON_ISOLATED_SECRET', 'test-cron-secret');
Deno.env.set('VAPID_PUBLIC_KEY', 'test-public-key');
Deno.env.set('VAPID_PRIVATE_KEY', 'test-private-key');
Deno.env.set('VAPID_SUBJECT', 'mailto:test@example.com');

// =============================================================================
// Fixtures
// =============================================================================

const NOTIF_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const USER_A = '11111111-1111-1111-1111-111111111111';
const USER_B = '22222222-2222-2222-2222-222222222222';

const makeNotificationRow = (over: Record<string, unknown> = {}) => ({
    id: NOTIF_ID,
    title: 'Your revision set is ready',
    message: 'You have 15 PYQs to revise.',
    link: '/revision',
    target: { type: 'user', user_id: USER_A },
    audience_ids: [USER_A],
    dispatched_at: null,
    active: true,
    ...over,
});

const makeSubscriptionRow = (endpoint: string, userId = USER_A) => ({
    endpoint,
    auth_key: 'auth-' + endpoint,
    p256dh_key: 'p256dh-' + endpoint,
    user_id: userId,
});

// =============================================================================
// Fetch mock
// =============================================================================

type Route = {
    match: (url: string, method: string) => boolean;
    response: () => Response | Promise<Response>;
};

type RecordedCall = { url: string; method: string; body: string | null };

function installFetchMock(routes: Route[]) {
    const calls: RecordedCall[] = [];
    const original = globalThis.fetch;

    globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
        const url =
            typeof input === 'string'
                ? input
                : input instanceof URL
                  ? input.href
                  : input.url;
        const method =
            init?.method ??
            (typeof input === 'object' && 'method' in input
                ? (input as Request).method
                : 'GET');
        const body = init?.body != null ? String(init.body) : null;
        calls.push({ url, method, body });

        for (const route of routes) {
            if (route.match(url, method)) {
                return Promise.resolve(route.response());
            }
        }
        return Promise.reject(new Error(`Unmocked fetch: ${method} ${url}`));
    }) as typeof fetch;

    return {
        calls,
        restore: () => {
            globalThis.fetch = original;
        },
    };
}

const jsonResponse = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });

const noContent = () => new Response(null, { status: 204 });

// =============================================================================
// Request builder
// =============================================================================

function makeRequest(opts: {
    method?: string;
    secret?: string | null;
    body?: unknown;
}): Request {
    const method = opts.method ?? 'POST';
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    if (opts.secret !== null && opts.secret !== undefined) {
        headers.set('x-cron-secret', opts.secret);
    }
    return new Request('http://localhost/dispatch-notification', {
        method,
        headers,
        body: method === 'POST' ? JSON.stringify(opts.body ?? {}) : undefined,
    });
}

// =============================================================================
// Stub fan-out
// =============================================================================

function makeFanOutStub(result: Partial<FanOutResult> = {}) {
    const calls: Array<{
        subs: PushSubscription[];
        payload: { title: string; body: string; url?: string };
    }> = [];

    const stub = spy(
        (
            subs: PushSubscription[],
            payload: { title: string; body: string; url?: string }
        ): Promise<FanOutResult> => {
            calls.push({ subs, payload });
            return Promise.resolve({
                processed: subs.length,
                delivered: subs.length,
                dead: 0,
                failed: 0,
                deadEndpoints: [],
                ...result,
            });
        }
    );

    return { stub, calls };
}

// =============================================================================
// Common route tables
// =============================================================================

const notificationsSelectRoute = (
    handler: () => Response | Promise<Response>
): Route => ({
    match: (url, method) =>
        url.includes('/rest/v1/notifications') &&
        method === 'GET' &&
        url.includes('id=eq.'),
    response: handler,
});

const subscriptionsSelectRoute = (
    handler: () => Response | Promise<Response>
): Route => ({
    match: (url, method) =>
        url.includes('/rest/v1/push_subscriptions') && method === 'GET',
    response: handler,
});

const subscriptionsDeleteRoute = (
    handler: () => Response | Promise<Response>
): Route => ({
    match: (url, method) =>
        url.includes('/rest/v1/push_subscriptions') && method === 'DELETE',
    response: handler,
});

const notificationsUpdateRoute = (
    handler: () => Response | Promise<Response>
): Route => ({
    match: (url, method) =>
        url.includes('/rest/v1/notifications') && method === 'PATCH',
    response: handler,
});

// =============================================================================
// Tests
// =============================================================================

Deno.test('rejects non-POST requests with 405', async () => {
    const mock = installFetchMock([]);
    try {
        const res = await handleDispatch(
            makeRequest({ method: 'GET', secret: 'test-cron-secret' })
        );
        assertEquals(res.status, 405);
    } finally {
        mock.restore();
    }
});

Deno.test('rejects requests without x-cron-secret with 401', async () => {
    const mock = installFetchMock([]);
    try {
        const res = await handleDispatch(
            makeRequest({ secret: null, body: { notification_id: NOTIF_ID } })
        );
        assertEquals(res.status, 401);
    } finally {
        mock.restore();
    }
});

Deno.test('rejects requests with wrong x-cron-secret with 401', async () => {
    const mock = installFetchMock([]);
    try {
        const res = await handleDispatch(
            makeRequest({
                secret: 'wrong-secret',
                body: { notification_id: NOTIF_ID },
            })
        );
        assertEquals(res.status, 401);
    } finally {
        mock.restore();
    }
});

Deno.test('rejects requests without notification_id with 400', async () => {
    const mock = installFetchMock([]);
    try {
        const res = await handleDispatch(
            makeRequest({ secret: 'test-cron-secret', body: {} })
        );
        assertEquals(res.status, 400);
    } finally {
        mock.restore();
    }
});

Deno.test('returns 404 when the notification does not exist', async () => {
    const mock = installFetchMock([
        notificationsSelectRoute(() =>
            jsonResponse({ code: 'PGRST116', message: '0 rows returned' }, 406)
        ),
    ]);
    try {
        const res = await handleDispatch(
            makeRequest({
                secret: 'test-cron-secret',
                body: { notification_id: NOTIF_ID },
            })
        );
        assertEquals(res.status, 404);
    } finally {
        mock.restore();
    }
});

Deno.test('skips when notification is already dispatched', async () => {
    const { stub, calls: fanOutCalls } = makeFanOutStub();
    const mock = installFetchMock([
        notificationsSelectRoute(() =>
            jsonResponse(
                makeNotificationRow({
                    dispatched_at: '2026-10-15T12:00:00Z',
                })
            )
        ),
    ]);
    try {
        const res = await handleDispatch(
            makeRequest({
                secret: 'test-cron-secret',
                body: { notification_id: NOTIF_ID },
            }),
            { fanOut: stub }
        );
        assertEquals(res.status, 200);
        assertSpyCalls(stub, 0);
        assertEquals(fanOutCalls.length, 0);
    } finally {
        mock.restore();
    }
});

Deno.test('broadcast queries all push_subscriptions', async () => {
    const { stub } = makeFanOutStub();
    const mock = installFetchMock([
        notificationsSelectRoute(() =>
            jsonResponse(
                makeNotificationRow({
                    target: { type: 'broadcast' },
                    audience_ids: null,
                })
            )
        ),
        subscriptionsSelectRoute(() =>
            jsonResponse([
                makeSubscriptionRow('https://push.example/1', USER_A),
                makeSubscriptionRow('https://push.example/2', USER_B),
            ])
        ),
        notificationsUpdateRoute(noContent),
    ]);
    try {
        await handleDispatch(
            makeRequest({
                secret: 'test-cron-secret',
                body: { notification_id: NOTIF_ID },
            }),
            { fanOut: stub }
        );

        const subsCall = mock.calls.find(
            (c) => c.url.includes('/push_subscriptions') && c.method === 'GET'
        );
        assertExists(subsCall);
        // No user_id filter applied for broadcast.
        const decodedUrl = decodeURIComponent(subsCall.url);
        assertEquals(decodedUrl.includes('user_id=in.'), false);
    } finally {
        mock.restore();
    }
});

Deno.test('targeted query filters by audience_ids', async () => {
    const { stub } = makeFanOutStub();
    const mock = installFetchMock([
        notificationsSelectRoute(() => jsonResponse(makeNotificationRow())),
        subscriptionsSelectRoute(() =>
            jsonResponse([makeSubscriptionRow('https://push.example/1')])
        ),
        notificationsUpdateRoute(noContent),
    ]);
    try {
        await handleDispatch(
            makeRequest({
                secret: 'test-cron-secret',
                body: { notification_id: NOTIF_ID },
            }),
            { fanOut: stub }
        );

        const subsCall = mock.calls.find(
            (c) => c.url.includes('/push_subscriptions') && c.method === 'GET'
        );
        assertExists(subsCall);
        const decodedUrl = decodeURIComponent(subsCall.url);
        assertEquals(decodedUrl.includes(`user_id=in.(${USER_A})`), true);
    } finally {
        mock.restore();
    }
});

Deno.test('passes constructed payload to fanOut', async () => {
    const { stub, calls: fanOutCalls } = makeFanOutStub();
    const mock = installFetchMock([
        notificationsSelectRoute(() => jsonResponse(makeNotificationRow())),
        subscriptionsSelectRoute(() =>
            jsonResponse([makeSubscriptionRow('https://push.example/1')])
        ),
        notificationsUpdateRoute(noContent),
    ]);
    try {
        await handleDispatch(
            makeRequest({
                secret: 'test-cron-secret',
                body: { notification_id: NOTIF_ID },
            }),
            { fanOut: stub }
        );

        assertEquals(fanOutCalls.length, 1);
        assertEquals(
            fanOutCalls[0].payload.title,
            'Your revision set is ready'
        );
        assertEquals(
            fanOutCalls[0].payload.body,
            'You have 15 PYQs to revise.'
        );
        assertEquals(fanOutCalls[0].payload.url, '/revision');
        assertEquals(fanOutCalls[0].subs.length, 1);
    } finally {
        mock.restore();
    }
});

Deno.test('uses fallback title and url when fields are null', async () => {
    const { stub, calls: fanOutCalls } = makeFanOutStub();
    const mock = installFetchMock([
        notificationsSelectRoute(() =>
            jsonResponse(
                makeNotificationRow({ title: null, message: null, link: null })
            )
        ),
        subscriptionsSelectRoute(() =>
            jsonResponse([makeSubscriptionRow('https://push.example/1')])
        ),
        notificationsUpdateRoute(noContent),
    ]);
    try {
        await handleDispatch(
            makeRequest({
                secret: 'test-cron-secret',
                body: { notification_id: NOTIF_ID },
            }),
            { fanOut: stub }
        );

        assertEquals(fanOutCalls[0].payload.title, 'GATEQuest');
        assertEquals(fanOutCalls[0].payload.url, '/dashboard');
    } finally {
        mock.restore();
    }
});

Deno.test('deletes dead endpoints returned by fanOut', async () => {
    const deadEndpoint = 'https://push.example/dead';
    const { stub } = makeFanOutStub({ deadEndpoints: [deadEndpoint] });
    const mock = installFetchMock([
        notificationsSelectRoute(() => jsonResponse(makeNotificationRow())),
        subscriptionsSelectRoute(() =>
            jsonResponse([makeSubscriptionRow(deadEndpoint)])
        ),
        subscriptionsDeleteRoute(noContent),
        notificationsUpdateRoute(noContent),
    ]);
    try {
        await handleDispatch(
            makeRequest({
                secret: 'test-cron-secret',
                body: { notification_id: NOTIF_ID },
            }),
            { fanOut: stub }
        );

        const deleteCall = mock.calls.find(
            (c) =>
                c.url.includes('/push_subscriptions') && c.method === 'DELETE'
        );
        assertExists(deleteCall);
        assertEquals(deleteCall.url.includes('endpoint=in.'), true);
        assertEquals(
            deleteCall.url.includes('push.example%2Fdead') ||
                deleteCall.url.includes('push.example/dead'),
            true
        );
    } finally {
        mock.restore();
    }
});

Deno.test('marks notification as dispatched after fanout', async () => {
    const { stub } = makeFanOutStub();
    const mock = installFetchMock([
        notificationsSelectRoute(() => jsonResponse(makeNotificationRow())),
        subscriptionsSelectRoute(() =>
            jsonResponse([makeSubscriptionRow('https://push.example/1')])
        ),
        notificationsUpdateRoute(noContent),
    ]);
    try {
        await handleDispatch(
            makeRequest({
                secret: 'test-cron-secret',
                body: { notification_id: NOTIF_ID },
            }),
            { fanOut: stub }
        );

        const updateCall = mock.calls.find(
            (c) => c.url.includes('/notifications') && c.method === 'PATCH'
        );
        assertExists(updateCall);
        assertExists(updateCall.body);
        assertEquals(updateCall.body.includes('dispatched_at'), true);
    } finally {
        mock.restore();
    }
});

Deno.test('marks dispatched and skips fanout when no subscriptions exist', async () => {
    const { stub, calls: fanOutCalls } = makeFanOutStub();
    const mock = installFetchMock([
        notificationsSelectRoute(() => jsonResponse(makeNotificationRow())),
        subscriptionsSelectRoute(() => jsonResponse([])),
        notificationsUpdateRoute(noContent),
    ]);
    try {
        const res = await handleDispatch(
            makeRequest({
                secret: 'test-cron-secret',
                body: { notification_id: NOTIF_ID },
            }),
            { fanOut: stub }
        );

        assertEquals(res.status, 200);
        assertEquals(fanOutCalls.length, 0);

        const updateCall = mock.calls.find(
            (c) => c.url.includes('/notifications') && c.method === 'PATCH'
        );
        assertExists(updateCall);
    } finally {
        mock.restore();
    }
});

Deno.test('returns delivery counts in the response body', async () => {
    const { stub } = makeFanOutStub({
        delivered: 1,
        failed: 0,
        dead: 1,
        deadEndpoints: ['https://push.example/dead'],
    });
    const mock = installFetchMock([
        notificationsSelectRoute(() => jsonResponse(makeNotificationRow())),
        subscriptionsSelectRoute(() =>
            jsonResponse([
                makeSubscriptionRow('https://push.example/1'),
                makeSubscriptionRow('https://push.example/dead'),
            ])
        ),
        subscriptionsDeleteRoute(noContent),
        notificationsUpdateRoute(noContent),
    ]);
    try {
        const res = await handleDispatch(
            makeRequest({
                secret: 'test-cron-secret',
                body: { notification_id: NOTIF_ID },
            }),
            { fanOut: stub }
        );

        assertEquals(res.status, 200);
        const body = await res.json();
        assertEquals(body.delivered, 1);
        assertEquals(body.dead, 1);
    } finally {
        mock.restore();
    }
});

Deno.test('empty audience skips dispatch and marks as dispatched', async () => {
    const { stub, calls: fanOutCalls } = makeFanOutStub();
    const mock = installFetchMock([
        notificationsSelectRoute(() =>
            jsonResponse(
                makeNotificationRow({
                    target: { type: 'segment', segment: 'active_weekend' },
                    audience_ids: [],
                })
            )
        ),
        notificationsUpdateRoute(noContent),
    ]);
    try {
        const res = await handleDispatch(
            makeRequest({
                secret: 'test-cron-secret',
                body: { notification_id: NOTIF_ID },
            }),
            { fanOut: stub }
        );

        assertEquals(res.status, 200);
        assertEquals(fanOutCalls.length, 0);

        const subsCalls = mock.calls.filter((c) =>
            c.url.includes('/push_subscriptions')
        );
        assertEquals(subsCalls.length, 0);

        const updateCall = mock.calls.find(
            (c) => c.method === 'PATCH' && c.url.includes('/notifications')
        );
        assertExists(updateCall);
    } finally {
        mock.restore();
    }
});
