/// <reference lib="deno.ns" />

import { buildAdminAlert } from '../../../src/features/donations/services/buildAdminAlert.ts';
import { buildUserThankYou } from '../../../src/features/donations/services/buildUserThankYou.ts';
import { findStalePending } from '../../../src/features/donations/services/findStalePending.ts';
import { matchTransaction } from '../../../src/features/donations/services/matchTransaction.ts';
import {
    type BankEmailInput,
    type ParsedTransaction,
    parseBankEmail,
} from '../../../src/features/donations/services/parseBankEmail.ts';
import type { Donation } from '../../../src/features/donations/types/donationType.ts';
import { fetchRecentBankEmails as defaultFetchEmails } from './gmail.ts';

export interface VerifyDeps {
    /** Injected for tests. Defaults to the Gmail API fetcher. */
    fetchRecentBankEmails?: () => Promise<BankEmailInput[]>;
}

interface VerifySummary {
    processed: number;
    verified: number;
    alerted: number;
    errors: number;
}

function json(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}

function getEnv(name: string): string {
    const value = Deno.env.get(name);
    if (!value) throw new Error(`Missing env: ${name}`);
    return value;
}

async function supabase(
    method: 'GET' | 'POST' | 'PATCH',
    path: string,
    body?: unknown
): Promise<unknown> {
    const url = getEnv('SUPABASE_URL');
    const key = getEnv('SUPABASE_SERVICE_ROLE_KEY');

    const init: RequestInit = {
        method,
        headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json',
            Prefer:
                method === 'PATCH' ? 'return=representation' : 'return=minimal',
        },
    };
    if (body !== undefined) init.body = JSON.stringify(body);

    const res = await fetch(`${url}${path}`, init);
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`${method} ${path} failed: ${res.status} ${text}`);
    }
    if (method === 'GET' || method === 'PATCH') return await res.json();
    return null;
}

export async function handleVerifyDonations(
    req: Request,
    deps: VerifyDeps = {}
): Promise<Response> {
    // ── Gate 1: method ─────────────────────────────────────────────
    if (req.method !== 'POST') {
        return json({ error: 'Method not allowed' }, 405);
    }

    // ── Gate 2: cron secret ────────────────────────────────────────
    const expected = Deno.env.get('CRON_ISOLATED_SECRET');
    const provided = req.headers.get('x-cron-secret');
    if (!provided || provided !== expected) {
        return json({ error: 'Unauthorized' }, 401);
    }

    const summary: VerifySummary = {
        processed: 0,
        verified: 0,
        alerted: 0,
        errors: 0,
    };

    // ── Fetch bank emails ──────────────────────────────────────────
    const fetchEmails = deps.fetchRecentBankEmails ?? defaultFetchEmails;
    let emails: BankEmailInput[];
    try {
        emails = await fetchEmails();
    } catch (err) {
        console.error('Failed to fetch bank emails:', err);
        return json({ error: 'Email fetch failed' }, 500);
    }

    // ── Parse + dedupe by UTR ──────────────────────────────────────
    // First-seen wins: if two emails carry the same UTR, we trust the
    // first parse rather than the last.
    const uniqueByUtr = new Map<string, ParsedTransaction>();
    for (const email of emails) {
        const parsed = parseBankEmail(email);
        if (!parsed) continue;
        if (!uniqueByUtr.has(parsed.utr)) {
            uniqueByUtr.set(parsed.utr, parsed);
        }
    }
    const uniqueParsed = [...uniqueByUtr.values()];
    summary.processed = uniqueParsed.length;

    // ── Autoverify ─────────────────────────────────────────────────
    if (uniqueParsed.length > 0) {
        const utrFilter = uniqueParsed.map((p) => p.utr).join(',');

        let candidates: Donation[] = [];
        try {
            candidates = (await supabase(
                'GET',
                `/rest/v1/donations?utr=in.(${utrFilter})&select=*`
            )) as Donation[];
        } catch (err) {
            console.error('Failed to query donations by UTR:', err);
            summary.errors++;
            // Fall through to stale detection — it's independent of
            // email matching and may still be useful.
        }

        const now = new Date().toISOString();

        for (const txn of uniqueParsed) {
            const result = matchTransaction(txn, candidates);
            if (result.kind !== 'autoverify') continue;

            try {
                const updated = await supabase(
                    'PATCH',
                    `/rest/v1/donations?id=eq.${result.donationId}&verified=eq.false`,
                    {
                        verified: true,
                        actual_amount: result.actualAmount,
                        verification_method: 'email_auto',
                        verified_at: now,
                    }
                );

                // Optimistic lock: empty response means the row was
                // already verified by a concurrent run.
                if (Array.isArray(updated) && updated.length === 0) continue;

                summary.verified++;

                // Notify donor if we know who they are. Use the parsed
                // amount — the bank is the source of truth for what was
                // actually paid, not the suggested amount.
                const donor = candidates.find(
                    (d) => d.id === result.donationId
                );
                if (donor && donor.user_id) {
                    const updatedDonation: Donation = {
                        ...donor,
                        actual_amount: result.actualAmount,
                        verified: true,
                        verification_method: 'email_auto',
                        verified_at: now,
                    };
                    const payload = buildUserThankYou(updatedDonation);
                    if (payload) {
                        await supabase(
                            'POST',
                            '/rest/v1/notifications',
                            payload
                        );
                    }
                }
            } catch (err) {
                console.error(
                    `Failed to verify donation ${result.donationId}:`,
                    err
                );
                summary.errors++;
            }
        }
    }

    // ── Stale pending alerts ───────────────────────────────────────
    // Runs regardless of email parsing — this is a separate safety net.
    try {
        const adminId = getEnv('ADMIN_USER_ID');
        const pending = (await supabase(
            'GET',
            '/rest/v1/donations?verified=eq.false&review_alerted_at=is.null&select=*'
        )) as Donation[];

        const stale = findStalePending(new Date(), pending);

        for (const donation of stale) {
            try {
                const now = new Date().toISOString();

                // Mark FIRST, notify SECOND. If notification fails, the
                // donation is still marked and won't be re-alerted on the
                // next cron tick — trade-off: rare silent loss vs.
                // frequent duplicate alerts. Matches the test contract.
                const updated = await supabase(
                    'PATCH',
                    `/rest/v1/donations?id=eq.${donation.id}&review_alerted_at=is.null`,
                    { review_alerted_at: now }
                );

                if (Array.isArray(updated) && updated.length === 0) continue;

                summary.alerted++;

                await supabase(
                    'POST',
                    '/rest/v1/notifications',
                    buildAdminAlert(donation, adminId)
                );
            } catch (err) {
                console.error(
                    `Failed to alert for donation ${donation.id}:`,
                    err
                );
                summary.errors++;
            }
        }
    } catch (err) {
        console.error('Stale donation query failed:', err);
        summary.errors++;
    }

    return json(summary, 200);
}
