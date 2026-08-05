import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
    BookOpen,
    Calendar,
    CheckSquareOffset,
    SealCheck,
} from '@phosphor-icons/react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '../utils/supabaseClient.js';
import type { Database } from '../types/supabase.js';

type NotificationDialogProp = {
    isOpen: boolean;
    setUnreadNotifications: React.Dispatch<React.SetStateAction<boolean>>;
};

type Notification = Database['public']['Tables']['notifications']['Row'];

const NotificationDialog = ({
    isOpen,
    setUnreadNotifications,
}: NotificationDialogProp) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [readNotifications, setReadNotifications] = useState<string[]>(() => {
        try {
            const stored = localStorage.getItem('read_notifications');
            const parsed = stored ? JSON.parse(stored) : [];

            return Array.isArray(parsed) ? (parsed as string[]) : [];
        } catch {
            return [];
        }
    });

    // Mark all notifications as read
    const markAllAsRead = (notifications: Notification[]): void => {
        const allIds: string[] = notifications.map((n) => n.id);
        const updatedRead: string[] = Array.from(
            new Set([...readNotifications, ...allIds])
        );

        setReadNotifications(updatedRead);
        localStorage.setItem('read_notifications', JSON.stringify(updatedRead));

        setNotifications([]);
        setUnreadNotifications(false);
    };

    // Fetch notifications on mount
    useEffect(() => {
        const fetchNotifications = async () => {
            const lastCheckedStr = localStorage.getItem(
                'last_checked_notification'
            );

            const lastChecked = lastCheckedStr
                ? new Date(JSON.parse(lastCheckedStr))
                : null;

            const now = new Date();
            const diffInHours = lastChecked
                ? (now.getTime() - lastChecked.getTime()) / (1000 * 60 * 60)
                : Infinity;

            if (diffInHours <= 3) return;

            const readIds = JSON.parse(
                localStorage.getItem('read_notifications') || '[]'
            ) as string[];

            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('active', true)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching notifications: ', error);
                toast.message("Couldn't fetch notifications");
            } else {
                setNotifications(
                    (data || []).filter((n) => !readIds.includes(n.id))
                );
                const time = new Date();
                localStorage.setItem(
                    'last_checked_notification',
                    JSON.stringify(time)
                );
            }
        };

        fetchNotifications();
    }, []);

    // Update unread status when notifications or readNotifications change
    useEffect(() => {
        setUnreadNotifications(notifications.length > 0);
    }, [notifications, setUnreadNotifications]);

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
                            onClick={() => markAllAsRead(notifications)}
                            className="p-1.5 text-blue-500 hover:bg-white/20 dark:hover:bg-white/10 transition-colors"
                        >
                            <CheckSquareOffset size={20} />
                        </button>
                    </div>

                    {/* List */}
                    <div className="relative max-h-80 overflow-y-auto p-2 space-y-1">
                        {notifications?.length > 0 ? (
                            notifications.map((notification) => {
                                const isRead = readNotifications.includes(
                                    notification.id
                                );

                                return (
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

                                        {!isRead && (
                                            <span
                                                className="mt-1.5 h-2 w-2 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"
                                                title="Unread notification"
                                            />
                                        )}
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
