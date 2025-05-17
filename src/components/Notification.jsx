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
                    className="absolute right-0 mt-3 w-80 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50"
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                >
                    <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-blue-50 to-purple-50">
                        <h3 className="font-medium text-gray-800">Notifications</h3>
                        <div className="flex space-x-2">
                            <button
                                onClick={markAllAsRead}
                                className="text-xs text-blue-600 hover:text-blue-800"
                            >
                                Mark all as read
                            </button>
                            <button
                                onClick={onClose}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <BiX className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                        {sampleNotifications.length > 0 ? (
                            sampleNotifications.map(notification => (
                                <div
                                    key={notification.id}
                                    className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer flex items-start ${!notification.read ? 'bg-blue-50' : ''
                                        }`}
                                >
                                    <div className="p-2 rounded-full bg-gray-100 mr-3">
                                        {notification.icon}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <p className="text-sm font-medium text-gray-800">{notification.title}</p>
                                            <span className="text-xs text-gray-500">{notification.time}</span>
                                        </div>
                                        <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                                    </div>
                                    {!notification.read && (
                                        <span className="w-2 h-2 rounded-full bg-blue-500 mt-2 ml-2"></span>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="py-8 text-center">
                                <p className="text-gray-500">No notifications yet</p>
                            </div>
                        )}
                    </div>

                    <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-center">
                        <button className="text-sm text-gray-600 hover:text-blue-600">
                            View all notifications
                        </button>
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