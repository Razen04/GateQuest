import { GithubLogoIcon, CoffeeIcon } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Branding = ({ className = '' }) => {
    const navigate = useNavigate();

    return (
        <div
            className={`relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl p-3 border border-white/20 bg-white/20 backdrop-blur-xl backdrop-saturate-150 shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:border-white/10 dark:bg-white/[0.06] ${className}`}
        >
            {/* Glass highlight */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/20 to-transparent dark:from-white/5" />

            {/* Text */}
            <span className="relative text-sm font-medium text-center text-gray-700 dark:text-gray-200">
                Enjoying the app? Show some love. Share it as much as possible.
            </span>

            {/* Actions */}
            <div className="relative flex items-center gap-2">
                {/* GitHub */}
                <motion.a
                    whileHover={{ scale: 1.04, y: -1 }}
                    whileTap={{ scale: 0.96 }}
                    href="https://github.com/Razen04/GATEQuest"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium border border-white/20 bg-black/10 backdrop-blur-md text-foreground shadow-sm hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 transition-colors"
                >
                    <GithubLogoIcon size={16} />
                    <span>Star on GitHub</span>
                </motion.a>

                {/* Donate */}
                <motion.button
                    whileHover={{ scale: 1.04, y: -1 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => navigate('/donate')}
                    className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium border border-emerald-400/20 bg-emerald-500/10 backdrop-blur-md text-emerald-600 dark:text-emerald-400 shadow-sm hover:bg-emerald-500/20 transition-colors"
                >
                    <CoffeeIcon size={16} />
                    <span>Buy Me a Chai</span>
                </motion.button>
            </div>
        </div>
    );
};

export default Branding;
