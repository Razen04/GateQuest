/// <reference lib="deno.ns" />

import { assertEquals } from 'jsr:@std/assert';
import { afterEach, beforeEach, describe, it } from 'jsr:@std/testing/bdd';
import { stub } from 'jsr:@std/testing/mock';
import type { SupabaseClient } from 'npm:@supabase/supabase-js';
import { handleDonationWebhook } from '../../donations/handler.ts';
import {
    DEBIT_EMAIL,
    MISSING_UTR,
    PROMOTIONAL,
    REAL_SAMPLE_FULL_UTR,
} from '../_shared/fixtures.ts';

// ─── Test constants ──────────────────────────────────────────

const VALID_SECRET = 'test-webhook-secret';
const ADMIN_ID = 'admin-uuid-1234';

// Fixture reference values (keep in sync with fixtures.ts):
//   REAL_SAMPLE_FULL_UTR → ₹169, UTR 421234567890, CREDITED
//   MISSING_UTR          → ₹140, CREDITED, no UTR (triggers admin alert)
//   DEBIT_EMAIL          → ₹50, DEBITED
//   PROMOTIONAL          → no transaction line

// ─── Mock Supabase client ────────────────────────────────────

interface MockConfig {
    donationLookup?: { data: unknown; error: unknown };
    donationUpdate?: { data: unknown; error: unknown };
    dedupCount?: number;
}

interface CapturedInsert {
    table: string;
    data: Record<string, unknown>;
}

function createMockSupabase(config: MockConfig): {
    client: SupabaseClient;
    capturedInserts: CapturedInsert[];
} {
    const capturedInserts: CapturedInsert[] = [];

    function from(table: string) {
        const state: {
            op: 'select' | 'insert' | 'update';
            isCountQuery: boolean;
            insertData?: unknown;
        } = { op: 'select', isCountQuery: false };

        const builder: Record<string, unknown> = {
            select(...args: unknown[]) {
                if (args.length > 1) state.isCountQuery = true;
                return builder;
            },
            insert(data: unknown) {
                state.op = 'insert';
                state.insertData = data;
                return builder;
            },
            update(data: unknown) {
                state.op = 'update';
                return builder;
            },
            eq() {
                return builder;
            },
            ilike() {
                return builder;
            },
            gte() {
                return builder;
            },
            async maybeSingle() {
                if (table === 'donations') {
                    if (state.op === 'update') {
                        return (
                            config.donationUpdate ?? {
                                data: null,
                                error: null,
                            }
                        );
                    }
                    return config.donationLookup ?? { data: null, error: null };
                }
                return { data: null, error: null };
            },
            then(resolve: (v: unknown) => void, reject: (e: unknown) => void) {
                try {
                    if (state.op === 'insert') {
                        capturedInserts.push({
                            table,
                            data: state.insertData as Record<string, unknown>,
                        });
                        return resolve({ error: null });
                    }
                    if (state.isCountQuery && table === 'notifications') {
                        return resolve({
                            count: config.dedupCount ?? 0,
                            error: null,
                        });
                    }
                    return resolve({ data: null, error: null });
                } catch (e) {
                    return reject(e);
                }
            },
        };

        return builder;
    }

    return {
        client: { from } as unknown as SupabaseClient,
        capturedInserts,
    };
}

// ─── Env setup ───────────────────────────────────────────────

const BASE_ENV: Record<string, string | undefined> = {
    DONATION_WEBHOOK_SECRET: VALID_SECRET,
    SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-role',
    ADMIN_USER_ID: ADMIN_ID,
};

// Mutable copy — tests can delete/override values without
// touching the stub itself.
const mutableEnv: Record<string, string | undefined> = { ...BASE_ENV };

let envStub: { restore(): void };

beforeEach(() => {
    // Reset to baseline before each test
    Object.keys(mutableEnv).forEach((k) => delete mutableEnv[k]);
    Object.assign(mutableEnv, BASE_ENV);

    envStub = stub(Deno.env, 'get', (key: string) => mutableEnv[key]);
});

afterEach(() => {
    envStub.restore();
});

// ─── Helpers ─────────────────────────────────────────────────

function makeRequest(
    body: unknown,
    headers: Record<string, string> = {}
): Request {
    return new Request('http://localhost/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(body),
    });
}

function authHeaders(): Record<string, string> {
    return { 'x-cron-secret': VALID_SECRET };
}

// ─── Tests ───────────────────────────────────────────────────

