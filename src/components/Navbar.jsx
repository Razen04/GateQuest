import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BiBell, BiSearch, BiSolidBell } from 'react-icons/bi'
import Notification from './Notification'
import { getUserProfile } from '../helper'

const Navbar = () => {
    const [showSearchInput, setShowSearchInput] = useState(false)
    const [showNotifications, setShowNotifications] = useState(false)
    const [unreadNotifications, setUnreadNotifications] = useState(false)
    const notificationRef = useRef(null)

    const profile = getUserProfile();

    // Handle click outside notification panel to close it
    useEffect(() => {
        function handleClickOutside(event) {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [])

    return (
        <motion.div
            className='py-4 px-8 flex justify-between items-center border-b bg-primary dark:bg-primary-dark border-border-primary dark:border-border-primary-dark text-text-primary dark:text-text-primary-dark'
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
        >

            {/* Middle Section with Search */}
            <motion.div
                className="hidden md:flex items-center flex-1"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.4 }}
            >
                <div className="relative w-full max-w-md">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <BiSearch className="w-5 h-5" />
                    </div>
                    <input
                        type="text"
                        className="w-full py-2 pl-10 pr-4 text-sm bg-primary dark:bg-primary-dark border border-border-primary dark:border-border-primary-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Search resources, topics, etc."
                    />
                </div>
            </motion.div>

            {/* User Profile Section with Notification */}
            <motion.div
                className="personal-details flex items-center"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
            >
                <div className="relative" ref={notificationRef}>
                    <motion.div
                        className="relative mr-6 cursor-pointer"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowNotifications(!showNotifications)}
                    >
                        {showNotifications ? (<BiSolidBell className="w-6 h-6" />) : (<BiBell className="w-6 h-6" />)}
                        {unreadNotifications && (
                            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
                        )}
                    </motion.div>

                    {/* Notifications Panel */}
                    <div className='z-10'>
                        <Notification
                            isOpen={showNotifications}
                            onClose={() => setShowNotifications(false)}
                            setUnreadNotifications={setUnreadNotifications}
                        />
                    </div>

                </div>

                <div className="flex items-center">
                    <motion.div
                        className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 p-0.5 mr-3"
                        whileHover={{ scale: 1.05 }}
                    >
                        <img
                            src={profile?.avatar}
                            alt="User"
                            className="w-full h-full object-cover rounded-full bg-white p-0.5"
                        />
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.7 }}
                    >
                        <h2 className='text-base font-medium text-inherit'>{profile?.name}</h2>
                        <p className='text-xs text-gray-500 dark:text-gray-400'>GATE {profile?.targetYear} CS</p>
                    </motion.div>
                </div>
            </motion.div>
        </motion.div>
    )
}

export default Navbar