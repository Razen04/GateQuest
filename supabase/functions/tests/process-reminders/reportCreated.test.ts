/// <reference lib="deno.ns" />

import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { handleReportCreated } from '../../process-reminders/handlers/reportCreated.ts';
import { corsHeaders, makeMockSupabase } from '../_shared/testHelpers.ts';

const ADMIN_ID = '99999999-9999-9999-9999-999999999999';

function makeRequest(body: unknown): Request {
    return new Request(
        'http://localhost/process-reminders?task=report-created',
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        }
    );
}

Deno.test('report created: inserts a user-targeted notification for the admin', async () => {
    Deno.env.set('ADMIN_USER_ID', ADMIN_ID);

    const supabase = makeMockSupabase();
    const res = await handleReportCreated({
        req: makeRequest({ record: { report_text: 'Question looks wrong' } }),
        supabaseAdmin: supabase.client,
        corsHeaders,
    });

    assertEquals(res.status, 200);
    assertEquals(supabase.notificationInserts.length, 1);

    const insert = supabase.notificationInserts[0];
    assertEquals(insert.target.type, 'user');
    assertEquals(insert.target.user_id, ADMIN_ID);
});

Deno.test('report created: includes truncated report text in the message', async () => {
    Deno.env.set('ADMIN_USER_ID', ADMIN_ID);

    const supabase = makeMockSupabase();
    const longText = 'a'.repeat(200);
    await handleReportCreated({
        req: makeRequest({ record: { report_text: longText } }),
        supabaseAdmin: supabase.client,
        corsHeaders,
    });

    const insert = supabase.notificationInserts[0];
    // The handler truncates to 50 chars per the old logic
    assertEquals(insert.message.includes('a'.repeat(51)), false);
    assertEquals(insert.message.includes('a'.repeat(50)), true);
});

Deno.test('report created: throws when ADMIN_USER_ID is missing', async () => {
    const original = Deno.env.get('ADMIN_USER_ID');
    Deno.env.delete('ADMIN_USER_ID');

    try {
        const supabase = makeMockSupabase();
        let threw = false;
        try {
            await handleReportCreated({
                req: makeRequest({ record: { report_text: 'x' } }),
                supabaseAdmin: supabase.client,
                corsHeaders,
            });
        } catch {
            threw = true;
        }
        assertEquals(threw, true);
        assertEquals(supabase.notificationInserts.length, 0);
    } finally {
        if (original) Deno.env.set('ADMIN_USER_ID', original);
    }
});

Deno.test('report created: does not query push_subscriptions directly', async () => {
    Deno.env.set('ADMIN_USER_ID', ADMIN_ID);

    const supabase = makeMockSupabase();
    await handleReportCreated({
        req: makeRequest({ record: { report_text: 'test' } }),
        supabaseAdmin: supabase.client,
        corsHeaders,
    });

    assertEquals(supabase.pushSubscriptionQueries.length, 0);
});
