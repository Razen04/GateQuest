/// <reference lib="deno.ns" />

import { createClient } from 'npm:@supabase/supabase-js';
import {
    type FanOutResult,
    fanOutPush,
    type PushSubscription,
} from '../_shared/pushFanout.ts';

type DispatchDeps = {
    fanOut?: typeof fanOutPush;
};

const DEFAULT_TITLE = 'GATEQuest';
const DEFAULT_URL = '/dashboard';
const DEFAULT_VAPID_SUBJECT = 'mailto:support@gatequest.in';

function json(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}

function emptyResult(): FanOutResult {
    return {
        processed: 0,
        delivered: 0,
        dead: 0,
        failed: 0,
        deadEndpoints: [],
    };
}

export async function handleDispatch(
    req: Request,
    deps: DispatchDeps = {}
): Promise<Response> {
    // Method gate
    if (req.method !== 'POST') {
        return json({ error: 'Method not allowed' }, 405);
    }

    // Shared-secret gate
    const providedSecret = req.headers.get('x-cron-secret');
    const expectedSecret = Deno.env.get('CRON_ISOLATED_SECRET');
    if (!providedSecret || providedSecret !== expectedSecret) {
        return json({ error: 'Unauthorized' }, 401);
    }

    // Body parsing
    let payloadBody: { notification_id?: string };
    try {
        payloadBody = await req.json();
    } catch {
        return json({ error: 'Invalid JSON body' }, 400);
    }

    const notificationId = payloadBody.notification_id;
    if (!notificationId) {
        return json({ error: 'notification_id is required' }, 400);
    }

    // Supabase admin client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) {
        return json({ error: 'Server misconfigured' }, 500);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
    });

    // Load notification
    const { data: notification, error: notificationErr } = await supabase
        .from('notifications')
        .select('*')
        .eq('id', notificationId)
        .single();

    if (notificationErr || !notification) {
        return json({ error: 'Notification not found' }, 404);
    }

    // Idempotency: already dispatched
    if (notification.dispatched_at) {
        return json({ skipped: true, reason: 'already_dispatched' }, 200);
    }

    // --- Query audience ---
    // Three states matter:
    //   null  → broadcast, everyone gets it
    //   [ids] → targeted, only those users
    //   []    → resolved-to-empty, nobody gets it (skip dispatch entirely)
    const rawAudience = notification.audience_ids as string[] | null;
    const isBroadcast = rawAudience === null;
    const isEmpty = Array.isArray(rawAudience) && rawAudience.length === 0;

    if (isEmpty) {
        await supabase
            .from('notifications')
            .update({ dispatched_at: new Date().toISOString() })
            .eq('id', notificationId);
        return json({ skipped: true, reason: 'empty_audience' }, 200);
    }

    const baseQuery = supabase
        .from('push_subscriptions')
        .select('endpoint, auth_key, p256dh_key, user_id');

    const { data: subscriptions, error: subsErr } = isBroadcast
        ? await baseQuery
        : await baseQuery.in('user_id', rawAudience);

    if (subsErr) {
        console.error('Failed to query push subscriptions:', subsErr);
        return json({ error: 'Failed to query subscriptions' }, 500);
    }

    // Build payload
    const pushPayload = {
        title: notification.title ?? DEFAULT_TITLE,
        body: notification.message ?? '',
        url: notification.link ?? DEFAULT_URL,
    };

    let result = emptyResult();

    // Fan out
    if (subscriptions && subscriptions.length > 0) {
        const fanOut = deps.fanOut ?? fanOutPush;

        result = await fanOut(
            subscriptions as PushSubscription[],
            pushPayload,
            {
                vapidPublicKey: Deno.env.get('VAPID_PUBLIC_KEY') ?? '',
                vapidPrivateKey: Deno.env.get('VAPID_PRIVATE_KEY') ?? '',
                vapidSubject:
                    Deno.env.get('VAPID_SUBJECT') ?? DEFAULT_VAPID_SUBJECT,
            }
        );

        // Clean dead endpoints
        if (result.deadEndpoints.length > 0) {
            const { error: deleteErr } = await supabase
                .from('push_subscriptions')
                .delete()
                .in('endpoint', result.deadEndpoints);

            if (deleteErr) {
                console.error('Failed to delete dead endpoints:', deleteErr);
            }
        }
    }

    // Mark dispatched
    const { error: updateErr } = await supabase
        .from('notifications')
        .update({ dispatched_at: new Date().toISOString() })
        .eq('id', notificationId);

    if (updateErr) {
        console.error('Failed to mark notification as dispatched:', updateErr);
    }

    return json(
        {
            success: true,
            processed: result.processed,
            delivered: result.delivered,
            dead: result.dead,
            failed: result.failed,
        },
        200
    );
}
