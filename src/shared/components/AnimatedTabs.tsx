import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useRef } from 'react';
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
                'relative w-full overflow-hidden p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
                className
            )}
        >
            <nav
                className="
                relative border border-border
                bg-muted/70
                p-1.5
                backdrop-blur-2xl
                shadow-sm
            "
            >
                <div
                    className="
                    relative flex items-center gap-1.5
                    overflow-x-auto
                    [scrollbar-width:none]
                    [&::-webkit-scrollbar]:hidden
                "
                >
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
                                    `
                                        group relative z-10
                                        flex shrink-0 items-center gap-2.5
                                        px-4 py-2.5
                                        text-xs font-bold uppercase
                                        tracking-wider
                                        font-display
                                        outline-none select-none
                                        transition-colors duration-200
                                        focus-visible:ring-2
                                        focus-visible:ring-ring
                                    `,
                                    isActive
                                        ? 'text-primary'
                                        : 'text-muted-foreground hover:text-foreground'
                                )}
                            >
                                {/* Animated Icon */}
                                {iconToDisplay && (
                                    <span
                                        className="
                                        relative z-10
                                        flex items-center justify-center
                                    "
                                    >
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
                                                transition={{
                                                    duration: 0.15,
                                                }}
                                                className={cn(
                                                    'transition-colors duration-200',
                                                    isActive
                                                        ? 'text-primary'
                                                        : 'text-muted-foreground group-hover:text-foreground'
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
                                            `
                                                relative z-10
                                                border border-border
                                                px-2 py-0.5
                                                font-mono text-[10px]
                                                font-bold
                                                transition-colors
                                            `,
                                            isActive
                                                ? 'border-primary/20 bg-primary/10 text-primary'
                                                : 'bg-secondary text-muted-foreground'
                                        )}
                                    >
                                        {tab.badge}
                                    </span>
                                )}

                                {/* Active Glass Indicator */}
                                {isActive && (
                                    <motion.div
                                        layoutId="active-nav-pill"
                                        transition={{
                                            type: 'spring',
                                            stiffness: 400,
                                            damping: 30,
                                            mass: 0.8,
                                        }}
                                        className="
                                            absolute inset-0 -z-10
                                            border border-primary/20
                                            bg-card
                                            shadow-sm
                                            backdrop-blur-xl
                                        "
                                    >
                                        {/* Top Highlight */}
                                        <div
                                            className="
                                            absolute inset-x-2 top-0
                                            h-px
                                            bg-gradient-to-r
                                            from-transparent
                                            via-primary/30
                                            to-transparent
                                        "
                                        />

                                        {/* Ambient Glow */}
                                        <div
                                            className="
                                            absolute inset-0 -z-10
                                            bg-primary/10
                                            blur-md
                                        "
                                        />
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
