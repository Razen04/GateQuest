import { getUserProfile } from '@/helper';
import { supabase } from '@/utils/supabaseClient';
import { useEffect, useState } from 'react';

export const usePresence = (questionId: string) => {
    const [count, setCount] = useState<number | undefined>(undefined);

    useEffect(() => {
        const user = getUserProfile();
        if (!user || !questionId) return;

        const channel = supabase.channel(`presence:${questionId}`, {
            config: {
                presence: {
                    key: questionId,
                },
            },
        });

        const syncPresence = () => {
            const state = channel.presenceState();
            console.log('state: ', state);
            setCount(Object.keys(state).length);
        };

        const debug = (...args: unknown[]) => {
            if (import.meta.env.NODE_ENV !== 'production') {
                console.log(...args);
            }
        };

        channel
            .on('presence', { event: 'sync' }, syncPresence)
            .on('presence', { event: 'join' }, ({ newPresences }) => {
                debug('join', newPresences);
            })
            .on('presence', { event: 'leave' }, ({ leftPresences }) => {
                debug('leave', leftPresences);
            });

        // When a new user joins the questionRoom
        channel.subscribe(async (status) => {
            console.log('Subscription Status:', status);
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
