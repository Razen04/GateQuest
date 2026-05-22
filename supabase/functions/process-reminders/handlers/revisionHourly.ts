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
