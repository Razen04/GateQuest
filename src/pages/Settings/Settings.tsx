import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { User, ShieldCheck, Faders } from '@phosphor-icons/react';

import Login from '../../components/Login.jsx';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    containerVariants,
    itemVariants,
    navItemVariants,
    stagger,
} from '../../utils/motionVariants.ts';
import useAuth from '../../hooks/useAuth.ts';

const Settings = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const activeTab: string = location.pathname.split('/')[2] || 'account';
    const { showLogin, setShowLogin } = useAuth();

    // Tab Reference
    const tabRefs = useRef<Record<string, HTMLButtonElement>>({});

    // This brings the active tab in view
    useEffect(() => {
        const activeEl = tabRefs.current[activeTab];
        if (activeEl) {
            activeEl.scrollIntoView({
                behavior: 'smooth',
                inline: 'center',
                block: 'nearest',
            });
        }
    }, [activeTab]);

    // Tabs
    const tabs = [
        {
            id: 'account',
            label: 'Account',
            icon: <User size={20} weight="duotone" />,
            activeIcon: <User size={20} weight="fill" />,
        },
        {
            id: 'privacy',
            label: 'Privacy & Data',
            icon: <ShieldCheck size={20} weight="duotone" />,
            activeIcon: <ShieldCheck size={20} weight="fill" />,
        },
        {
            id: 'app-settings',
            label: 'App Settings',
            icon: <Faders size={20} weight="duotone" />,
            activeIcon: <Faders size={20} weight="fill" />,
        },
    ];

    return (
        <div className="relative pb-10">
            {showLogin && (
                <div className="w-full h-screen flex z-50 items-center justify-center bg-transparent bg-opacity-30">
                    <Login onClose={() => setShowLogin(false)} />
                </div>
            )}
            <div
                className={`p-6 min-h-[100dvh] transition-colors duration-500 bg-primary dark:bg-primary-dark text-text-primary dark:text-text-primary-dark ${showLogin ? 'blur-2xl' : ''}`}
            >
                {/* Header Section */}
                <motion.div
                    initial="initial"
                    animate="animate"
                    variants={containerVariants}
                    className="mb-8"
                >
                    <h1 className="text-3xl font-bold">
                        <span className="bg-gradient-to-br from-blue-400 to-blue-600 bg-clip-text text-transparent">
                            Settings
                        </span>{' '}
                        & Preferences
                    </h1>
                    <p>Customize your GATE preparation experience</p>
                </motion.div>

                {/* Settings Tabs Navigation */}
                <div className="mb-8 overflow-x-auto">
                    <motion.nav
                        initial="initial"
                        animate="animate"
                        variants={stagger}
                        className="relative flex sm:flex-nowrap gap-2 min-w-0 shadow-xs rounded-xl p-1"
                    >
                        {tabs.map((tab) => {
                            const isActive = activeTab === tab.id;
                            return (
                                <motion.button
                                    initial="initial"
                                    animate="animate"
                                    variants={navItemVariants}
                                    key={tab.id}
                                    ref={(el: HTMLButtonElement | null) => {
                                        if (el) tabRefs.current[tab.id] = el;
                                    }}
                                    onClick={() => navigate(tab.id)}
                                    className={`relative flex cursor-pointer items-center px-4 py-2 sm:py-3 rounded-lg transition-colors duration-300 whitespace-nowrap text-sm sm:text-base z-10 ${
                                        isActive
                                            ? 'text-white'
                                            : 'hover:bg-gray-100/50 dark:hover:bg-gray-700/50 text-text-primary dark:text-text-primary-dark'
                                    }`}
                                >
                                    <span className="mr-2">
                                        {isActive ? tab.activeIcon : tab.icon}
                                    </span>
                                    <span className="font-medium">{tab.label}</span>
                                    {isActive && (
                                        <motion.div
                                            layoutId="active-settings-tab"
                                            className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg -z-10"
                                            transition={{
                                                type: 'spring',
                                                stiffness: 300,
                                                damping: 30,
                                            }}
                                        />
                                    )}
                                </motion.button>
                            );
                        })}
                    </motion.nav>
                </div>

                {/* Content Area */}
                <motion.div
                    initial="initial"
                    animate="animate"
                    variants={itemVariants}
                    className="overflow-y-scroll h-[60vh] pb-20"
                >
                    <Outlet />
                </motion.div>
            </div>
        </div>
    );
};

export default Settings;
