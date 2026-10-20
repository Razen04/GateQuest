import type { SupabaseClient } from 'npm:@supabase/supabase-js';
import { WEEKLY_PAYLOADS } from '../payloads/weeklyTestPayloads.ts';

interface TopicTestReminderArgs {
    supabaseAdmin: SupabaseClient;
    corsHeaders: Record<string, string>;
}

const getWeekNumber = (date: Date): number => {
    const d = new Date(
        Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
    );
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};

export const handleTopicTestReminder = async ({
    supabaseAdmin,
    corsHeaders,
}: TopicTestReminderArgs) => {
    const weekIndex = getWeekNumber(new Date()) - 1;
    const selectedCopy = WEEKLY_PAYLOADS[weekIndex % WEEKLY_PAYLOADS.length];

    // The 'active_weekend' segment resolves to users who attempted in the
    // last 14 days. Resolution happens at trigger time via resolve_segment().
    // If nobody matches, the trigger sets audience_ids = [] and the dispatcher
    // skips delivery — no push is sent, but the row exists for auditability.
    const { error: insertErr } = await supabaseAdmin
        .from('notifications')
        .insert({
            title: selectedCopy.title,
            message: selectedCopy.body,
            link: '/topic-test',
            type: 'reminder',
            target: { type: 'segment', segment: 'active_weekend' },
        });

    if (insertErr) throw insertErr;

    return new Response(
        JSON.stringify({
            success: true,
            message: 'Weekend topic test notification created.',
        }),
        {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
    );
};
