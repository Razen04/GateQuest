/// <reference lib="deno.ns" />

import type { SupabaseClient } from 'npm:@supabase/supabase-js';

/**
 * Target spec accepted by the `before_notification_insert` trigger.
 * The trigger resolves this to `audience_ids` before commit.
 */
export type TargetSpec =
    | { type: 'user'; user_id: string }
    | { type: 'users'; user_ids: string[] }
    | { type: 'broadcast' }
    | { type: 'segment'; segment: string };

export type NotificationType = 'update' | 'reminder' | 'alert';

export interface NotificationPayload {
    title: string;
    message: string;
    link: string;
    type?: NotificationType;
    target: TargetSpec;
}

/**
 * Insert a notification. The `on_notification_after_insert` trigger
 * dispatches push delivery automatically — this function only writes
 * the row.
 *
 * Non-throwing: notification failures should never break the caller's
 * primary action (e.g., verifying a donation).
 */
export async function createNotification(
    supabase: SupabaseClient,
    payload: NotificationPayload
): Promise<void> {
    const { error } = await supabase.from('notifications').insert({
        title: payload.title,
        message: payload.message,
        link: payload.link,
        type: payload.type ?? null,
        target: payload.target,
    });

    if (error) {
        console.error('[notifications] insert failed:', error);
    }
}
