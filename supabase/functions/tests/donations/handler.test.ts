/// <reference lib="deno.ns" />
import {
    assertEquals,
    assertExists,
} from 'https://deno.land/std@0.224.0/assert/mod.ts';
import {
    assertSpyCalls,
    spy,
} from 'https://deno.land/std@0.224.0/testing/mock.ts';
import { handleVerifyDonations } from '../../donations/handler.ts';

// =============================================================================
// Environment (must be set before handler reads them)
// =============================================================================

Deno.env.set('SUPABASE_URL', 'http://localhost:54321');
Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'test-service-key');
Deno.env.set('CRON_ISOLATED_SECRET', 'test-cron-secret');
Deno.env.set('ADMIN_USER_ID', '00000000-0000-0000-0000-000000000001');

// =============================================================================
// Fixtures
// =============================================================================

const ADMIN_ID = '00000000-0000-0000-0000-000000000001';
const USER_ID = '22222222-2222-2222-2222-222222222222';

const canaraEmail = (utr = '123456789012', amount = '500.00') => ({
    from: 'canarabank@canarabank.com',
    body:
        `Dear Customer,\n\nThanking you for banking with Canara Bank.\n\n` +
        `An amount of INR ${amount} has been CREDITED on 18/10/26 to your ` +
        `account XXXX0201 from FIRSTNAME LASTNAME with UPI Ref No.:${utr}. ` +
        `Total Available Balance INR XX.53.`,
});

const nonBankEmail = {
    from: 'noreply@github.com',
    body: 'New PR. UPI Ref No.:999999999999 INR 500',
};

const makeDonation = (over: Record<string, unknown> = {}) => ({
    id: 'd-1',
    user_id: USER_ID,
    anonymous: false,
    message: null,
    suggested_amount: 500,
    actual_amount: 500,
    utr: '123456789012',
    verified: false,
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    verified_at: null,
    verification_method: null,
    review_alerted_at: null,
    ...over,
});

// =============================================================================
// Fetch mock (same shape as dispatch-notification test)
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
    return new Request('http://localhost/verify-donations', {
        method,
        headers,
        body: method === 'POST' ? JSON.stringify(opts.body ?? {}) : undefined,
    });
}

// =============================================================================
// Gmail fetcher stub
// =============================================================================

function makeGmailStub(emails: Array<{ from: string; body: string }>) {
    return spy(() => Promise.resolve(emails));
}

// =============================================================================
// Route factories
// =============================================================================

const selectDonationsByUtr = (
    handler: () => Response | Promise<Response>
): Route => ({
    match: (url, method) =>
        url.includes('/rest/v1/donations') &&
        method === 'GET' &&
        url.includes('utr=in.'),
    response: handler,
});

const selectPendingUnaudited = (
    handler: () => Response | Promise<Response>
): Route => ({
    match: (url, method) =>
        url.includes('/rest/v1/donations') &&
        method === 'GET' &&
        url.includes('verified=eq.false') &&
        !url.includes('utr=in.'),
    response: handler,
});

// PATCH donations?verified=eq.false&id=eq.X — the optimistic-lock update
const patchDonationVerified = (
    handler: () => Response | Promise<Response>
): Route => ({
    match: (url, method) =>
        url.includes('/rest/v1/donations') &&
        method === 'PATCH' &&
        url.includes('verified=eq.false'),
    response: handler,
});

// PATCH donations?id=eq.X — the alerted-at update
const patchDonationAlerted = (
    handler: () => Response | Promise<Response>
): Route => ({
    match: (url, method) =>
        url.includes('/rest/v1/donations') &&
        method === 'PATCH' &&
        !url.includes('verified=eq.false'),
    response: handler,
});

const insertNotification = (
    handler: () => Response | Promise<Response>
): Route => ({
    match: (url, method) =>
        url.includes('/rest/v1/notifications') && method === 'POST',
    response: handler,
});

const okRow = () => jsonResponse([{ id: 'd-1' }], 200);

const okInsert = () => new Response(null, { status: 201 });

// =============================================================================
// Tests — request gates
// =============================================================================

