import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import React, { useEffect, useRef } from 'react';

interface TabItem {
    id: string;
    label: string;
    icon?: React.ReactNode;
    activeIcon?: React.ReactNode;
}

interface AnimatedTabsProps {
    tabs: TabItem[];
    activeTab: string;
    onChange: (id: string) => void;
}

const AnimatedTabs: React.FC<AnimatedTabsProps> = ({ tabs, activeTab, onChange }) => {
    const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

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

    return (
        <div className="overflow-x-auto">
            <nav className="relative flex sm:flex-nowrap gap-2 min-w-0 shadow-xs p-1">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;

                    return (
                        <button
                            key={tab.id}
                            ref={(el) => {
                                tabRefs.current[tab.id] = el;
                            }}
                            onClick={() => onChange(tab.id)}
                            className={cn(
                                'relative flex cursor-pointer items-center px-4 py-2 sm:py-3 transition-colors duration-300 whitespace-nowrap text-sm sm:text-base z-10 font-medium',
                                isActive
                                    ? 'text-white'
                                    : 'text-foreground hover:bg-muted/50 dark:hover:bg-muted/60',
                            )}
                        >
                            {tab.icon && (
                                <span className="mr-2">
                                    {isActive ? tab.activeIcon || tab.icon : tab.icon}
                                </span>
                            )}

                            {tab.label}

                            {isActive && (
                                <motion.div
                                    layoutId="animated-tab-highlight"
                                    className="absolute rounded-lg inset-0 bg-gradient-to-br from-blue-500 to-blue-600 -z-10"
                                    transition={{
                                        type: 'spring',
                                        stiffness: 300,
                                        damping: 30,
                                    }}
                                />
                            )}
                        </button>
                    );
                })}
            </nav>
        </div>
    );
};

export default AnimatedTabs;
