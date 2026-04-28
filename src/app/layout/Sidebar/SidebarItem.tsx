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
            className={`relative w-full z-10 flex items-center px-4 py-3 my-2 cursor-pointer group transition-all duration-300 rounded-xl ${
                isActive
                    ? 'text-white'
                    : `${isCollapsed ? '' : 'hover:bg-gray-200 dark:hover:bg-gray-700'} dark:text-white`
            } ${isCollapsed ? 'justify-center' : ''}`}
        >
            <div
                className={`p-2 rounded-lg ${
                    isActive
                        ? `bg-gradient-to-br from-blue-500 to-blue-600`
                        : 'bg-gray-100 group-hover:bg-gray-200 dark:bg-gray-700 dark:group-hover:bg-gray-700'
                }`}
            >
                <motion.div
                    className={`text-lg rounded-xl ${
                        isActive ? 'text-white' : 'text-text-primary dark:text-text-primary-dark'
                    }`}
                    variants={animation}
                    animate={isActive ? 'active' : 'inactive'}
                >
                    {isActive ? activeIcon : icon}
                </motion.div>
            </div>
            <span
                className={`ml-3 text-base whitespace-nowrap transition-all duration-300 rounded-xl ${
                    isActive
                        ? 'font-bold'
                        : 'text-gray-700 group-hover:text-gray-900 dark:text-gray-200 dark:group-hover:text-gray-200'
                } ${isCollapsed ? 'hidden' : ''}`}
            >
                {name}
            </span>

            {isActive && !isCollapsed && (
                <motion.div
                    layoutId="active-sidebar-tab"
                    className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl"
                    transition={{
                        type: 'spring',
                        stiffness: 300,
                        damping: 30,
                    }}
                />
            )}
        </motion.button>
    );
};
