/// <reference lib="deno.ns" />

import { createClient } from 'npm:@supabase/supabase-js';
import { createNotification } from '../_shared/notifications.ts';

const PENDING_ALERT_MINUTES = 30;
const ESCALATION_HOURS = 24;
const ESCALATION_THRESHOLD_HOURS =
    ESCALATION_HOURS - PENDING_ALERT_MINUTES / 60; // 23.5

function json(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}

function getAdminDonationsUrl(): string {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const match = supabaseUrl.match(/^https:\/\/([^.]+)\.supabase\.co/);
    const ref = match?.[1];
    if (!ref) return '/donate';
    return `https://supabase.com/dashboard/project/${ref}/editor`;
}

async function resolveUserLabel(
    supabase: ReturnType<typeof createClient>,
    userId: string | null
): Promise<string> {
    if (!userId) return 'guest';
    const { data: user } = await supabase
        .from('users')
        .select('username')
        .eq('id', userId)
        .maybeSingle();
    return user?.username ? `@${user.username}` : 'user';
}

export async function handleDonationAlerts(req: Request): Promise<Response> {
    if (req.method !== 'POST') {
        return json({ error: 'Method not allowed' }, 405);
    }

    // ─── Auth — same pattern as dispatch-notification ─────────────
    const providedSecret = req.headers.get('x-cron-secret');
    const expectedSecret = Deno.env.get('CRON_ISOLATED_SECRET');
    if (!providedSecret || providedSecret !== expectedSecret) {
        return json({ error: 'Unauthorized' }, 401);
    }

    const adminUserId = Deno.env.get('ADMIN_USER_ID');
    if (!adminUserId) {
        return json({ error: 'ADMIN_USER_ID not configured' }, 500);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) {
        return json({ error: 'Server misconfigured' }, 500);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
    });

    // ══════════════════════════════════════════════════════════════
    // 30-MINUTE PENDING ALERTS
    // Atomically claims all un-alerted donations older than 30min
    // by setting alerted_at in the same UPDATE...RETURNING call.
    // ══════════════════════════════════════════════════════════════
    const thirtyMinAgo = new Date(
        Date.now() - PENDING_ALERT_MINUTES * 60_000
    ).toISOString();

    const { data: claimedPending, error: claimErr } = await supabase
        .from('donations')
        .update({ alerted_at: new Date().toISOString() })
        .eq('verified', false)
        .is('alerted_at', null)
        .not('utr', 'is', null)
        .lt('created_at', thirtyMinAgo)
        .select('id, utr, suggested_amount, user_id, created_at');

    if (claimErr) {
        console.error('[donation-alerts] claim pending failed:', claimErr);
        return json({ error: 'Database query failed' }, 500);
    }

    let pendingAlertsSent = 0;
    if (claimedPending && claimedPending.length > 0) {
        for (const d of claimedPending) {
            const userLabel = await resolveUserLabel(supabase, d.user_id);
            const minutesAgo = Math.floor(
                (Date.now() - new Date(d.created_at).getTime()) / 60_000
            );

            await createNotification(supabase, {
                title: '⏰ Donation pending for 30+ min',
                message:
                    `${userLabel} submitted a ₹${Number(d.suggested_amount).toFixed(2)} ` +
                    `donation (UTR: ${d.utr}) ${minutesAgo} minutes ago, but no ` +
                    `matching payment email has arrived. Please review.`,
                link: getAdminDonationsUrl(),
                type: 'alert',
                target: { type: 'user', user_id: adminUserId },
            });

            console.log(
                `[donation-alerts] pending alert sent: ${d.id} (UTR: ${d.utr})`
            );
            pendingAlertsSent++;
        }
    }

    // ══════════════════════════════════════════════════════════════
    // 24-HOUR ESCALATIONS
    // alert was sent 23.5+ hours ago (i.e., donation is 24h+ old)
    // and donation is still unverified. Single escalation per donation.
    // ══════════════════════════════════════════════════════════════
    const escalationThreshold = new Date(
        Date.now() - ESCALATION_THRESHOLD_HOURS * 3_600_000
    ).toISOString();

    const { data: claimedEscalated, error: escErr } = await supabase
        .from('donations')
        .update({ alerted_at: new Date().toISOString() })
        .eq('verified', false)
        .not('alerted_at', 'is', null)
        .not('utr', 'is', null)
        .lt('alerted_at', escalationThreshold)
        .select('id, utr, suggested_amount, user_id, created_at');

    if (escErr) {
        console.error('[donation-alerts] claim escalation failed:', escErr);
        // Non-fatal — return partial results
    }

    let escalationsSent = 0;
    if (claimedEscalated && claimedEscalated.length > 0) {
        for (const d of claimedEscalated) {
            const userLabel = await resolveUserLabel(supabase, d.user_id);
            const hoursPending = Math.floor(
                (Date.now() - new Date(d.created_at).getTime()) / 3_600_000
            );

            await createNotification(supabase, {
                title: '🚨 Donation STILL pending after 24h',
                message:
                    `${userLabel}'s ₹${Number(d.suggested_amount).toFixed(2)} ` +
                    `donation (UTR: ${d.utr}) has been unverified for ` +
                    `${hoursPending} hours. Please investigate or contact the donor.`,
                link: getAdminDonationsUrl(),
                type: 'alert',
                target: { type: 'user', user_id: adminUserId },
            });

            console.log(
                `[donation-alerts] escalation sent: ${d.id} (UTR: ${d.utr}, ${hoursPending}h)`
            );
            escalationsSent++;
        }
    }

    return json({
        success: true,
        pending_alerts: pendingAlertsSent,
        escalations: escalationsSent,
    });
}