describe('handleDonationWebhook', () => {
    describe('method gate', () => {
        it('rejects non-POST methods with 405', async () => {
            const req = new Request('http://localhost/test', {
                method: 'GET',
            });
            const res = await handleDonationWebhook(req);
            assertEquals(res.status, 405);
        });
    });

    describe('auth gate', () => {
        it('rejects missing x-cron-secret with 401', async () => {
            const res = await handleDonationWebhook(
                makeRequest({ body: 'test' })
            );
            assertEquals(res.status, 401);
        });

        it('rejects wrong x-cron-secret with 401', async () => {
            const res = await handleDonationWebhook(
                makeRequest({ body: 'test' }, { 'x-cron-secret': 'wrong' })
            );
            assertEquals(res.status, 401);
        });

        it('returns 500 when DONATION_WEBHOOK_SECRET env is missing', async () => {
            delete mutableEnv['DONATION_WEBHOOK_SECRET'];

            const res = await handleDonationWebhook(
                makeRequest({ body: 'test' }, authHeaders())
            );
            assertEquals(res.status, 500);
        });
    });

    describe('body validation', () => {
        it('returns 400 for invalid JSON', async () => {
            const req = new Request('http://localhost/test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders(),
                },
                body: 'not json',
            });
            const res = await handleDonationWebhook(req);
            assertEquals(res.status, 400);
        });

        it('returns 400 for non-string body', async () => {
            const res = await handleDonationWebhook(
                makeRequest({ body: 123 }, authHeaders())
            );
            assertEquals(res.status, 400);
        });

        it('returns 400 for empty body string', async () => {
            const res = await handleDonationWebhook(
                makeRequest({ body: '' }, authHeaders())
            );
            assertEquals(res.status, 400);
        });
    });

    describe('email classification', () => {
        it('skips debit emails silently', async () => {
            const { client, capturedInserts } = createMockSupabase({});
            const res = await handleDonationWebhook(
                makeRequest({ body: DEBIT_EMAIL }, authHeaders()),
                { supabaseFactory: () => client }
            );
            const json = await res.json();
            assertEquals(json.status, 'skipped');
            assertEquals(json.reason, 'debit email');
            assertEquals(capturedInserts.length, 0);
        });

        it('skips promotional emails without alerting', async () => {
            const { client, capturedInserts } = createMockSupabase({});
            const res = await handleDonationWebhook(
                makeRequest({ body: PROMOTIONAL }, authHeaders()),
                { supabaseFactory: () => client }
            );
            const json = await res.json();
            assertEquals(json.status, 'skipped');
            assertEquals(capturedInserts.length, 0);
        });

        it('alerts admin for transaction-looking unparseable emails', async () => {
            // MISSING_UTR has the transaction line but no UTR — parser
            // returns { status: 'unparseable', looksLikeTransaction: true }
            const { client, capturedInserts } = createMockSupabase({});
            const res = await handleDonationWebhook(
                makeRequest({ body: MISSING_UTR }, authHeaders()),
                { supabaseFactory: () => client }
            );
            const json = await res.json();
            assertEquals(json.status, 'skipped');
            assertEquals(capturedInserts.length, 1);
            assertEquals(capturedInserts[0].table, 'notifications');
            assertEquals(
                capturedInserts[0].data.title,
                '⚠️ Unparseable transaction email'
            );
            assertEquals(capturedInserts[0].data.type, 'alert');
        });
    });

    describe('unmatched payment', () => {
        it('returns unmatched and alerts admin when no donation found', async () => {
            const { client, capturedInserts } = createMockSupabase({
                donationLookup: { data: null, error: null },
                dedupCount: 0,
            });
            const res = await handleDonationWebhook(
                makeRequest({ body: REAL_SAMPLE_FULL_UTR }, authHeaders()),
                { supabaseFactory: () => client }
            );
            const json = await res.json();
            assertEquals(json.status, 'unmatched');
            assertEquals(json.utr, '421234567890');
            assertEquals(json.email_amount, 169);
            assertEquals(capturedInserts.length, 1);
            assertEquals(
                capturedInserts[0].data.title,
                '💸 Unmatched payment received'
            );
        });

        it('suppresses alert when dedup count > 0', async () => {
            const { client, capturedInserts } = createMockSupabase({
                donationLookup: { data: null, error: null },
                dedupCount: 1,
            });
            const res = await handleDonationWebhook(
                makeRequest({ body: REAL_SAMPLE_FULL_UTR }, authHeaders()),
                { supabaseFactory: () => client }
            );
            const json = await res.json();
            assertEquals(json.status, 'unmatched');
            assertEquals(capturedInserts.length, 0);
        });
    });

    describe('already verified', () => {
        it('returns already_verified when donation is already verified', async () => {
            const { client, capturedInserts } = createMockSupabase({
                donationLookup: {
                    data: {
                        id: 'd-1',
                        utr: '421234567890',
                        verified: true,
                        user_id: 'u-1',
                        suggested_amount: 169,
                    },
                    error: null,
                },
            });
            const res = await handleDonationWebhook(
                makeRequest({ body: REAL_SAMPLE_FULL_UTR }, authHeaders()),
                { supabaseFactory: () => client }
            );
            const json = await res.json();
            assertEquals(json.status, 'already_verified');
            assertEquals(json.donation_id, 'd-1');
            assertEquals(capturedInserts.length, 0);
        });
    });

    describe('verification', () => {
        it('verifies when amounts match and notifies user', async () => {
            const { client, capturedInserts } = createMockSupabase({
                donationLookup: {
                    data: {
                        id: 'd-1',
                        utr: '421234567890',
                        verified: false,
                        user_id: 'u-1',
                        suggested_amount: 169, // matches email ₹169
                    },
                    error: null,
                },
                donationUpdate: { data: { id: 'd-1' }, error: null },
            });
            const res = await handleDonationWebhook(
                makeRequest({ body: REAL_SAMPLE_FULL_UTR }, authHeaders()),
                { supabaseFactory: () => client }
            );
            const json = await res.json();
            assertEquals(json.status, 'verified');
            assertEquals(json.amount_matched, true);
            assertEquals(json.email_amount, 169);
            assertEquals(json.suggested_amount, 169);
            assertEquals(capturedInserts.length, 1);
            assertEquals(capturedInserts[0].data.title, '🎉 Donation Verified');
            assertEquals(capturedInserts[0].data.target, {
                type: 'user',
                user_id: 'u-1',
            });
        });

        it('verifies with amount_matched=false when amounts differ', async () => {
            const { client, capturedInserts } = createMockSupabase({
                donationLookup: {
                    data: {
                        id: 'd-1',
                        utr: '421234567890',
                        verified: false,
                        user_id: 'u-1',
                        suggested_amount: 100, // user entered 100, paid 169
                    },
                    error: null,
                },
                donationUpdate: { data: { id: 'd-1' }, error: null },
            });
            const res = await handleDonationWebhook(
                makeRequest({ body: REAL_SAMPLE_FULL_UTR }, authHeaders()),
                { supabaseFactory: () => client }
            );
            const json = await res.json();
            assertEquals(json.status, 'verified');
            assertEquals(json.amount_matched, false);
            assertEquals(json.email_amount, 169);
            assertEquals(json.suggested_amount, 100);
            assertEquals(capturedInserts.length, 1);
            assertEquals(capturedInserts[0].data.title, 'Donation Verified');
        });

        it('returns already_verified on race condition (update affected 0 rows)', async () => {
            const { client, capturedInserts } = createMockSupabase({
                donationLookup: {
                    data: {
                        id: 'd-1',
                        utr: '421234567890',
                        verified: false,
                        user_id: 'u-1',
                        suggested_amount: 169,
                    },
                    error: null,
                },
                // Someone else verified between SELECT and UPDATE
                donationUpdate: { data: null, error: null },
            });
            const res = await handleDonationWebhook(
                makeRequest({ body: REAL_SAMPLE_FULL_UTR }, authHeaders()),
                { supabaseFactory: () => client }
            );
            const json = await res.json();
            assertEquals(json.status, 'already_verified');
            assertEquals(capturedInserts.length, 0);
        });

        it('skips user notification for guest donations (user_id=null)', async () => {
            const { client, capturedInserts } = createMockSupabase({
                donationLookup: {
                    data: {
                        id: 'd-1',
                        utr: '421234567890',
                        verified: false,
                        user_id: null, // guest
                        suggested_amount: 169,
                    },
                    error: null,
                },
                donationUpdate: { data: { id: 'd-1' }, error: null },
            });
            const res = await handleDonationWebhook(
                makeRequest({ body: REAL_SAMPLE_FULL_UTR }, authHeaders()),
                { supabaseFactory: () => client }
            );
            const json = await res.json();
            assertEquals(json.status, 'verified');
            assertEquals(capturedInserts.length, 0); // no user notification
        });
    });
});
