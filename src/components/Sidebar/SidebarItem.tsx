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
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                delay: 0.1 * index,
                duration: 0.5,
            }}
            onClick={onClick}
            className={`relative w-full z-10 flex items-center px-4 py-3 my-2 cursor-pointer group transition-all duration-300 ${
                isActive
                    ? 'text-white'
                    : `${isCollapsed ? '' : 'hover:bg-gray-200 dark:hover:bg-gray-700'} dark:text-white`
            } ${isCollapsed ? 'justify-center' : ''}`}
        >
            <div
                className={`p-2 ${
                    isActive
                        ? `dark:bg-white/5`
                        : 'bg-gray-100 group-hover:bg-gray-200 dark:bg-gray-700 dark:group-hover:bg-gray-700'
                }`}
            >
                <motion.div
                    className={`text-lg ${
                        isActive ? 'text-white' : 'text-text-primary dark:text-text-primary-dark'
                    }`}
                    variants={animation}
                    animate={isActive ? 'active' : 'inactive'}
                >
                    {isActive ? activeIcon : icon}
                </motion.div>
            </div>
            <span
                className={`ml-3 text-base whitespace-nowrap transition-all duration-300 ${
                    isActive
                        ? 'font-bold'
                        : 'text-gray-700 group-hover:text-gray-900 dark:text-gray-200 dark:group-hover:text-gray-200'
                } ${isCollapsed ? 'hidden' : ''}`}
            >
                {name}
            </span>

            {isActive && (
                <motion.div
                    layoutId="active-sidebar-tab"
                    className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-500 to-blue-600"
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
                    <div className="w-2 h-2 bg-white"></div>
                </motion.div>
            )}
        </motion.button>
    );
};
