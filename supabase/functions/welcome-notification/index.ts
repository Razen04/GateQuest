/// <reference lib="deno.ns" />

import webpush from 'npm:web-push';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    if (req.method !== 'POST') {
        return new Response(
            JSON.stringify({
                error: 'Method not allowed',
            }),
            {
                status: 405,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            },
        );
    }

    try {
        const { subscription } = await req.json();

        if (!subscription || !subscription.endpoint) {
            throw new Error('Missing browser subscription endpoint credentials.');
        }

        const publicKey = Deno.env.get('VAPID_PUBLIC_KEY');
        const privateKey = Deno.env.get('VAPID_PRIVATE_KEY');

        webpush.setVapidDetails('mailto:support@gatequest.in', publicKey, privateKey);

        const welcomePayload = JSON.stringify({
            title: 'Welcome to GATEQuest!',
            body: 'Notifications enabled successfully. Get ready to lock down your consistency!',
            url: '/dashboard',
        });

        await webpush.sendNotification(subscription, welcomePayload);

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Welcome ping delivered.',
            }),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            },
        );
    } catch (err) {
        console.error('Edge function failure: ', err.message);

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
