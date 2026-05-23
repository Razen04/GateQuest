import webpush from 'npm:web-push';
import { SupabaseClient } from 'npm:@supabase/supabase-js';

interface RevisionHourlyArgs {
    supabaseAdmin: SupabaseClient;
    corsHeaders: Record<string, string>;
}

export const handleHourlyRevision = async ({ supabaseAdmin, corsHeaders }: RevisionHourlyArgs) => {
    const now = new Date();

    const twentyThreeHoursAgo = new Date(now.getTime() - 23 * 60 * 60 * 1000).toISOString();
    const twentyTwoHoursAgo = new Date(now.getTime() - 22 * 60 * 60 * 1000).toISOString();

    console.log(
        `Auditing weekly sets started between ${twentyThreeHoursAgo} to ${twentyTwoHoursAgo}`,
    );

    const { data: expiringSets, error: setQueryError } = await supabaseAdmin
        .from('weekly_revision_set')
        .select('generated_for')
        .eq('status', 'started')
        .gte('started_at', twentyThreeHoursAgo)
        .lte('started_at', twentyTwoHoursAgo);

    if (setQueryError) throw setQueryError;

    if (!expiringSets || expiringSets.length === 0) {
        return new Response(
            JSON.stringify({
                message: 'No expiring sets found in this hour block.',
            }),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            },
        );
    }

    const targetUserIds = expiringSets.map((set) => set.generated_for);

    const { data: subscriptionsToNotify, error: queryError } = await supabaseAdmin
        .from('push_subscriptions')
        .select('endpoint, auth_key, p256dh_key, user_id')
        .in('user_id', targetUserIds); // Matches user_id against our list of target IDs

    if (queryError) throw queryError;
    if (!subscriptionsToNotify || subscriptionsToNotify.length === 0) {
        return new Response(
            JSON.stringify({
                message: 'no expiring sets found in this hour block',
            }),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            },
        );
    }

    const payload = JSON.stringify({
        title: 'Revision Package Expiring!',
        body: 'Your active revision set expires in 2 hours. Tap to finish your remaining PYQs!',
        url: '/revision',
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
