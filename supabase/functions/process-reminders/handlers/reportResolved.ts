import webpush from 'npm:web-push';
import { SupabaseClient } from 'npm:@supabase/supabase-js';

interface ReportResolvedArgs {
    req: Request;
    supabaseAdmin: SupabaseClient;
    corsHeaders: Record<string, string>;
}

export const handleReportResolved = async ({
    req,
    supabaseAdmin,
    corsHeaders,
}: ReportResolvedArgs) => {
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
        throw new Error('Webhook data missing target user_id or question_id tracking references.');
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
        console.error(`Failed to find mapping for question ID ${questionId}:`, questionErr);
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
};
