import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import clsx from 'clsx';

type ButtonProps = {
    children: React.ReactNode;
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
    className?: string;
    active: boolean;
} & HTMLMotionProps<'button'>;

const Buttons = ({ children, onClick, className = '', active, ...props }: ButtonProps) => {
    return (
        <motion.button
            onClick={onClick}
            whileHover={{ scale: 1 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, duration: 0.3 }}
            className={clsx(
                `${active ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white' : 'border border-blue-500'}`,
                'py-2 px-4 sm:px-6 rounded-xl shadow-md font-semibold cursor-pointer text-sm sm:text-base',
                'hover:shadow-lg hover:brightness-110',
                'focus:outline-none focus:ring-2 focus:ring-blue-400',
                className,
            )}
            {...props}
        >
            {children}
        </motion.button>
    );
};

export default Buttons;
