import webpush from 'npm:web-push';
import { createClient } from 'npm:@supabase/supabase-js';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const incomingSecret = req.headers.get('x-cron-secret');
        const expectedSecret = Deno.env.get('CRON_SECRET');

        if (!incomingSecret || incomingSecret !== expectedSecret) {
            console.warn(
                'Unauthorized function invocation intercepted! Rejected malicious signature.',
            );
            return new Response(
                JSON.stringify({
                    error: 'Access Dened: Invalid cron signature.',
                }),
                {
                    status: 401,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                },
            );
        }

        const url = new URL(req.url);
        const task = url.searchParams.get('task');

        if (!task) {
            throw new Error('Missing required ?task= parameter in the routing URL request.');
        }

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL'),
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
        );

        webpush.setVapidDetails(
            'mailto:support@gatequest.in',
            Deno.env.get('VAPID_PUBLIC_KEY'),
            Deno.env.get('VAPID_PRIVATE_KEY'),
        );

        switch (task) {
            case 'revision-hourly': {
                const now = new Date();

                const twentyThreeHoursAgo = new Date(
                    now.getTime() - 23 * 60 * 60 * 1000,
                ).toISOString();
                const twentyTwoHoursAgo = new Date(
                    now.getTime() - 22 * 60 * 60 * 1000,
                ).toISOString();

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
            }
            case 'report-created': {
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
            }

            case 'report-resolved': {
                const { record, old_record } = await req.json();

                if (record.status !== 'resolved' || old_record?.status === 'resolved') {
                    return new Response(
                        JSON.stringify({
                            message: 'Ignore: status transition is irrelevant',
                        }),
                        {
                            status: 200,
                            headers: corsHeaders,
                        },
                    );
                }

                const studentId = record.user_id;
                const questionId = record.question_id;

                if (!studentId || !questionId) {
                    throw new Error(
                        'Webhook data missing target user_id or question_id tracking references.',
                    );
                }

                const { data: questionData, error: questionErr } = await supabaseAdmin
                    .from('questions')
                    .select(
                        `
														id,
														subjects (slug)
														`,
                    )
                    .eq('id', questionId)
                    .single();

                if (questionErr || !questionData) {
                    console.error(
                        `Failed to find mapping for question ID ${questionId}:`,
                        questionErr,
                    );
                    throw questionErr;
                }

                const subjectSlug = (questionData.subjects as any)?.slug || 'general';

                const { data: studentSubs, error: studentErr } = await supabaseAdmin
                    .from('push_subscriptions')
                    .select('endpoint, auth_key, p256dh_key')
                    .eq('user_id', studentId);

                if (studentErr) throw studentErr;
                if (!studentSubs || studentSubs.length === 0) {
                    return new Response(
                        JSON.stringify({
                            message: 'Student has no registered web push endpoints.',
                        }),
                        {
                            status: 200,
                            headers: corsHeaders,
                        },
                    );
                }

                const studentPayload = JSON.stringify({
                    title: 'Question Fixed!',
                    body: 'An issue you reported has been verified and updated. Thank you for making the platform great for everyone.',
                    url: `/practice/${subjectSlug}/${questionId}`,
                });

                for (const sub of studentSubs) {
                    try {
                        await webpush.sendNotification(
                            {
                                endpoint: sub.endpoint,
                                keys: {
                                    auth: sub.auth_key,
                                    p256dh: sub.p256dh_key,
                                },
                            },
                            studentPayload,
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
                        message: 'Student resolution notification dispatched.',
                    }),
                    {
                        status: 200,
                        headers: corsHeaders,
                    },
                );
            }
            default:
                throw new Error('Invalid task');
        }
    } catch (err) {
        console.error('master Reminder Engine Error: ', err.message);
        return new Response(
            JSON.stringify({
                error: err.message,
            }),
            {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            },
        );
    }
});
