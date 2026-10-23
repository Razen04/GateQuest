import type { SupabaseClient } from 'npm:@supabase/supabase-js';

interface RevisionHourlyArgs {
    supabaseAdmin: SupabaseClient;
    corsHeaders: Record<string, string>;
}

export const handleHourlyRevision = async ({
    supabaseAdmin,
    corsHeaders,
}: RevisionHourlyArgs) => {
    const now = new Date();

    const twentyThreeHoursAgo = new Date(
        now.getTime() - 23 * 60 * 60 * 1000
    ).toISOString();
    const twentyTwoHoursAgo = new Date(
        now.getTime() - 22 * 60 * 60 * 1000
    ).toISOString();

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
            }
        );
    }

    // Dedupe defensively — one set per user is expected but not guaranteed.
    const targetUserIds = [
        ...new Set(expiringSets.map((s) => s.generated_for as string)),
    ];

    const { error: insertErr } = await supabaseAdmin
        .from('notifications')
        .insert({
            title: 'Revision Package Expiring!',
            message:
                'Your active revision set expires in 2 hours. Tap to finish your remaining PYQs!',
            link: '/revision',
            type: 'reminder',
            target: { type: 'users', user_ids: targetUserIds },
        });

    if (insertErr) throw insertErr;

    return new Response(
        JSON.stringify({
            success: true,
            message: 'Revision expiring notification created.',
            user_count: targetUserIds.length,
        }),
        {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
    );
};
