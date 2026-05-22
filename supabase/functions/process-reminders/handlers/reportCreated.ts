import webpush from 'npm:web-push';
import { SupabaseClient } from 'npm:@supabase/supabase-js';

interface ReportCreatedArgs {
    req: Request;
    supabaseAdmin: SupabaseClient;
    corsHeaders: Record<string, string>;
}

export const handleReportCreated = async ({
    req,
    supabaseAdmin,
    corsHeaders,
}: ReportCreatedArgs) => {
    const ADMIN_USER_ID = Deno.env.get('ADMIN_USER_ID');

    if (!ADMIN_USER_ID) {
        throw new Error('ADMIN_USER_ID is missing from the environment variables.');
    }

    const { data: adminSubs, error: adminErr } = await supabaseAdmin
        .from('push_subscriptions')
        .select('endpoint, auth_key, p256dh_key')
        .eq('user_id', ADMIN_USER_ID);

    if (adminErr) throw adminErr;
    if (!adminSubs || adminSubs.length === 0) {
        return new Response(
            JSON.stringify({
                message: 'Admin token missing from push subscriptions table.',
            }),
            {
                status: 200,
                headers: corsHeaders,
            },
        );
    }

    const { record } = await req.json();
    const sampleDetails = record?.report_text || 'No additional notes provided.';

    const adminPayload = JSON.stringify({
        title: 'New Report Filed!',
        body: `Issue: "${sampleDetails.substring(0, 50)}...". Check table editor.`,
        url: 'https://supabase.com/dashboard/project/zewzixicpoxirmouyeje/editor/86578?schema=public',
    });

    for (const sub of adminSubs) {
        try {
            await webpush.sendNotification(
                {
                    endpoint: sub.endpoint,
                    keys: {
                        auth: sub.auth_key,
                        p256dh: sub.p256dh_key,
                    },
                },
                adminPayload,
            );
        } catch (err) {
            if (err.statusCode === 410 || err.statusCode === 404) {
                await supabaseAdmin
                    .from('push_subscriptions')
                    .delete()
                    .eq('endpoint', sub.endpoint);
            }
        }
    }

    return new Response(
        JSON.stringify({
            success: true,
            message: 'Admin alert delivered.',
        }),
        {
            status: 200,
            headers: corsHeaders,
        },
    );
};
