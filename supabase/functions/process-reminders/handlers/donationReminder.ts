import webpush from 'npm:web-push';
import { SupabaseClient } from 'npm:@supabase/supabase-js';
import { DONATION_REMINDER_PAYLOADS } from '../payloads/weeklyDonationPayloads.ts';

interface DonationReminderArgs {
    supabaseAdmin: SupabaseClient;
    corsHeaders: Record<string, string>;
}

// Calculates a bi-weekly index that increments every 14 days
const getBiWeeklyIndex = (date: Date): number => {
    const msInADay = 86400000;
    const msInTwoWeeks = msInADay * 14;

    const anchorDate = new Date(Date.UTC(2026, 0, 1));

    const timeDiff = date.getTime() - anchorDate.getTime();
    return Math.floor(timeDiff / msInTwoWeeks);
};

export const handleDonationReminder = async ({
    supabaseAdmin,
    corsHeaders,
}: DonationReminderArgs) => {
    const { data: allSubscriptions, error: queryErr } = await supabaseAdmin
        .from('push_subscriptions')
        .select('*');

    if (queryErr) throw queryErr;
    if (!allSubscriptions || allSubscriptions.length === 0) {
        return new Response(JSON.stringify({ message: 'No subscriptions.' }), {
            status: 200,
            headers: corsHeaders,
        });
    }

    const biWeeklyIndex = Math.abs(getBiWeeklyIndex(new Date()));

    if (biWeeklyIndex % 2 !== 0) {
        return new Response(
            JSON.stringify({
                message: 'Skipping this week. Not part of the 2-week cycle.',
            }),
            { status: 200, headers: corsHeaders },
        );
    }

    const selectedCopy =
        DONATION_REMINDER_PAYLOADS[biWeeklyIndex % DONATION_REMINDER_PAYLOADS.length];

    const payload = JSON.stringify({
        title: selectedCopy.title,
        body: selectedCopy.body,
        url: '/donate',
    });

    const CHUNK_SIZE = 50;
    const MAX_CONCURRENT_CHUNKS = 10;
    let successfulPings = 0;
    const deadEndpoints: string[] = [];

    const chunks = [];
    for (let i = 0; i < allSubscriptions.length; i += CHUNK_SIZE) {
        chunks.push(allSubscriptions.slice(i, i + CHUNK_SIZE));
    }

    const processChunk = async (chunk: typeof allSubscriptions) => {
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
            processed: allSubscriptions.length,
            delivered: successfulPings,
        }),
        {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
    );
};
