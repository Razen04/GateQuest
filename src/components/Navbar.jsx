import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BiBell, BiSolidBell } from 'react-icons/bi'
import Notification from './Notification'

const Navbar = () => {
    const [showNotifications, setShowNotifications] = useState(false)
    const [unreadNotifications, setUnreadNotifications] = useState(false)
    const notificationRef = useRef(null)

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
            className='py-4 px-6 flex justify-between items-center border-b bg-primary dark:bg-primary-dark border-border-primary dark:border-border-primary-dark text-text-primary dark:text-text-primary-dark'
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
        >

            <div className='flex lg:block w-full'>
                <h1 className='text-center text-2xl font-bold'><span className='bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>GATE</span>Quest</h1>
            </div>

            {/* Notification */}
            <motion.div
                className="personal-details flex items-end"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
            >
                <button className="relative" ref={notificationRef} aria-label='Notifications'>
                    <motion.div
                        className="relative cursor-pointer"
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
                    <Notification
                        isOpen={showNotifications}
                        onClose={() => setShowNotifications(false)}
                        setUnreadNotifications={setUnreadNotifications}
                    />

                </button>
            </motion.div>
        </motion.div>
    )
}

export default Navbar