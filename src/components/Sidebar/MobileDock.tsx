import React from 'react';
import { motion } from 'framer-motion';
import type { Tab } from './Sidebar.js';
import { useLocation } from 'react-router-dom';

type MobileDockProp = {
    tabs: Tab[];
    handleTabClick: (path: string) => void;
};

const MobileDock = ({ tabs, handleTabClick }: MobileDockProp) => {
    const location = useLocation();

    return (
        <nav className="fixed h-16 bottom-0 left-0 right-0 z-20 bg-white dark:bg-primary-dark border-t border-border-primary dark:border-border-primary-dark flex justify-around items-center py-2 shadow-lg lg:hidden">
            {tabs.map((tab: Tab) => {
                const isActive = location.pathname.startsWith(tab.path);
                const IconComponent = isActive ? tab.activeIcon : tab.icon;
                return (
                    <motion.button
                        key={tab.id}
                        onClick={() => handleTabClick(tab.path)}
                        className={`flex z-10 flex-col items-center justify-center px-2 py-1 focus:outline-none transition-all font-semibold`}
                    >
                        <span
                            className={`relative text-xl mb-0.5 px-3 py-0.5 inline-block ${isActive ? 'text-white rounded-2xl' : 'text-black dark:text-white'}`}
                        >
                            <motion.div
                                variants={tab.animation}
                                animate={isActive ? 'active' : 'inactive'}
                            >
                                {IconComponent}
                            </motion.div>
                            {isActive && (
                                <motion.div
                                    layoutId="active-sidebar-tab"
                                    className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl -z-10"
                                    transition={{
                                        type: 'spring',
                                        stiffness: 300,
                                        damping: 30,
                                    }}
                                />
                            )}
                        </span>
                        <span
                            className={`text-xs ${isActive ? 'text-blue-500' : 'text-black dark:text-white'}`}
                        >
                            {tab.name}
                        </span>
                    </motion.button>
                );
            })}
        </nav>
    );
};

export default MobileDock;
