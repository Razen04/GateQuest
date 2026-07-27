import { motion, type Variants } from 'framer-motion';
import type { JSX } from 'react/jsx-runtime';

type SidebarItemProps = {
    index: number;
    name: string;
    icon: JSX.Element;
    activeIcon: JSX.Element;
    isActive: boolean;
    isCollapsed: boolean;
    onClick: () => void;
    animation: Variants;
};

const spring = {
    type: 'spring' as const,
    stiffness: 380,
    damping: 32,
};

export const SidebarItem = ({
    index,
    name,
    icon,
    activeIcon,
    isActive,
    isCollapsed,
    onClick,
    animation,
}: SidebarItemProps) => {
    return (
        <motion.button
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06, duration: 0.35 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={`relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition-colors duration-200 ${isCollapsed ? 'justify-center' : ''} ${isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
            {isActive && !isCollapsed && (
                <motion.div
                    layoutId="active-sidebar-tab"
                    transition={spring}
                    className="absolute inset-0 rounded-xl -z-10 bg-white/35 dark:bg-white/10 backdrop-blur-2xl border border-white/20 shadow-[0_4px_16px_rgba(0,0,0,0.08)] before:absolute before:inset-[1px] before:rounded-[11px] before:bg-gradient-to-b before:from-white/30 before:to-transparent before:pointer-events-none"
                />
            )}

            <div
                className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all duration-200 ${isActive ? 'bg-white/30 dark:bg-white/10 border border-white/15' : 'bg-black/5 dark:bg-white/5 group-hover:bg-black/8 dark:group-hover:bg-white/8'}`}
            >
                <motion.div
                    variants={animation}
                    animate={isActive ? 'active' : 'inactive'}
                    transition={{ duration: 0.2 }}
                    className={`flex items-center justify-center text-lg ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}
                >
                    {isActive ? activeIcon : icon}
                </motion.div>
            </div>

            {!isCollapsed && (
                <span
                    className={`truncate text-sm font-medium transition-colors duration-200 ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}
                >
                    {name}
                </span>
            )}
        </motion.button>
    );
};
