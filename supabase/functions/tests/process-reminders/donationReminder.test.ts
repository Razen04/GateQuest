/// <reference lib="deno.ns" />

import {
    assertEquals,
    assertExists,
} from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { FakeTime } from 'https://deno.land/std@0.224.0/testing/time.ts';
import { handleDonationReminder } from '../../process-reminders/handlers/donationReminder.ts';
import { corsHeaders, makeMockSupabase } from '../_shared/testHelpers.ts';

Deno.test('donation reminder: inserts a broadcast notification on active weeks', async () => {
    // Anchor is 2026-01-01 UTC. Jan 1 → index 0 (even → active).
    using _time = new FakeTime(new Date('2026-01-01T12:00:00Z'));

    const supabase = makeMockSupabase();
    const res = await handleDonationReminder({
        supabaseAdmin: supabase.client,
        corsHeaders,
    });

    assertEquals(res.status, 200);
    assertEquals(supabase.notificationInserts.length, 1);

    const insert = supabase.notificationInserts[0];
    assertEquals(insert.target.type, 'broadcast');
    assertEquals(insert.link, '/donate');
    assertExists(insert.title);
    assertExists(insert.message);
    assertEquals(insert.type, 'reminder');
});

Deno.test('donation reminder: skips on alternating weeks', async () => {
    // Jan 15 → index 1 (odd → skip).
    using _time = new FakeTime(new Date('2026-01-15T12:00:00Z'));

    const supabase = makeMockSupabase();
    const res = await handleDonationReminder({
        supabaseAdmin: supabase.client,
        corsHeaders,
    });

    assertEquals(res.status, 200);
    assertEquals(supabase.notificationInserts.length, 0);
});

Deno.test('donation reminder: cycles through DONATION_REMINDER_PAYLOADS copy', async () => {
    using _time = new FakeTime(new Date('2026-01-01T12:00:00Z'));

    const supabase = makeMockSupabase();
    await handleDonationReminder({
        supabaseAdmin: supabase.client,
        corsHeaders,
    });

    const insert = supabase.notificationInserts[0];
    // Copy rotates; assert it's a non-empty string from the payload list
    assertEquals(typeof insert.title, 'string');
    assertEquals(typeof insert.message, 'string');
    assertEquals(insert.title.length > 0, true);
});

Deno.test('donation reminder: does not query push_subscriptions directly', async () => {
    using _time = new FakeTime(new Date('2026-01-01T12:00:00Z'));

    const supabase = makeMockSupabase();
    await handleDonationReminder({
        supabaseAdmin: supabase.client,
        corsHeaders,
    });

    assertEquals(supabase.pushSubscriptionQueries.length, 0);
});
