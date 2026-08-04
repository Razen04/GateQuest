import { AnimatePresence, motion } from 'framer-motion';
import type React from 'react';
import { useEffect, useRef } from 'react';
import { cn } from '../utils/cn';

export interface TabItem {
    id: string;
    label: string;
    icon?: React.ReactNode;
    activeIcon?: React.ReactNode;
    badge?: string | number;
}

interface AnimatedTabsProps {
    tabs: TabItem[];
    activeTab: string;
    onChange: (id: string) => void;
    className?: string;
}

const AnimatedTabs: React.FC<AnimatedTabsProps> = ({
    tabs,
    activeTab,
    onChange,
    className,
}) => {
    const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

    useEffect(() => {
        tabRefs.current[activeTab]?.scrollIntoView({
            behavior: 'smooth',
            inline: 'center',
            block: 'nearest',
        });
    }, [activeTab]);

    return (
        <div
            className={cn(
                'relative w-full overflow-hidden no-scrollbar p-1',
                className
            )}
        >
            <nav className="relative border border-slate-900/10 bg-slate-950/5 p-1.5 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/40 dark:shadow-[0_8px_32px_rgba(0,0,0,0.36)]">
                <div className="relative flex items-center gap-1.5 overflow-x-auto">
                    {tabs.map((tab) => {
                        const isActive = tab.id === activeTab;
                        const iconToDisplay = isActive
                            ? (tab.activeIcon ?? tab.icon)
                            : tab.icon;

                        return (
                            <motion.button
                                key={tab.id}
                                ref={(el) => {
                                    tabRefs.current[tab.id] = el;
                                }}
                                onClick={() => onChange(tab.id)}
                                whileTap={{ scale: 0.96 }}
                                className={cn(
                                    'group relative z-10 flex shrink-0 items-center gap-2.5 px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors duration-200 outline-none select-none',
                                    'font-["Space_Grotesk",sans-serif]',
                                    isActive
                                        ? 'text-slate-900 dark:text-white'
                                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                                )}
                            >
                                {/* Animated Icon Wrapper */}
                                {iconToDisplay && (
                                    <span className="relative z-10 flex items-center justify-center">
                                        <AnimatePresence
                                            mode="wait"
                                            initial={false}
                                        >
                                            <motion.span
                                                key={
                                                    isActive
                                                        ? `${tab.id}-active`
                                                        : `${tab.id}-inactive`
                                                }
                                                initial={{
                                                    opacity: 0,
                                                    scale: 0.8,
                                                    rotate: -10,
                                                }}
                                                animate={{
                                                    opacity: 1,
                                                    scale: 1,
                                                    rotate: 0,
                                                }}
                                                exit={{
                                                    opacity: 0,
                                                    scale: 0.8,
                                                    rotate: 10,
                                                }}
                                                transition={{ duration: 0.15 }}
                                                className={cn(
                                                    'transition-colors duration-200',
                                                    isActive
                                                        ? 'text-[#2A5CFF] dark:text-blue-400'
                                                        : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300'
                                                )}
                                            >
                                                {iconToDisplay}
                                            </motion.span>
                                        </AnimatePresence>
                                    </span>
                                )}

                                {/* Label */}
                                <span className="relative z-10">
                                    {tab.label}
                                </span>

                                {/* Optional Badge */}
                                {tab.badge !== undefined && (
                                    <span
                                        className={cn(
                                            'relative z-10 px-2 py-0.5 font-["JetBrains_Mono",monospace] text-[10px] font-bold transition-colors',
                                            isActive
                                                ? 'bg-[#2A5CFF]/15 text-[#2A5CFF] dark:bg-blue-400/20 dark:text-blue-300'
                                                : 'bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-slate-400'
                                        )}
                                    >
                                        {tab.badge}
                                    </span>
                                )}

                                {/* Active Glass Floating Pill */}
                                {isActive && (
                                    <motion.div
                                        layoutId="active-nav-pill"
                                        transition={{
                                            type: 'spring',
                                            stiffness: 400,
                                            damping: 30,
                                            mass: 0.8,
                                        }}
                                        className="absolute inset-0 -z-10 border border-slate-900/10 bg-white shadow-md dark:border-white/20 dark:bg-white/10 dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
                                    >
                                        {/* Subtle Top Inner Edge Highlight */}
                                        <div className="absolute inset-x-2 top-0 h-[1px] bg-gradient-to-r from-transparent via-slate-900/20 to-transparent dark:via-white/40" />

                                        {/* Blue Ambient Underglow */}
                                        <div className="absolute inset-0 -z-10 bg-[#2A5CFF]/10 blur-md dark:bg-blue-500/20" />
                                    </motion.div>
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
