/// <reference lib="deno.ns" />

import type { SupabaseClient } from 'npm:@supabase/supabase-js';

export type MockConfig = {
    questions?: { id: string; subjects: { slug: string } } | null;
    questionsError?: { message: string } | null;
    weeklyRevisionSets?: Array<{ generated_for: string }>;
    weeklyRevisionError?: { message: string } | null;
    notificationInsertError?: { message: string } | null;
};

export function makeMockSupabase(config: MockConfig = {}) {
    const notificationInserts: any[] = [];
    const pushSubscriptionQueries: string[] = [];
    const questionsQueries: string[] = [];
    const revisionSetQueries: string[] = [];

    const from = (table: string) => {
        if (table === 'notifications') {
            return {
                insert: (payload: any) => {
                    notificationInserts.push(payload);
                    return Promise.resolve({
                        data: null,
                        error: config.notificationInsertError ?? null,
                    });
                },
            };
        }

        if (table === 'questions') {
            questionsQueries.push(table);
            return {
                select: () => ({
                    eq: () => ({
                        single: () =>
                            Promise.resolve({
                                data: config.questions ?? null,
                                error: config.questionsError ?? null,
                            }),
                    }),
                }),
            };
        }

        if (table === 'weekly_revision_set') {
            revisionSetQueries.push(table);
            return {
                select: () => ({
                    eq: () => ({
                        gte: () => ({
                            lte: () =>
                                Promise.resolve({
                                    data: config.weeklyRevisionSets ?? [],
                                    error: config.weeklyRevisionError ?? null,
                                }),
                        }),
                    }),
                }),
            };
        }

        if (table === 'push_subscriptions') {
            pushSubscriptionQueries.push(table);
            return {
                select: () => ({
                    eq: () => Promise.resolve({ data: [], error: null }),
                    in: () => Promise.resolve({ data: [], error: null }),
                }),
                delete: () => ({
                    in: () => Promise.resolve({ data: null, error: null }),
                    eq: () => Promise.resolve({ data: null, error: null }),
                }),
            };
        }

        if (table === 'active_weekend_subscriptions') {
            return {
                select: () => Promise.resolve({ data: [], error: null }),
            };
        }

        throw new Error(`Unexpected table: ${table}`);
    };

    return {
        client: { from } as unknown as SupabaseClient,
        notificationInserts,
        pushSubscriptionQueries,
        questionsQueries,
        revisionSetQueries,
    };
}

export const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers':
        'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
