import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BiCheckCircle } from 'react-icons/bi'
import { FaBookOpen, FaCalendarAlt } from 'react-icons/fa'
import { toast } from 'sonner'
import { supabase } from '../../supabaseClient'
import { formatDistanceToNow } from 'date-fns'

const Notification = ({ isOpen, onClose, setUnreadNotifications }) => {

    const [notifications, setNotifications] = useState([]);
    const [readNotifications, setReadNotifications] = useState(() => {
        return JSON.parse(localStorage.getItem("read_notifications")) || [];
    });


    // Mark all notifications as read
    const markAllAsRead = (notifications) => {
        const allIds = notifications.map(n => n.id);
        const updatedRead = Array.from(new Set([...readNotifications, ...allIds]));
        setReadNotifications(updatedRead);
        localStorage.setItem('read_notifications', JSON.stringify(updatedRead));
        setUnreadNotifications(false);
    };


    // Fetch notifications on mount
    useEffect(() => {
        const fetchNotifications = async () => {
            const { data, error } = await supabase.from('notifications').select('*').eq('active', true).order('created_at', { ascending: false });
            if (error) {
                console.error('Error fetching notifications: ', error);
                toast.message("Couldn't fetch notifications");
            } else {
                setNotifications((data || []).filter(n => !readNotifications.includes(n.id)));
            }
        };
        fetchNotifications();
    }, []);

    // Update unread status when notifications or readNotifications change
    useEffect(() => {
        if (notifications.length === 0) {
            setUnreadNotifications(false);
            return;
        }
        const unread = notifications.some(n => !readNotifications?.includes(n.id));
        setUnreadNotifications(unread)
    }, [notifications, readNotifications, setUnreadNotifications]);

    const getNotificationIcon = (notification) => {
        if (notification.type === "update") {
            return (<BiCheckCircle className="text-green-500" />);
        } else if (notification.type === "reminder") {
            return (<FaCalendarAlt className="text-blue-500" />);
        } else {
            return (<FaBookOpen className="text-purple-500" />);
        }
    };


    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="absolute right-0 mt-3 w-80 bg-white dark:bg-zinc-900 rounded-lg shadow-lg border border-border-primary dark:border-border-primary-dark overflow-hidden z-50"
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
                                className="text-xs font-semibold text-blue-500 hover:text-blue-700 cursor-pointer"
                            >
                                Mark all as read
                            </button>
                        </div>
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                        {notifications?.length > 0 ? (
                            notifications.map(notification => {
                                const isRead = readNotifications.includes(notification.id);
                                return (
                                    <div
                                        key={notification.id}
                                        className={`p-3 border-b border-border-primary dark:border-border-primary-dark hover:bg-gray-50 dark:hover:bg-zinc-700 cursor-pointer flex items-start`}
                                    >
                                        <div className="p-2 rounded-full mr-3">
                                            {getNotificationIcon(notification)}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <p className="text-sm font-medium">{notification.title}</p>
                                                <span className="text-xs">{formatDistanceToNow(notification.created_at)}</span>
                                            </div>
                                            <p className="text-xs mt-1">{notification.message}</p>
                                        </div>
                                        {!isRead && (
                                            <span className="w-2 h-2 rounded-full bg-blue-500 mt-2 ml-2" title="Unread notification"></span>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="py-8 text-center">
                                <p>No notifications yet</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

export default Notification