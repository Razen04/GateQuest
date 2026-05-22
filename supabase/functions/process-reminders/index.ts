import webpush from 'npm:web-push';
import { createClient } from 'npm:@supabase/supabase-js';
import { handleReportCreated } from './handlers/reportCreated.ts';
import { handleReportResolved } from './handlers/reportResolved.ts';
import { handleHourlyRevision } from './handlers/revisionHourly.ts';
import { handleTopicTestReminder } from './handlers/topicTestReminder.ts';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const incomingSecret = req.headers.get('x-cron-secret');
        const expectedSecret = Deno.env.get('CRON_SECRET');

        if (!incomingSecret || incomingSecret !== expectedSecret) {
            console.warn(
                'Unauthorized function invocation intercepted! Rejected malicious signature.',
            );
            return new Response(
                JSON.stringify({
                    error: 'Access Dened: Invalid cron signature.',
                }),
                {
                    status: 401,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                },
            );
        }

        const url = new URL(req.url);
        const task = url.searchParams.get('task');

        if (!task) {
            throw new Error('Missing required ?task= parameter in the routing URL request.');
        }

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL'),
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
        );

        webpush.setVapidDetails(
            'mailto:support@gatequest.in',
            Deno.env.get('VAPID_PUBLIC_KEY'),
            Deno.env.get('VAPID_PRIVATE_KEY'),
        );

        switch (task) {
            case 'revision-hourly': {
                return await handleHourlyRevision({ supabaseAdmin, corsHeaders });
            }
            case 'report-created': {
                return await handleReportCreated({ req, supabaseAdmin, corsHeaders });
            }
            case 'report-resolved': {
                return await handleReportResolved({ req, supabaseAdmin, corsHeaders });
            }
            case 'weekend-topic-test': {
                return await handleTopicTestReminder({ supabaseAdmin, corsHeaders });
            }
            default:
                throw new Error('Invalid task');
        }
    } catch (err) {
        console.error('master Reminder Engine Error: ', err.message);
        return new Response(
            JSON.stringify({
                error: err.message,
            }),
            {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            },
        );
    }
});
