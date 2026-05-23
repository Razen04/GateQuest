import { useEffect, useState } from 'react';
import { getUserProfile } from '../utils/helper';
import { supabase } from '../utils/supabaseClient';

export const usePresence = (questionId: string) => {
    const [count, setCount] = useState<number | undefined>(undefined);

    useEffect(() => {
        const user = getUserProfile();
        if (!user?.id || !questionId) return;

        const channel = supabase.channel(`presence:${questionId}`, {
            config: {
                presence: {
                    key: user.id,
                },
            },
        });

        const syncPresence = () => {
            const state = channel.presenceState();
            const count = Object.keys(state).length;
            setCount(count);
        };

        channel
            .on('presence', { event: 'sync' }, syncPresence)
            .on('presence', { event: 'join' }, () => {})
            .on('presence', { event: 'leave' }, () => {});

        // When a new user joins the questionRoom
        channel.subscribe(async (status) => {
            if (status === 'CHANNEL_ERROR') {
                console.warn('Realtime limit reached. Presence data unavailable.');
            }

            if (status !== 'SUBSCRIBED') {
                return;
            }

            await channel.track({
                user_id: user.id,
                online_at: new Date().toISOString(),
            });
        });

        // When a user leaves the room
        return () => {
            channel.unsubscribe();
        };
    }, [questionId]);

    return { count };
};
