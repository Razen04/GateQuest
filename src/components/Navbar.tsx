import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Notification } from '@phosphor-icons/react';
import NotificationDialog from './NotificationDialog.js';
import useWindowSize from '../hooks/useWindowSize.ts';
import { Coffee, DiscordLogo, GithubLogo } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadNotifications, setUnreadNotifications] = useState(false);
    const notificationRef = useRef<HTMLDivElement | null>(null);

    const { width } = useWindowSize();

    const navigate = useNavigate();

    // Handle click outside notification panel to close it
    const handleClickOutside = useCallback((event: MouseEvent) => {
        if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
            setShowNotifications(false);
        }
    }, []);

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [handleClickOutside]);

    if (width === undefined) {
        return <div>Loading size...</div>;
    }
    // Mobile: bottom navbar, Desktop: sidebar
    const isMobile: boolean = width < 768;

    return (
        <motion.div
            className="py-4 px-6 flex justify-between items-center border-b border-border-primary dark:border-border-primary-dark text-text-primary dark:text-text-primary-dark"
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
        >
            <div className="flex lg:block w-full">
                <h1 className="text-center text-md md:text-2xl">
                    <span className="bg-gradient-to-br from-blue-400 to-blue-600 bg-clip-text text-transparent">
                        GATE
                    </span>
                    Quest
                </h1>
            </div>

            {/* Right section (Notification) */}
            <div className="flex-1 flex justify-end">
                <motion.div
                    className="relative flex gap-5 items-end"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    ref={notificationRef}
                >
                    {isMobile && (
                        <motion.button
                            aria-label="Join our Discord"
                            className="cursor-pointer"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <a
                                href="https://discord.gg/dFmg3g52c5"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <DiscordLogo size={20} />
                            </a>
                        </motion.button>
                    )}
                    {isMobile && (
                        <motion.button
                            aria-label="Github"
                            className="cursor-pointer"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <a
                                href="https://github.com/Razen04/GateQuest"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <GithubLogo size={20} />
                            </a>
                        </motion.button>
                    )}

                    {isMobile && (
                        <motion.button
                            aria-label="Support Me"
                            className="relative cursor-pointer border-b border-green-500"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/donate')}
                        >
                            <Coffee size={20} />
                        </motion.button>
                    )}
                    <motion.button
                        aria-label="Notifications"
                        className="cursor-pointer"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowNotifications(!showNotifications)}
                    >
                        {showNotifications ? (
                            <Notification size={20} weight="fill" />
                        ) : (
                            <Notification size={20} weight="duotone" />
                        )}
                        {unreadNotifications && (
                            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
                        )}
                    </motion.button>
                    {/* Notifications Panel */}
                    <NotificationDialog
                        isOpen={showNotifications}
                        setUnreadNotifications={setUnreadNotifications}
                    />
                </motion.div>
            </div>
        </motion.div>
    );
};

export default Navbar;
