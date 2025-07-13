import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BiX, BiCheckCircle } from 'react-icons/bi'
import { FaBookOpen, FaCalendarAlt, FaAward } from 'react-icons/fa'

// Sample notification data
const sampleNotifications = [
    {
        id: 1,
        type: 'achievement',
        title: 'Achievement Unlocked',
        message: 'You completed 5 practice tests in a row!',
        icon: <FaAward className="text-yellow-500" />,
        time: '2 hours ago',
        read: false
    },
    {
        id: 2,
        type: 'reminder',
        title: 'Study Reminder',
        message: 'Your scheduled OS concepts review is due today.',
        icon: <FaCalendarAlt className="text-blue-500" />,
        time: '5 hours ago',
        read: false
    },
    {
        id: 3,
        type: 'content',
        title: 'New Material Available',
        message: 'New practice questions added for Computer Networks.',
        icon: <FaBookOpen className="text-purple-500" />,
        time: 'Yesterday',
        read: true
    },
    {
        id: 4,
        type: 'system',
        title: 'System Update',
        message: 'GateQuest was updated with new features.',
        icon: <BiCheckCircle className="text-green-500" />,
        time: '2 days ago',
        read: true
    }
]

const Notification = ({ isOpen, onClose }) => {
    // Mark all notifications as read
    const markAllAsRead = () => {
        // In a real app, you would update this in your state management or API call
        console.log("Marked all as read")
    }

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
                                onClick={markAllAsRead}
                                className="text-xs font-semibold text-blue-500 hover:text-blue-700 cursor-pointer"
                            >
                                Mark all as read
                            </button>
                        </div>
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                        {sampleNotifications.length > 0 ? (
                            sampleNotifications.map(notification => (
                                <div
                                    key={notification.id}
                                    className={`p-3 border-b border-border-primary dark:border-border-primary-dark hover:bg-gray-50 dark:hover:bg-zinc-700 cursor-pointer flex items-start ${!notification.read ? 'bg-blue-50 dark:bg-zinc-800' : ''
                                        }`}
                                >
                                    <div className="p-2 rounded-full mr-3">
                                        {notification.icon}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <p className="text-sm font-medium">{notification.title}</p>
                                            <span className="text-xs">{notification.time}</span>
                                        </div>
                                        <p className="text-xs mt-1">{notification.message}</p>
                                    </div>
                                    {!notification.read && (
                                        <span className="w-2 h-2 rounded-full bg-blue-500 mt-2 ml-2"></span>
                                    )}
                                </div>
                            ))
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

// Export a function to get unread count for the Navbar
export const getUnreadCount = () => {
    return sampleNotifications.filter(notification => !notification.read).length
}

export default Notification