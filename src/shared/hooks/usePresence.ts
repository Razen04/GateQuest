import { useEffect, useState } from 'react';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { supabase } from '../utils/supabaseClient';

export const usePresence = (questionId: string) => {
    const [count, setCount] = useState<number | undefined>(undefined);
    const userId = useAuthStore((s) => s.user?.id);

    useEffect(() => {
        if (!userId || !questionId) return;

        const channel = supabase.channel(`presence:${questionId}`, {
            config: {
                presence: {
                    key: userId,
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
                console.warn(
                    'Realtime limit reached. Presence data unavailable.'
                );
            }

            if (status !== 'SUBSCRIBED') {
                return;
            }

            await channel.track({
                user_id: userId,
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
