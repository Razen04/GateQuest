/// <reference lib="deno.ns" />

import { createClient } from 'npm:@supabase/supabase-js';
import { createNotification } from '../_shared/notifications.ts';
import { parseEmail } from '../_shared/parseEmail.ts';

const MAX_BODY_BYTES = 100_000;

function json(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}

/**
 * Extracts the Supabase project ref from SUPABASE_URL and returns a
 * deep link to the donations table in the dashboard. Falls back to
 * the project dashboard root if the URL can't be parsed.
 */
function getAdminDonationsUrl(): string {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const match = supabaseUrl.match(/^https:\/\/([^.]+)\.supabase\.co/);
    const ref = match?.[1];

    if (!ref) return '/donate'; // graceful fallback
    return `https://supabase.com/dashboard/project/${ref}/editor`;
}

async function sendAdminAlert(
    supabase: ReturnType<typeof createClient>,
    payload: { title: string; message: string }
): Promise<void> {
    const adminUserId = Deno.env.get('ADMIN_USER_ID');
    if (!adminUserId) {
        console.error(
            '[donation-webhook] ADMIN_USER_ID not set — skipping admin alert'
        );
        return;
    }

    await createNotification(supabase, {
        title: payload.title,
        message: payload.message,
        link: getAdminDonationsUrl(),
        type: 'alert',
        target: { type: 'user', user_id: adminUserId },
    });
}

export async function handleDonationWebhook(req: Request): Promise<Response> {
    // ─── Method gate ──────────────────────────────────────────────
    if (req.method !== 'POST') {
        return json({ error: 'Method not allowed' }, 405);
    }

    // ─── Auth gate — matches CRON_ISOLATED_SECRET pattern ────────
    const providedSecret = req.headers.get('x-cron-secret');
    const expectedSecret = Deno.env.get('DONATION_WEBHOOK_SECRET');

    if (!expectedSecret) {
        console.error(
            '[donation-webhook] DONATION_WEBHOOK_SECRET not configured'
        );
        return json({ error: 'Server misconfigured' }, 500);
    }

    if (!providedSecret || providedSecret !== expectedSecret) {
        return json({ error: 'Unauthorized' }, 401);
    }

    // ─── Body size guard ─────────────────────────────────────────
    const contentLength = Number(req.headers.get('content-length') ?? '0');
    if (contentLength > MAX_BODY_BYTES) {
        return json({ error: 'Body too large' }, 413);
    }

    // ─── JSON parse ──────────────────────────────────────────────
    let payload: { body?: unknown };
    try {
        payload = await req.json();
    } catch {
        return json({ error: 'Invalid JSON body' }, 400);
    }

    if (typeof payload.body !== 'string' || payload.body.length === 0) {
        return json({ error: 'body must be a non-empty string' }, 400);
    }

    if (payload.body.length > MAX_BODY_BYTES) {
        return json({ error: 'Email body too large' }, 413);
    }

    // ─── Supabase admin client ───────────────────────────────────
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) {
        return json({ error: 'Server misconfigured' }, 500);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
    });

    // ─── Parse the email ─────────────────────────────────────────
    const parsed = parseEmail(payload.body);

    if (parsed.status === 'debit') {
        return json({ status: 'skipped', reason: 'debit email' });
    }

    if (parsed.status === 'unparseable') {
        if (parsed.looksLikeTransaction) {
            await sendAdminAlert(supabase, {
                title: '⚠️ Unparseable transaction email',
                message:
                    `A Canara Bank transaction email could not be parsed. ` +
                    `Reason: ${parsed.reason}. Manual review may be required.`,
            });
        }
        return json({ status: 'skipped', reason: parsed.reason });
    }

    // ─── We have { utr, amount } ─────────────────────────────────
    const { utr, amount: emailAmount } = parsed;

    // ─── Lookup donation by UTR ──────────────────────────────────
    const { data: donation, error: lookupError } = await supabase
        .from('donations')
        .select('id, user_id, suggested_amount, verified, utr')
        .eq('utr', utr)
        .maybeSingle();

    if (lookupError) {
        console.error('[donation-webhook] lookup error:', lookupError);
        return json({ error: 'Database lookup failed' }, 500);
    }

    // ─── No matching donation ────────────────────────────────────
    if (!donation) {
        // Dedup: only alert once per UTR per 6 hours.
        // Without this, an unmatched email (user paid but never
        // submitted the form) triggers a fresh admin alert every
        // 5-minute cron cycle for the full 2-hour window → 24 alerts.
        const { count: recentAlertCount } = await supabase
            .from('notifications')
            .select('id', { count: 'exact', head: true })
            .eq('type', 'alert')
            .eq('title', '💸 Unmatched payment received')
            .ilike('message', `%UTR ${utr}%`)
            .gte(
                'created_at',
                new Date(Date.now() - 6 * 3600_000).toISOString()
            );

        if ((recentAlertCount ?? 0) === 0) {
            await sendAdminAlert(supabase, {
                title: '💸 Unmatched payment received',
                message:
                    `Received ₹${emailAmount.toFixed(2)} (UTR ${utr}) ` +
                    `but no donation exists with this UTR. The donor may ` +
                    `not have submitted the form yet, or may have entered ` +
                    `a different UTR.`,
            });
        } else {
            console.log(
                `[donation-webhook] unmatched alert suppressed (already sent for UTR ${utr})`
            );
        }

        return json({
            status: 'unmatched',
            utr,
            email_amount: emailAmount,
        });
    }
    // ─── Already verified — idempotent ───────────────────────────
    if (donation.verified) {
        return json({
            status: 'already_verified',
            donation_id: donation.id,
            utr,
        });
    }

    // ─── Amount comparison ───────────────────────────────────────
    const suggestedAmount = Number(donation.suggested_amount);
    const amountMatched = Math.abs(suggestedAmount - emailAmount) < 0.01;

    // ─── Atomic verify (guards against concurrent calls) ─────────
    const { data: updated, error: updateError } = await supabase
        .from('donations')
        .update({
            verified: true,
            verified_by: 'auto',
            verified_at: new Date().toISOString(),
            actual_amount: emailAmount,
        })
        .eq('id', donation.id)
        .eq('verified', false)
        .select('id')
        .maybeSingle();

    if (updateError) {
        console.error('[donation-webhook] update error:', updateError);
        return json({ error: 'Database update failed' }, 500);
    }

    if (!updated) {
        // Race condition — someone else verified between SELECT and UPDATE
        return json({
            status: 'already_verified',
            donation_id: donation.id,
            utr,
        });
    }

    // ─── Notify user (skips guests with NULL user_id) ────────────
    if (donation.user_id) {
        if (amountMatched) {
            await createNotification(supabase, {
                title: '🎉 Donation Verified',
                message:
                    `Thanks for supporting GATEQuest! Your ` +
                    `₹${emailAmount.toFixed(2)} donation has been confirmed.`,
                link: '/donate',
                type: 'update',
                target: { type: 'user', user_id: donation.user_id },
            });
        } else {
            await createNotification(supabase, {
                title: 'Donation Verified',
                message:
                    `We received ₹${emailAmount.toFixed(2)} on our end ` +
                    `(you entered ₹${suggestedAmount.toFixed(2)}). ` +
                    `Your donation has been verified at the actual ` +
                    `amount received.`,
                link: '/donate',
                type: 'update',
                target: { type: 'user', user_id: donation.user_id },
            });
        }
    }

    return json({
        status: 'verified',
        donation_id: donation.id,
        utr,
        email_amount: emailAmount,
        suggested_amount: suggestedAmount,
        amount_matched: amountMatched,
    });
}
