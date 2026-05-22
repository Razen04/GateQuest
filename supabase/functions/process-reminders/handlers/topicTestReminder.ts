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
    let successfulPings = 0;

    for (let i = 0; i < subscriptionsToNotify.length; i += CHUNK_SIZE) {
        const chunk = subscriptionsToNotify.slice(i, i + CHUNK_SIZE);

        const notificationPromises = chunk.map(async (sub) => {
            const pushConfig = {
                endpoint: sub.endpoint,
                keys: { auth: sub.auth_key, p256dh: sub.p256dh_key },
            };

            try {
                await webpush.sendNotification(pushConfig, payload);
                successfulPings++;
            } catch (err) {
                // Intercept dead tokens
                if (err.statusCode === 410 || err.statusCode === 404) {
                    console.warn(`Erasing dead token for user ${sub.user_id}`);
                    await supabaseAdmin
                        .from('push_subscriptions')
                        .delete()
                        .eq('endpoint', sub.endpoint);
                } else {
                    console.error(`Unknown push error for user ${sub.user_id}: `, err);
                }
            }
        });

        await Promise.allSettled(notificationPromises);
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