Deno.test('rejects non-POST requests with 405', async () => {
    const mock = installFetchMock([]);
    try {
        const res = await handleVerifyDonations(
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
        const res = await handleVerifyDonations(makeRequest({ secret: null }));
        assertEquals(res.status, 401);
    } finally {
        mock.restore();
    }
});

Deno.test('rejects requests with wrong x-cron-secret with 401', async () => {
    const mock = installFetchMock([]);
    try {
        const res = await handleVerifyDonations(
            makeRequest({ secret: 'wrong-secret' })
        );
        assertEquals(res.status, 401);
    } finally {
        mock.restore();
    }
});

Deno.test('does not call the Gmail fetcher when auth fails', async () => {
    const fetchEmails = makeGmailStub([canaraEmail()]);
    const mock = installFetchMock([]);
    try {
        await handleVerifyDonations(makeRequest({ secret: 'wrong-secret' }), {
            fetchRecentBankEmails: fetchEmails,
        });
        assertSpyCalls(fetchEmails, 0);
    } finally {
        mock.restore();
    }
});

// =============================================================================
// Tests — email processing
// =============================================================================

Deno.test('returns zero counts for an empty inbox', async () => {
    const mock = installFetchMock([
        selectPendingUnaudited(() => jsonResponse([])),
    ]);
    try {
        const fetchEmails = makeGmailStub([]);
        const res = await handleVerifyDonations(
            makeRequest({ secret: 'test-cron-secret' }),
            { fetchRecentBankEmails: fetchEmails }
        );
        assertEquals(res.status, 200);
        const body = await res.json();
        assertEquals(body.processed, 0);
        assertEquals(body.verified, 0);
        assertEquals(body.alerted, 0);
        assertEquals(body.errors, 0);
    } finally {
        mock.restore();
    }
});

Deno.test('does not query donations when no email parses', async () => {
    const mock = installFetchMock([
        selectPendingUnaudited(() => jsonResponse([])),
    ]);
    try {
        const res = await handleVerifyDonations(
            makeRequest({ secret: 'test-cron-secret' }),
            { fetchRecentBankEmails: makeGmailStub([nonBankEmail]) }
        );
        const body = await res.json();
        assertEquals(body.processed, 0);
        const utrCalls = mock.calls.filter(
            (c) =>
                c.url.includes('/rest/v1/donations') &&
                c.url.includes('utr=in.')
        );
        assertEquals(utrCalls.length, 0);
    } finally {
        mock.restore();
    }
});

Deno.test('skips emails missing UTR or amount', async () => {
    const mock = installFetchMock([]);
    try {
        const res = await handleVerifyDonations(
            makeRequest({ secret: 'test-cron-secret' }),
            {
                fetchRecentBankEmails: makeGmailStub([
                    {
                        from: 'canarabank@canarabank.com',
                        body: 'An amount was credited to your account.',
                    },
                ]),
            }
        );
        const body = await res.json();
        assertEquals(body.processed, 0);
    } finally {
        mock.restore();
    }
});

// =============================================================================
// Tests — autoverify
// =============================================================================

Deno.test('verifies donation and notifies the donor', async () => {
    const mock = installFetchMock([
        selectDonationsByUtr(() => jsonResponse([makeDonation()])),
        patchDonationVerified(okRow),
        insertNotification(okInsert),
        selectPendingUnaudited(() => jsonResponse([])),
    ]);
    try {
        const res = await handleVerifyDonations(
            makeRequest({ secret: 'test-cron-secret' }),
            { fetchRecentBankEmails: makeGmailStub([canaraEmail()]) }
        );
        const body = await res.json();
        assertEquals(body.processed, 1);
        assertEquals(body.verified, 1);
        assertEquals(body.errors, 0);

        const notifCall = mock.calls.find(
            (c) => c.url.includes('/notifications') && c.method === 'POST'
        );
        assertExists(notifCall);
        assertExists(notifCall.body);
        assertEquals(notifCall.body.includes(USER_ID), true);
        assertEquals(notifCall.body.includes('500'), true);
        assertEquals(notifCall.body.toLowerCase().includes('thank'), true);
    } finally {
        mock.restore();
    }
});

Deno.test('uses parsed amount, not suggested_amount', async () => {
    const mock = installFetchMock([
        selectDonationsByUtr(() =>
            jsonResponse([makeDonation({ suggested_amount: 500 })])
        ),
        patchDonationVerified(okRow),
        insertNotification(okInsert),
        selectPendingUnaudited(() => jsonResponse([])),
    ]);
    try {
        await handleVerifyDonations(
            makeRequest({ secret: 'test-cron-secret' }),
            {
                fetchRecentBankEmails: makeGmailStub([
                    canaraEmail('123456789012', '450.00'),
                ]),
            }
        );
        const patchCall = mock.calls.find(
            (c) =>
                c.url.includes('/donations') &&
                c.method === 'PATCH' &&
                c.url.includes('verified=eq.false')
        );
        assertExists(patchCall);
        assertExists(patchCall.body);
        assertEquals(patchCall.body.includes('450'), true);
        assertEquals(patchCall.body.includes('"actual_amount":500'), false);

        const notifCall = mock.calls.find(
            (c) => c.url.includes('/notifications') && c.method === 'POST'
        );
        assertExists(notifCall);
        assertExists(notifCall.body);
        assertEquals(notifCall.body.includes('450'), true);
        assertEquals(notifCall.body.includes('500'), false);
    } finally {
        mock.restore();
    }
});

Deno.test('does not notify guest donations (user_id null)', async () => {
    const mock = installFetchMock([
        selectDonationsByUtr(() =>
            jsonResponse([makeDonation({ user_id: null })])
        ),
        patchDonationVerified(okRow),
        selectPendingUnaudited(() => jsonResponse([])),
    ]);
    try {
        const res = await handleVerifyDonations(
            makeRequest({ secret: 'test-cron-secret' }),
            { fetchRecentBankEmails: makeGmailStub([canaraEmail()]) }
        );
        const body = await res.json();
        assertEquals(body.verified, 1);
        const notifCalls = mock.calls.filter((c) =>
            c.url.includes('/notifications')
        );
        assertEquals(notifCalls.length, 0);
    } finally {
        mock.restore();
    }
});

Deno.test('skips notification when optimistic lock fails (empty PATCH response)', async () => {
    const mock = installFetchMock([
        selectDonationsByUtr(() => jsonResponse([makeDonation()])),
        patchDonationVerified(() => jsonResponse([])),
        selectPendingUnaudited(() => jsonResponse([])),
    ]);
    try {
        const res = await handleVerifyDonations(
            makeRequest({ secret: 'test-cron-secret' }),
            { fetchRecentBankEmails: makeGmailStub([canaraEmail()]) }
        );
        const body = await res.json();
        assertEquals(body.verified, 0);
        const notifCalls = mock.calls.filter((c) =>
            c.url.includes('/notifications')
        );
        assertEquals(notifCalls.length, 0);
    } finally {
        mock.restore();
    }
});

Deno.test('processes multiple distinct UTRs in one batch', async () => {
    const mock = installFetchMock([
        selectDonationsByUtr(() =>
            jsonResponse([
                makeDonation({ id: 'd-1', utr: '111111111111' }),
                makeDonation({ id: 'd-2', utr: '222222222222' }),
            ])
        ),
        patchDonationVerified(okRow),
        insertNotification(okInsert),
        selectPendingUnaudited(() => jsonResponse([])),
    ]);
    try {
        const res = await handleVerifyDonations(
            makeRequest({ secret: 'test-cron-secret' }),
            {
                fetchRecentBankEmails: makeGmailStub([
                    canaraEmail('111111111111'),
                    canaraEmail('222222222222'),
                ]),
            }
        );
        const body = await res.json();
        assertEquals(body.processed, 2);
        assertEquals(body.verified, 2);
    } finally {
        mock.restore();
    }
});

Deno.test('dedupes the same UTR appearing twice in one batch', async () => {
    const mock = installFetchMock([
        selectDonationsByUtr(() => jsonResponse([makeDonation()])),
        patchDonationVerified(okRow),
        insertNotification(okInsert),
        selectPendingUnaudited(() => jsonResponse([])),
    ]);
    try {
        const res = await handleVerifyDonations(
            makeRequest({ secret: 'test-cron-secret' }),
            {
                fetchRecentBankEmails: makeGmailStub([
                    canaraEmail(),
                    canaraEmail(),
                ]),
            }
        );
        const body = await res.json();
        assertEquals(body.processed, 1);
        assertEquals(body.verified, 1);
        const patchCalls = mock.calls.filter(
            (c) => c.method === 'PATCH' && c.url.includes('verified=eq.false')
        );
        assertEquals(patchCalls.length, 1);
    } finally {
        mock.restore();
    }
});

// =============================================================================
// Tests — stale pending alerts
// =============================================================================

Deno.test('alerts admin for each stale pending donation', async () => {
    const stale = makeDonation({
        id: 'd-stale',
        utr: '777777777777',
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    });
    const mock = installFetchMock([
        selectPendingUnaudited(() => jsonResponse([stale])),
        patchDonationAlerted(okRow),
        insertNotification(okInsert),
    ]);
    try {
        const res = await handleVerifyDonations(
            makeRequest({ secret: 'test-cron-secret' }),
            { fetchRecentBankEmails: makeGmailStub([]) }
        );
        const body = await res.json();
        assertEquals(body.alerted, 1);

        const notifCall = mock.calls.find(
            (c) => c.url.includes('/notifications') && c.method === 'POST'
        );
        assertExists(notifCall);
        assertExists(notifCall.body);
        assertEquals(notifCall.body.includes(ADMIN_ID), true);
        assertEquals(notifCall.body.includes('777777777777'), true);
    } finally {
        mock.restore();
    }
});

Deno.test('does nothing when no stale donations exist', async () => {
    const mock = installFetchMock([
        selectPendingUnaudited(() => jsonResponse([])),
    ]);
    try {
        const res = await handleVerifyDonations(
            makeRequest({ secret: 'test-cron-secret' }),
            { fetchRecentBankEmails: makeGmailStub([]) }
        );
        const body = await res.json();
        assertEquals(body.alerted, 0);
        const patchCalls = mock.calls.filter((c) => c.method === 'PATCH');
        assertEquals(patchCalls.length, 0);
    } finally {
        mock.restore();
    }
});

Deno.test('excludes pending donations younger than 1 hour', async () => {
    const fresh = makeDonation({
        id: 'd-fresh',
        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    });
    const mock = installFetchMock([
        selectPendingUnaudited(() => jsonResponse([fresh])),
    ]);
    try {
        const res = await handleVerifyDonations(
            makeRequest({ secret: 'test-cron-secret' }),
            { fetchRecentBankEmails: makeGmailStub([]) }
        );
        const body = await res.json();
        assertEquals(body.alerted, 0);
    } finally {
        mock.restore();
    }
});

Deno.test('marks alerted BEFORE inserting the admin notification', async () => {
    const stale = makeDonation({
        id: 'd-stale',
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    });
    const order: string[] = [];
    const mock = installFetchMock([
        selectPendingUnaudited(() => jsonResponse([stale])),
        {
            match: (url, method) =>
                url.includes('/rest/v1/donations') && method === 'PATCH',
            response: () => {
                order.push('mark');
                return jsonResponse([{ id: 'd-stale' }]);
            },
        },
        {
            match: (url, method) =>
                url.includes('/rest/v1/notifications') && method === 'POST',
            response: () => {
                order.push('notify');
                return okInsert();
            },
        },
    ]);
    try {
        await handleVerifyDonations(
            makeRequest({ secret: 'test-cron-secret' }),
            { fetchRecentBankEmails: makeGmailStub([]) }
        );
        assertEquals(order, ['mark', 'notify']);
    } finally {
        mock.restore();
    }
});

// =============================================================================
// Tests — error handling
// =============================================================================

Deno.test('returns 500 when the Gmail fetcher throws', async () => {
    const mock = installFetchMock([]);
    try {
        const fetchEmails = spy(() => Promise.reject(new Error('gmail down')));
        const res = await handleVerifyDonations(
            makeRequest({ secret: 'test-cron-secret' }),
            { fetchRecentBankEmails: fetchEmails }
        );
        assertEquals(res.status, 500);
    } finally {
        mock.restore();
    }
});

Deno.test('counts per-email errors and continues when one PATCH fails', async () => {
    const d1 = makeDonation({ id: 'd-1', utr: '111111111111' });
    const d2 = makeDonation({ id: 'd-2', utr: '222222222222' });
    let patchCall = 0;
    const mock = installFetchMock([
        selectDonationsByUtr(() => jsonResponse([d1, d2])),
        {
            match: (url, method) =>
                url.includes('/rest/v1/donations') &&
                method === 'PATCH' &&
                url.includes('verified=eq.false'),
            response: () => {
                patchCall++;
                if (patchCall === 1) {
                    throw new Error('db down');
                }
                return jsonResponse([{ id: 'd-2' }]);
            },
        },
        insertNotification(okInsert),
        selectPendingUnaudited(() => jsonResponse([])),
    ]);
    try {
        const res = await handleVerifyDonations(
            makeRequest({ secret: 'test-cron-secret' }),
            {
                fetchRecentBankEmails: makeGmailStub([
                    canaraEmail('111111111111'),
                    canaraEmail('222222222222'),
                ]),
            }
        );
        assertEquals(res.status, 200);
        const body = await res.json();
        assertEquals(body.verified, 1);
        assertEquals(body.errors, 1);
    } finally {
        mock.restore();
    }
});

// =============================================================================
// Tests — privacy
// =============================================================================

Deno.test('no notification body contains email-derived content', async () => {
    const stale = makeDonation({
        id: 'd-stale',
        utr: '777777777777',
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    });
    const mock = installFetchMock([
        selectDonationsByUtr(() => jsonResponse([makeDonation()])),
        patchDonationVerified(okRow),
        selectPendingUnaudited(() => jsonResponse([stale])),
        patchDonationAlerted(okRow),
        insertNotification(okInsert),
    ]);
    try {
        await handleVerifyDonations(
            makeRequest({ secret: 'test-cron-secret' }),
            { fetchRecentBankEmails: makeGmailStub([canaraEmail()]) }
        );

        const notifCalls = mock.calls.filter(
            (c) => c.url.includes('/notifications') && c.method === 'POST'
        );
        assertEquals(notifCalls.length > 0, true);
        for (const call of notifCalls) {
            assertExists(call.body);
            const lower = call.body.toLowerCase();
            assertEquals(lower.includes('balance'), false);
            assertEquals(lower.includes('canara'), false);
            assertEquals(lower.includes('xxxx0201'), false);
        }
    } finally {
        mock.restore();
    }
});
