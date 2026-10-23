import type { SupabaseClient } from 'npm:@supabase/supabase-js';

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
            }
        );
    }

    const studentId = record.user_id;
    const questionId = record.question_id;

    if (!studentId || !questionId) {
        throw new Error(
            'Webhook data missing target user_id or question_id tracking references.'
        );
    }

    const { data: questionData, error: questionErr } = await supabaseAdmin
        .from('questions')
        .select('id, subjects (slug)')
        .eq('id', questionId)
        .single();

    if (questionErr || !questionData) {
        console.error(
            `Failed to find mapping for question ID ${questionId}:`,
            questionErr
        );
        throw (
            questionErr ??
            new Error(`Question ${questionId} not found for report resolution`)
        );
    }

    const subjectSlug =
        (questionData.subjects as { slug?: string })?.slug ?? 'general';

    const { error: insertErr } = await supabaseAdmin
        .from('notifications')
        .insert({
            title: 'Question Fixed!',
            message:
                'An issue you reported has been verified and updated. Thank you for making the platform great for everyone.',
            link: `/practice/${subjectSlug}/${questionId}`,
            type: 'update',
            target: { type: 'user', user_id: studentId },
        });

    if (insertErr) throw insertErr;

    return new Response(
        JSON.stringify({
            success: true,
            message: 'Student resolution notification created.',
        }),
        {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
    );
};
