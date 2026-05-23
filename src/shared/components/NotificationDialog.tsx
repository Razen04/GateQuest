import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { BookOpen, Calendar, CheckSquareOffset, SealCheck } from '@phosphor-icons/react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '../utils/supabaseClient.js';
import type { Database } from '../types/supabase.js';

type NotificationDialogProp = {
    isOpen: boolean;
    setUnreadNotifications: React.Dispatch<React.SetStateAction<boolean>>;
};

type Notification = Database['public']['Tables']['notifications']['Row'];

const NotificationDialog = ({ isOpen, setUnreadNotifications }: NotificationDialogProp) => {
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
        const updatedRead: string[] = Array.from(new Set([...readNotifications, ...allIds]));

        setReadNotifications(updatedRead);
        localStorage.setItem('read_notifications', JSON.stringify(updatedRead));

        setNotifications([]);
        setUnreadNotifications(false);
    };

    // Fetch notifications on mount
    useEffect(() => {
        const fetchNotifications = async () => {
            const lastCheckedStr = localStorage.getItem('last_checked_notification');

            const lastChecked = lastCheckedStr ? new Date(JSON.parse(lastCheckedStr)) : null;

            const now = new Date();
            const diffInHours = lastChecked
                ? (now.getTime() - lastChecked.getTime()) / (1000 * 60 * 60)
                : Infinity;

            if (diffInHours <= 3) return;

            const readIds = JSON.parse(
                localStorage.getItem('read_notifications') || '[]',
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
                setNotifications((data || []).filter((n) => !readIds.includes(n.id)));
                const time = new Date();
                localStorage.setItem('last_checked_notification', JSON.stringify(time));
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
                    className="absolute right-0 top-5 mt-3 w-80 bg-white dark:bg-zinc-900 shadow-lg border border-border-primary dark:border-border-primary-dark overflow-hidden z-50"
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                >
                    <div className="px-4 py-3 border-b border-border-primary dark:border-border-primary-dark  flex justify-between items-center bg-gradient-to-r from-blue-50 to-purple-50 dark:from-zinc-700 dark:to-zinc-800">
                        <h3 className="font-medium">Notifications</h3>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => markAllAsRead(notifications)}
                                className="font-semibold text-blue-500 hover:text-blue-400 cursor-pointer text-lg"
                            >
                                <CheckSquareOffset />
                            </button>
                        </div>
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                        {notifications?.length > 0 ? (
                            notifications.map((notification) => {
                                const isRead = readNotifications.includes(notification.id);
                                return (
                                    <div
                                        key={notification.id}
                                        className={`p-3 border-b border-border-primary dark:border-border-primary-dark hover:bg-gray-50 dark:hover:bg-zinc-700 cursor-pointer flex items-start`}
                                    >
                                        <div className="p-2 rounded-full mr-3 text-left">
                                            {getNotificationIcon(notification)}
                                        </div>
                                        <div className="w-full flex flex-col">
                                            <div className="w-full flex justify-between items-center">
                                                <p className="text-sm font-medium">
                                                    {notification.title}
                                                </p>
                                                <span className="text-xs">
                                                    {formatDistanceToNow(
                                                        new Date(notification.created_at),
                                                    )}
                                                </span>
                                            </div>
                                            <p className="text-xs mt-1 text-left">
                                                {notification.message}
                                            </p>
                                        </div>

                                        {!isRead && (
                                            <span
                                                className="w-2 h-2 rounded-full bg-blue-500 mt-2 ml-2"
                                                title="Unread notification"
                                            ></span>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="py-8 text-center">
                                <p>What a lonely day.</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default NotificationDialog;
