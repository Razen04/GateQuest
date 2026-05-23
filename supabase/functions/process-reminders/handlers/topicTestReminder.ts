import webpush from 'npm:web-push';
import { SupabaseClient } from 'npm:@supabase/supabase-js';
import { WEEKLY_PAYLOADS } from '../payloads/weeklyTestPayloads.ts';

interface TopicTestReminderArgs {
    supabaseAdmin: SupabaseClient;
    corsHeaders: Record<string, string>;
}

const getWeekNumber = (date: Date): number => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};

export const handleTopicTestReminder = async ({
    supabaseAdmin,
    corsHeaders,
}: TopicTestReminderArgs) => {
    // Query the view to directly get this week users to notify
    const { data: subscriptionsToNotify, error: queryErr } = await supabaseAdmin
        .from('active_weekend_subscriptions')
        .select('*');

    if (queryErr) throw queryErr;

    if (!subscriptionsToNotify || subscriptionsToNotify.length === 0) {
        return new Response(
            JSON.stringify({
                message: 'No active subscribers found for this weekend.',
            }),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            },
        );
    }

    const weekIndex = getWeekNumber(new Date()) - 1;
    const selectedCopy = WEEKLY_PAYLOADS[weekIndex % WEEKLY_PAYLOADS.length];

    const payload = JSON.stringify({
        title: selectedCopy.title,
        body: selectedCopy.body,
        url: '/topic-test',
    });

    const CHUNK_SIZE = 50;
    const MAX_CONCURRENT_CHUNKS = 10;
    let successfulPings = 0;
    const deadEndpoints: string[] = [];

    const chunks = [];
    for (let i = 0; i < subscriptionsToNotify.length; i += CHUNK_SIZE) {
        chunks.push(subscriptionsToNotify.slice(i, i + CHUNK_SIZE));
    }

    const processChunk = async (chunk: typeof subscriptionsToNotify) => {
        const promises = chunk.map(async (sub) => {
            try {
                await webpush.sendNotification(
                    {
                        endpoint: sub.endpoint,
                        keys: { auth: sub.auth_key, p256dh: sub.p256dh_key },
                    },
                    payload,
                );
                successfulPings++;
            } catch (err) {
                if (err.statusCode === 410 || err.statusCode === 404) {
                    deadEndpoints.push(sub.endpoint); // Queue for bulk deletion
                }
            }
        });
        await Promise.allSettled(promises);
    };

    // Execute chunks in parallel pools of 10
    for (let i = 0; i < chunks.length; i += MAX_CONCURRENT_CHUNKS) {
        const pool = chunks.slice(i, i + MAX_CONCURRENT_CHUNKS).map(processChunk);
        await Promise.all(pool);
    }

    // Bulk delete all dead tokens in exactly ONE database call
    if (deadEndpoints.length > 0) {
        console.warn(`Bulk deleting ${deadEndpoints.length} dead tokens...`);
        await supabaseAdmin.from('push_subscriptions').delete().in('endpoint', deadEndpoints);
    }

    return new Response(
        JSON.stringify({
            success: true,
            processed: subscriptionsToNotify.length,
            delivered: successfulPings,
        }),
        {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
    );
};
