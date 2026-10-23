import type { SupabaseClient } from 'npm:@supabase/supabase-js';
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
    const biWeeklyIndex = Math.abs(getBiWeeklyIndex(new Date()));

    if (biWeeklyIndex % 2 !== 0) {
        return new Response(
            JSON.stringify({
                message: 'Skipping this week. Not part of the 2-week cycle.',
            }),
            { status: 200, headers: corsHeaders }
        );
    }

    const selectedCopy =
        DONATION_REMINDER_PAYLOADS[
            biWeeklyIndex % DONATION_REMINDER_PAYLOADS.length
        ];

    // The dispatcher trigger resolves target=null to "everyone", fans out to
    // push subscriptions, and marks dispatched_at. This handler only writes
    // the notification row.
    const { error: insertErr } = await supabaseAdmin
        .from('notifications')
        .insert({
            title: selectedCopy.title,
            message: selectedCopy.body,
            link: '/donate',
            type: 'reminder',
            target: { type: 'broadcast' },
        });

    if (insertErr) throw insertErr;

    return new Response(
        JSON.stringify({
            success: true,
            message: 'Donation reminder notification created.',
        }),
        {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
    );
};
