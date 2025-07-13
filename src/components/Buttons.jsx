import { motion } from "framer-motion";
import clsx from "clsx";

const Buttons = ({ children, onClick, className = "", ...props }) => {
    return (
        <motion.button
            onClick={onClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300 }}
            className={clsx(
                `${props.active ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' : 'border border-blue-500'}`,
                "py-2 px-4 sm:px-6 rounded-xl shadow-md font-semibold cursor-pointer text-sm sm:text-base",
                "hover:shadow-lg hover:brightness-110",
                "focus:outline-none focus:ring-2 focus:ring-purple-400",
                "transition duration-200 ease-in-out",
                className
            )}
            {...props}
        >
            {children}
        </motion.button>
    );
};

export default Buttons;