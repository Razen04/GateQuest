/// <reference lib="deno.ns" />

import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { handleReportResolved } from '../../process-reminders/handlers/reportResolved.ts';
import { corsHeaders, makeMockSupabase } from '../_shared/testHelpers.ts';

const STUDENT_ID = '11111111-1111-1111-1111-111111111111';
const QUESTION_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

function makeRequest(record: unknown, oldRecord: unknown = null): Request {
    return new Request(
        'http://localhost/process-reminders?task=report-resolved',
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ record, old_record: oldRecord }),
        }
    );
}

Deno.test('report resolved: ignores non-resolved transitions', async () => {
    const supabase = makeMockSupabase();

    const res = await handleReportResolved({
        req: makeRequest(
            {
                status: 'pending',
                user_id: STUDENT_ID,
                question_id: QUESTION_ID,
            },
            { status: 'pending' }
        ),
        supabaseAdmin: supabase.client,
        corsHeaders,
    });

    assertEquals(res.status, 200);
    assertEquals(supabase.notificationInserts.length, 0);
});

Deno.test('report resolved: ignores already-resolved transitions', async () => {
    const supabase = makeMockSupabase();

    const res = await handleReportResolved({
        req: makeRequest(
            {
                status: 'resolved',
                user_id: STUDENT_ID,
                question_id: QUESTION_ID,
            },
            { status: 'resolved' }
        ),
        supabaseAdmin: supabase.client,
        corsHeaders,
    });

    assertEquals(res.status, 200);
    assertEquals(supabase.notificationInserts.length, 0);
});

Deno.test('report resolved: inserts a user-targeted notification for the reporter', async () => {
    const supabase = makeMockSupabase({
        questions: { id: QUESTION_ID, subjects: { slug: 'algorithms' } },
    });

    const res = await handleReportResolved({
        req: makeRequest(
            {
                status: 'resolved',
                user_id: STUDENT_ID,
                question_id: QUESTION_ID,
            },
            { status: 'pending' }
        ),
        supabaseAdmin: supabase.client,
        corsHeaders,
    });

    assertEquals(res.status, 200);
    assertEquals(supabase.notificationInserts.length, 1);

    const insert = supabase.notificationInserts[0];
    assertEquals(insert.target.type, 'user');
    assertEquals(insert.target.user_id, STUDENT_ID);
    assertEquals(insert.type, 'update');
});

Deno.test('report resolved: link includes subject slug and question id', async () => {
    const supabase = makeMockSupabase({
        questions: { id: QUESTION_ID, subjects: { slug: 'algorithms' } },
    });

    await handleReportResolved({
        req: makeRequest(
            {
                status: 'resolved',
                user_id: STUDENT_ID,
                question_id: QUESTION_ID,
            },
            { status: 'pending' }
        ),
        supabaseAdmin: supabase.client,
        corsHeaders,
    });

    const insert = supabase.notificationInserts[0];
    assertEquals(insert.link, `/practice/algorithms/${QUESTION_ID}`);
});

Deno.test('report resolved: throws when user_id or question_id is missing', async () => {
    const supabase = makeMockSupabase();

    let threw = false;
    try {
        await handleReportResolved({
            req: makeRequest(
                { status: 'resolved', question_id: QUESTION_ID },
                { status: 'pending' }
            ),
            supabaseAdmin: supabase.client,
            corsHeaders,
        });
    } catch {
        threw = true;
    }

    assertEquals(threw, true);
    assertEquals(supabase.notificationInserts.length, 0);
});

Deno.test('report resolved: does not query push_subscriptions directly', async () => {
    const supabase = makeMockSupabase({
        questions: { id: QUESTION_ID, subjects: { slug: 'algorithms' } },
    });

    await handleReportResolved({
        req: makeRequest(
            {
                status: 'resolved',
                user_id: STUDENT_ID,
                question_id: QUESTION_ID,
            },
            { status: 'pending' }
        ),
        supabaseAdmin: supabase.client,
        corsHeaders,
    });

    assertEquals(supabase.pushSubscriptionQueries.length, 0);
});
