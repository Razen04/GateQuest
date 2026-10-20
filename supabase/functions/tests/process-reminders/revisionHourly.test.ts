/// <reference lib="deno.ns" />

import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { handleHourlyRevision } from '../../process-reminders/handlers/revisionHourly.ts';
import { corsHeaders, makeMockSupabase } from '../_shared/testHelpers.ts';

const USER_A = '11111111-1111-1111-1111-111111111111';
const USER_B = '22222222-2222-2222-2222-222222222222';

Deno.test('revision hourly: queries weekly_revision_set with an hour window', async () => {
    const supabase = makeMockSupabase({
        weeklyRevisionSets: [{ generated_for: USER_A }],
    });

    await handleHourlyRevision({
        supabaseAdmin: supabase.client,
        corsHeaders,
    });

    assertEquals(supabase.revisionSetQueries.length, 1);
});

Deno.test('revision hourly: inserts a users-targeted notification with those user IDs', async () => {
    const supabase = makeMockSupabase({
        weeklyRevisionSets: [
            { generated_for: USER_A },
            { generated_for: USER_B },
        ],
    });

    const res = await handleHourlyRevision({
        supabaseAdmin: supabase.client,
        corsHeaders,
    });

    assertEquals(res.status, 200);
    assertEquals(supabase.notificationInserts.length, 1);

    const insert = supabase.notificationInserts[0];
    assertEquals(insert.target.type, 'users');
    assertEquals(insert.target.user_ids.length, 2);
    assertEquals(insert.target.user_ids.includes(USER_A), true);
    assertEquals(insert.target.user_ids.includes(USER_B), true);
    assertEquals(insert.link, '/revision');
    assertEquals(insert.type, 'reminder');
});

Deno.test('revision hourly: skips insert when no expiring sets', async () => {
    const supabase = makeMockSupabase({
        weeklyRevisionSets: [],
    });

    const res = await handleHourlyRevision({
        supabaseAdmin: supabase.client,
        corsHeaders,
    });

    assertEquals(res.status, 200);
    assertEquals(supabase.notificationInserts.length, 0);
});

Deno.test('revision hourly: does not query push_subscriptions directly', async () => {
    const supabase = makeMockSupabase({
        weeklyRevisionSets: [{ generated_for: USER_A }],
    });

    await handleHourlyRevision({
        supabaseAdmin: supabase.client,
        corsHeaders,
    });

    assertEquals(supabase.pushSubscriptionQueries.length, 0);
});
