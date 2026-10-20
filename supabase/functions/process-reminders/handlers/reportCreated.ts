import type { SupabaseClient } from 'npm:@supabase/supabase-js';

interface ReportCreatedArgs {
    req: Request;
    supabaseAdmin: SupabaseClient;
    corsHeaders: Record<string, string>;
}

const ADMIN_REPORTS_URL =
    'https://supabase.com/dashboard/project/zewzixicpoxirmouyeje/editor/86578?schema=public';

export const handleReportCreated = async ({
    req,
    supabaseAdmin,
    corsHeaders,
}: ReportCreatedArgs) => {
    const adminUserId = Deno.env.get('ADMIN_USER_ID');

    if (!adminUserId) {
        throw new Error(
            'ADMIN_USER_ID is missing from the environment variables.'
        );
    }

    const { record } = await req.json();
    const sampleDetails =
        record?.report_text || 'No additional notes provided.';

    const { error: insertErr } = await supabaseAdmin
        .from('notifications')
        .insert({
            title: 'New Report Filed!',
            message: `Issue: "${sampleDetails.substring(0, 50)}...". Check table editor.`,
            link: ADMIN_REPORTS_URL,
            target: { type: 'user', user_id: adminUserId },
        });

    if (insertErr) throw insertErr;

    return new Response(
        JSON.stringify({
            success: true,
            message: 'Admin alert notification created.',
        }),
        {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
    );
};
