import { motion } from 'framer-motion';
import React, { useEffect, useRef } from 'react';
import { cn } from '../utils/cn';

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

    useEffect(() => {
        tabRefs.current[activeTab]?.scrollIntoView({
            behavior: 'smooth',
            inline: 'center',
            block: 'nearest',
        });
    }, [activeTab]);

    return (
        <div className="md:max-w-fit max-w-full overflow-hidden">
            <nav className="relative rounded-2xl bg-white/10 dark:bg-white/5 backdrop-blur-xl border border-white/15 shadow-[0_8px_30px_rgba(0,0,0,0.12)] before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-b before:from-white/20 before:to-transparent before:pointer-events-none">
                <div className="relative flex max-w-full overflow-x-auto no-scrollbar gap-1 p-1.5">
                    {tabs.map((tab) => {
                        const isActive = tab.id === activeTab;

                        return (
                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                whileHover={{ scale: 1.02 }}
                                key={tab.id}
                                ref={(el) => {
                                    tabRefs.current[tab.id] = el;
                                }}
                                onClick={() => onChange(tab.id)}
                                className={cn(
                                    'relative z-10 flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors duration-300',
                                    isActive
                                        ? 'text-foreground'
                                        : 'text-muted-foreground hover:text-foreground',
                                )}
                            >
                                {tab.icon && (
                                    <span className="relative z-10">
                                        {isActive ? (tab.activeIcon ?? tab.icon) : tab.icon}
                                    </span>
                                )}

                                <span className="relative z-10">{tab.label}</span>

                                {isActive && (
                                    <motion.div
                                        layoutId="glass-tab"
                                        transition={{ type: 'spring', stiffness: 350, damping: 32 }}
                                        className="absolute inset-0 -z-10 rounded-xl bg-white/35 dark:bg-white/10 backdrop-blur-2xl border border-white/30 shadow-[0_4px_20px_rgba(255,255,255,0.12),0_8px_24px_rgba(0,0,0,0.18)] before:absolute before:inset-[1px] before:rounded-[11px] before:bg-gradient-to-b before:from-white/40 before:to-white/5 before:pointer-events-none"
                                    />
                                )}
                            </motion.button>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
};

export default AnimatedTabs;
