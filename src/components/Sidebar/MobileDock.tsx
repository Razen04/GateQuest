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
        <nav className="fixed mx-4 rounded-xl bottom-2 left-0 right-0 bg-white/50 dark:bg-zinc-800/50 backdrop-blur-xl z-20 flex justify-around items-center py-2 shadow-lg lg:hidden">
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
                            className={`relative text-xl mb-0.5 px-3 py-0.5 inline-block ${isActive ? 'text-blue-500 dark:text-blue-300' : 'text-gray-400 dark:text-gray-500'}`}
                        >
                            <motion.div
                                variants={tab.animation}
                                animate={isActive ? 'active' : 'inactive'}
                            >
                                {IconComponent}
                            </motion.div>
                        </span>
                    </motion.button>
                );
            })}
        </nav>
    );
};

export default MobileDock;
