/// <reference lib="deno.ns" />

import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { handleTopicTestReminder } from '../../process-reminders/handlers/topicTestReminder.ts';
import { corsHeaders, makeMockSupabase } from '../_shared/testHelpers.ts';

Deno.test('topic test reminder: inserts a segment-targeted notification', async () => {
    const supabase = makeMockSupabase();

    const res = await handleTopicTestReminder({
        supabaseAdmin: supabase.client,
        corsHeaders,
    });

    assertEquals(res.status, 200);
    assertEquals(supabase.notificationInserts.length, 1);

    const insert = supabase.notificationInserts[0];
    assertEquals(insert.target.type, 'segment');
    assertEquals(insert.target.segment, 'active_weekend');
    assertEquals(insert.link, '/topic-test');
    assertEquals(insert.type, 'reminder');
});

Deno.test('topic test reminder: uses WEEKLY_PAYLOADS copy', async () => {
    const supabase = makeMockSupabase();

    await handleTopicTestReminder({
        supabaseAdmin: supabase.client,
        corsHeaders,
    });

    const insert = supabase.notificationInserts[0];
    assertEquals(typeof insert.title, 'string');
    assertEquals(typeof insert.message, 'string');
    assertEquals(insert.title.length > 0, true);
    assertEquals(insert.message.length > 0, true);
});

Deno.test('topic test reminder: does not query push_subscriptions directly', async () => {
    const supabase = makeMockSupabase();

    await handleTopicTestReminder({
        supabaseAdmin: supabase.client,
        corsHeaders,
    });

    assertEquals(supabase.pushSubscriptionQueries.length, 0);
});
