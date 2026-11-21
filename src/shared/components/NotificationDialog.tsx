import {
    BookOpen,
    Calendar,
    CheckSquareOffset,
    SealCheck,
} from '@phosphor-icons/react';
import { formatDistanceToNow } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/app/stores/useAuthStore';
import type { Database } from '../types/supabase.js';
import { supabase } from '../utils/supabaseClient.js';

type NotificationDialogProp = {
    isOpen: boolean;
    setUnreadNotifications: React.Dispatch<React.SetStateAction<boolean>>;
};

type Notification = Database['public']['Tables']['notifications']['Row'];

const NotificationDialog = ({
    isOpen,
    setUnreadNotifications,
}: NotificationDialogProp) => {
    const user = useAuthStore((s) => s.user);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [readIds, setReadIds] = useState<Set<string>>(new Set());
    const [marking, setMarking] = useState(false);

    // RLS limits these to active, targeted notifications from the last
    // 30 days. Read notifications stay visible; their read state comes
    // from notification_reads (own rows only) and is used for styling
    // and the unread badge.
    const fetchNotifications = useCallback(async () => {
        if (!user?.id || user.id === '1') {
            setNotifications([]);
            setReadIds(new Set());
            return;
        }

        const thirtyDaysAgo = new Date(
            Date.now() - 30 * 24 * 60 * 60 * 1000
        ).toISOString();

        const [inbox, reads] = await Promise.all([
            supabase
                .from('notifications')
                .select('*')
                .gte('created_at', thirtyDaysAgo)
                .order('created_at', { ascending: false }),
            supabase
                .from('notification_reads')
                .select('notification_id')
                .eq('user_id', user.id),
        ]);

        if (inbox.error || reads.error) {
            console.error(
                'Error fetching notifications: ',
                inbox.error ?? reads.error
            );
            toast.message("Couldn't fetch notifications");
            return;
        }

        setNotifications(inbox.data ?? []);
        setReadIds(
            new Set((reads.data ?? []).map((row) => row.notification_id))
        );
    }, [user?.id]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // Bubble the unread count up to the parent (drives the bell badge)
    useEffect(() => {
        setUnreadNotifications(
            notifications.some((notification) => !readIds.has(notification.id))
        );
    }, [notifications, readIds, setUnreadNotifications]);

    const markAsRead = async (ids: string[]): Promise<void> => {
        if (!user?.id || ids.length === 0 || marking) return;

        // Keep the items on screen, just flip their read state.
        setReadIds((prev) => new Set([...prev, ...ids]));
        setMarking(true);

        try {
            const rows = ids.map((id) => ({
                notification_id: id,
                user_id: user.id,
            }));

            const { error } = await supabase
                .from('notification_reads')
                .upsert(rows, {
                    onConflict: 'notification_id,user_id',
                    ignoreDuplicates: true,
                });

            if (error) throw error;
        } catch (err) {
            console.error('Failed to mark notifications as read:', err);
            toast.error('Failed to update notifications');
            await fetchNotifications();
        } finally {
            setMarking(false);
        }
    };

    const markAllAsRead = async (): Promise<void> => {
        const unread = notifications
            .filter((notification) => !readIds.has(notification.id))
            .map((notification) => notification.id);
        await markAsRead(unread);
    };

    const getNotificationIcon = (notification: Notification) => {
        if (notification.type === 'update') {
            return <SealCheck className="text-chart-2" />;
        } else if (notification.type === 'reminder') {
            return <Calendar className="text-chart-1" />;
        } else {
            return <BookOpen className="text-chart-6" />;
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="absolute right-0 top-5 mt-3 w-80 overflow-hidden border border-white/20 bg-popover/60 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_12px_40px_rgba(0,0,0,0.18)] z-50"
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                >
                    {/* Glass highlight */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/25 to-transparent dark:from-white/10" />

                    {/* Header */}
                    <div className="relative flex items-center justify-between px-4 py-3 border-b border-white/20 dark:border-white/10">
                        <h3 className="font-semibold text-sm text-foreground">
                            Notifications
                        </h3>

                        <button
                            onClick={markAllAsRead}
                            disabled={marking || notifications.length === 0}
                            className="p-1.5 text-chart-1 hover:bg-card/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Mark all as read"
                        >
                            <CheckSquareOffset size={20} />
                        </button>
                    </div>

                    {/* List */}
                    <div className="relative max-h-80 overflow-y-auto p-2 space-y-1">
                        {notifications.length > 0 ? (
                            notifications.map((notification) => {
                                const isRead = readIds.has(notification.id);

                                return (
                                    <div
                                        key={notification.id}
                                        onClick={() =>
                                            markAsRead([notification.id])
                                        }
                                        className={`group flex items-start gap-3 p-3 border border-transparent hover:border-white/20 hover:bg-card/40 transition-all cursor-pointer ${
                                            isRead ? 'opacity-60' : ''
                                        }`}
                                    >
                                        {/* Icon */}
                                        <div className="flex-shrink-0 flex items-center justify-center w-9 h-9 bg-card/40 border border-white/20">
                                            {getNotificationIcon(notification)}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start gap-2">
                                                <p
                                                    className={`text-sm truncate ${
                                                        isRead
                                                            ? 'text-muted-foreground'
                                                            : 'font-medium text-foreground'
                                                    }`}
                                                >
                                                    {notification.title}
                                                </p>

                                                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                                    {isRead && (
                                                        <span className="mr-1 uppercase">
                                                            Read ·
                                                        </span>
                                                    )}
                                                    {formatDistanceToNow(
                                                        new Date(
                                                            notification.created_at
                                                        )
                                                    )}
                                                </span>
                                            </div>

                                            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                                                {notification.message}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="py-10 text-center text-sm text-muted-foreground">
                                What a lonely day.
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default NotificationDialog;
