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
    const [marking, setMarking] = useState(false);

    // Fetch notifications. RLS filters to:
    //   - active notifications
    //   - whose target matches this user (broadcast/user/tag/segment)
    //   - that this user has not already marked as read
    const fetchNotifications = useCallback(async () => {
        if (!user?.id || user.id === '1') {
            setNotifications([]);
            return;
        }

        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching notifications: ', error);
            toast.message("Couldn't fetch notifications");
            return;
        }

        setNotifications(data ?? []);
    }, [user?.id]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // Bubble the unread flag up to the parent (drives the bell badge)
    useEffect(() => {
        setUnreadNotifications(notifications.length > 0);
    }, [notifications, setUnreadNotifications]);

    const markAllAsRead = async (): Promise<void> => {
        if (!user?.id || notifications.length === 0 || marking) return;

        const idsToMark = notifications.map((n) => n.id);

        // Optimistic clear
        setNotifications([]);
        setUnreadNotifications(false);
        setMarking(true);

        try {
            const rows = idsToMark.map((id) => ({
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
            // Restore from server since the optimistic clear was wrong
            await fetchNotifications();
        } finally {
            setMarking(false);
        }
    };

    const getNotificationIcon = (notification: Notification) => {
        if (notification.type === 'update') {
            return <SealCheck className="text-green-500" />;
        } else if (notification.type === 'reminder') {
            return <Calendar className="text-blue-500" />;
        } else {
            return <BookOpen className="text-purple-500" />;
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="absolute right-0 top-5 mt-3 w-80 overflow-hidden border border-white/20 bg-white/20 backdrop-blur-2xl backdrop-saturate-150 dark:bg-black/20 dark:border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.18)] z-50"
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                >
                    {/* Glass highlight */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/25 to-transparent dark:from-white/10" />

                    {/* Header */}
                    <div className="relative flex items-center justify-between px-4 py-3 border-b border-white/20 dark:border-white/10">
                        <h3 className="font-semibold text-sm">Notifications</h3>

                        <button
                            onClick={markAllAsRead}
                            disabled={marking || notifications.length === 0}
                            className="p-1.5 text-blue-500 hover:bg-white/20 dark:hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Mark all as read"
                        >
                            <CheckSquareOffset size={20} />
                        </button>
                    </div>

                    {/* List */}
                    <div className="relative max-h-80 overflow-y-auto p-2 space-y-1">
                        {notifications.length > 0 ? (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className="group flex items-start gap-3 p-3 border border-transparent hover:border-white/20 hover:bg-white/20 dark:hover:bg-white/[0.08] transition-all cursor-pointer"
                                >
                                    {/* Icon */}
                                    <div className="flex-shrink-0 flex items-center justify-center w-9 h-9 bg-white/20 dark:bg-white/[0.08] border border-white/20">
                                        {getNotificationIcon(notification)}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start gap-2">
                                            <p className="text-sm font-medium truncate">
                                                {notification.title}
                                            </p>

                                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
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
                            ))
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
