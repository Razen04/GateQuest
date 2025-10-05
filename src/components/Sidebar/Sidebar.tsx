import React, { useState, type JSX } from 'react';
import { motion, type Variants } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    ChartPieSlice,
    BookOpen,
    Gear,
    Info,
    CaretLeft,
    DiscordLogo,
    GithubLogo,
    Coffee,
} from '@phosphor-icons/react';
import useWindowSize from '../../hooks/useWindowSize.js';
import appLogo from '/logo.png';
import MobileDock from './MobileDock.js';

type SidebarProp = {
    showSidebar: boolean;
    setShowSidebar: React.Dispatch<React.SetStateAction<boolean>>;
};

export type Tab = {
    id: number;
    name: string;
    icon: JSX.Element;
    activeIcon: JSX.Element;
    path: string;
    animation: Variants;
};

const Sidebar = ({ showSidebar, setShowSidebar }: SidebarProp) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isCollapsed, setIsCollapsed] = useState(false);

    const { width } = useWindowSize();

    const handleSidebarShow = (): void => {
        setIsCollapsed(!isCollapsed);
    };

    // Icon animations
    const iconAnimations = {
        dashboard: {
            inactive: { rotate: 0, scale: 1 },
            active: {
                rotate: -45,
                scale: 1.1,
                transition: { type: 'spring', stiffness: 300, damping: 15 },
            },
        },
        practice: {
            inactive: { rotateY: 0, transition: { duration: 0.3 } },
            active: {
                rotateY: 360,
                transition: { duration: 0.7, ease: 'easeInOut' },
            },
        },
        settings: {
            inactive: { rotate: 0, transition: { duration: 0.4 } },
            active: {
                rotate: 360,
                transition: { duration: 0.6, ease: 'linear' },
            },
        },
        about: {
            inactive: { rotateY: 0, transition: { duration: 0.3 } },
            active: {
                rotateY: 360,
                transition: { duration: 0.5, ease: 'easeInOut' },
            },
        },
    };

    // Tabs data
    const tabs = [
        {
            id: 1,
            name: 'Dashboard',
            icon: <ChartPieSlice weight="duotone" />,
            activeIcon: <ChartPieSlice weight="fill" />,
            path: '/dashboard',
            animation: iconAnimations.dashboard,
        },
        {
            id: 2,
            name: 'Practice',
            icon: <BookOpen size={20} weight="duotone" />,
            activeIcon: <BookOpen size={20} weight="fill" />,
            path: '/practice',
            animation: iconAnimations.practice,
        },
        {
            id: 3,
            name: 'Settings',
            icon: <Gear size={20} weight="duotone" />,
            activeIcon: <Gear size={20} weight="fill" />,
            path: '/settings',
            animation: iconAnimations.settings,
        },
        {
            id: 4,
            name: 'About',
            icon: <Info size={20} weight="duotone" />,
            activeIcon: <Info size={20} weight="fill" />,
            path: '/about',
            animation: iconAnimations.about,
        },
    ];

    // Handle tab click with navigation
    const handleTabClick = (path: string) => {
        navigate(path);
        if (showSidebar) {
            setShowSidebar(false);
        }
    };

    if (width === undefined) {
        return <div>Loading size...</div>;
    }

    // Mobile: bottom navbar, Desktop: sidebar
    const isMobile: boolean = width < 768;

    if (isMobile) {
        // Bottom dock for mobile
        return <MobileDock tabs={tabs} handleTabClick={handleTabClick} />;
    }

    // Desktop sidebar
    return (
        <motion.div
            className={`z-10 absolute h-[100dvh] lg:static lg:block border-r border-border-primary dark:border-border-primary-dark bg-gradient-to-b from-gray-50 to-white shadow-sm transition-colors duration-1000 overflow-x-hidden`}
            initial={{ x: '-100%' }}
            animate={{
                x: showSidebar || width >= 1024 ? 0 : '-100%',
                width: isCollapsed ? '5rem' : '16rem',
            }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 200, damping: 30 }}
        >
            <div className="flex flex-col h-full bg-primary dark:bg-primary-dark">
                {/* Branding */}
                <div className="py-8 border-b border-border-primary dark:border-border-primary-dark transition-colors duration-1000">
                    <motion.div
                        className="flex items-center justify-center text-2xl font-bold dark:text-white"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                    >
                        <img
                            src={appLogo}
                            alt="App logo"
                            className={`w-8 ${isCollapsed ? 'mr-0' : 'mr-3'} flex-shrink-0`}
                        />
                        <div className={`${isCollapsed ? 'hidden' : 'block'}`}>
                            <h1 className="bg-gradient-to-br from-blue-400 to-blue-600 bg-clip-text text-transparent">
                                GATE
                                <span className="text-black dark:text-white">Quest</span>
                            </h1>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-[-5px] text-right w-full">
                                Good Luck
                            </p>
                        </div>
                    </motion.div>
                </div>

                {/* Navigation */}
                <div className="flex-1 pt-6 overflow-y-auto scrollbar-hide">
                    <nav className="px-4">
                        {tabs.map((tab, index) => {
                            const isActive = location.pathname.startsWith(tab.path);
                            return (
                                <motion.button
                                    key={tab.id}
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                        delay: 0.1 * index,
                                        duration: 0.5,
                                    }}
                                    onClick={() => handleTabClick(tab.path)}
                                    className={`relative w-full z-10 flex items-center px-4 py-3 my-2 rounded-lg cursor-pointer group transition-all duration-300 ${
                                        isActive
                                            ? 'text-white'
                                            : `${isCollapsed ? '' : 'hover:bg-gray-200 dark:hover:bg-gray-700'} dark:text-white`
                                    } ${isCollapsed ? 'justify-center' : ''}`}
                                >
                                    <div
                                        className={`p-2 rounded-lg ${
                                            isActive
                                                ? `dark:bg-white/5`
                                                : 'bg-gray-100 group-hover:bg-gray-200 dark:bg-gray-700 dark:group-hover:bg-gray-700'
                                        }`}
                                    >
                                        <motion.div
                                            className={`text-lg ${
                                                isActive
                                                    ? 'text-white'
                                                    : 'text-text-primary dark:text-text-primary-dark'
                                            }`}
                                            variants={tab.animation}
                                            animate={isActive ? 'active' : 'inactive'}
                                        >
                                            {isActive ? tab.activeIcon : tab.icon}
                                        </motion.div>
                                    </div>
                                    <span
                                        className={`ml-3 text-base whitespace-nowrap transition-all duration-300 ${
                                            isActive
                                                ? 'font-bold'
                                                : 'text-gray-700 group-hover:text-gray-900 dark:text-gray-200 dark:group-hover:text-gray-200'
                                        } ${isCollapsed ? 'hidden' : ''}`}
                                    >
                                        {tab.name}
                                    </span>

                                    {isActive && (
                                        <motion.div
                                            layoutId="active-sidebar-tab"
                                            className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg -z-10"
                                            transition={{
                                                type: 'spring',
                                                stiffness: 300,
                                                damping: 30,
                                            }}
                                        />
                                    )}

                                    {isActive && !isCollapsed && (
                                        <motion.div
                                            className="absolute right-4"
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <div className="w-2 h-2 rounded-full bg-white"></div>
                                        </motion.div>
                                    )}
                                </motion.button>
                            );
                        })}
                    </nav>
                </div>

                <div className="mt-auto p-4 border-t border-border-primary dark:border-border-primary-dark">
                    <div
                        className={`flex items-center transition-all duration-300 ${isCollapsed ? 'flex-col gap-4' : 'justify-between'}`}
                    >
                        {/* Social links */}
                        <div
                            className={`flex items-center ${isCollapsed ? 'flex-col gap-4' : 'space-x-2'}`}
                        >
                            <button
                                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-white"
                                aria-label="Join our Discord"
                            >
                                <a
                                    href="https://discord.gg/dFmg3g52c5"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <DiscordLogo size={20} />
                                </a>
                            </button>
                            <button
                                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-white"
                                aria-label="Github"
                            >
                                <a
                                    href="https://github.com/Razen04/GateQuest"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <GithubLogo size={20} />
                                </a>
                            </button>
                            <button
                                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-white"
                                aria-label="Support Me"
                            >
                                <a
                                    href="https://buymeachai.ezee.li/Razen"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Coffee size={20} />
                                </a>
                            </button>
                        </div>

                        {/* Collapse button */}
                        <motion.button
                            animate={{ rotate: isCollapsed ? 180 : 0 }}
                            transition={{ duration: 0.3 }}
                            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-white"
                            onClick={handleSidebarShow}
                        >
                            <CaretLeft size={20} />
                        </motion.button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default Sidebar;
