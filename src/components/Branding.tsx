import { GithubLogoIcon, CoffeeIcon } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Branding = ({ className = '' }) => {
    const navigate = useNavigate();

    return (
        <div
            className={`flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm ${className}`}
        >
            {/* Text */}
            <span className="text-sm font-medium text-center text-gray-700 dark:text-gray-200">
                Enjoying the app? Show some love ❤️! Share it as much as possible.
            </span>

            {/* Actions */}
            <div className="flex items-center gap-3">
                {/* GitHub */}
                <motion.a
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    href="https://github.com/Razen04/GATEQuest"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gray-900 text-white hover:bg-gray-800 transition-colors shadow-sm"
                >
                    <GithubLogoIcon size={16} />
                    <span className="text-xs md:text-lg">Star on GitHub</span>
                </motion.a>

                {/* Donate */}
                <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/donate')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-green-600 text-white hover:bg-green-500 transition-colors shadow-sm"
                >
                    <CoffeeIcon size={16} />
                    <span className="text-xs md:text-lg">Buy Me a Chai</span>
                </motion.button>
            </div>
        </div>
    );
};

export default Branding;
