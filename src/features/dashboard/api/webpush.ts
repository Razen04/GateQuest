import { getCurrentUser } from '@/shared/api/auth';
import { supabase } from '@/shared/utils/supabaseClient';

export const pushNotificationDetails = async (
    endpoint: string,
    auth_key: string,
    p256dh_key: string,
): Promise<void> => {
    const user = await getCurrentUser();
    if (!user) throw new Error('No authenticated student session found.');

    const { error } = await supabase.from('push_subscriptions').upsert(
        {
            user_id: user.id,
            endpoint: endpoint,
            auth_key: auth_key,
            p256dh_key: p256dh_key,
        },
        { onConflict: 'endpoint' },
    );

    if (error) throw error;
};

export const deleteNotificationDetails = async (storedEndpoint: string): Promise<void> => {
    const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('endpoint', storedEndpoint);

    if (error) throw error;
};
