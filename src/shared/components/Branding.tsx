import { CoffeeIcon, GithubLogoIcon } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const Branding = ({ className = '' }) => {
    const navigate = useNavigate();

    return (
        <div
            className={`
                relative isolate overflow-hidden
                flex flex-col sm:flex-row
                items-center justify-between gap-3
                border border-border
                bg-card/70
                backdrop-blur-2xl backdrop-saturate-150
                shadow-sm
                p-3 font-['Manrope']
                ${className}
            `}
        >
            {/* Glass highlight */}
            <div
                className="
                pointer-events-none absolute inset-0
                bg-gradient-to-b
                from-foreground/[0.04] to-transparent
            "
            />

            {/* Text */}
            <span
                className="
                relative text-sm font-medium
                text-center sm:text-left
                text-card-foreground
            "
            >
                Enjoying the app? Show some love. Share it as much as possible.
            </span>

            {/* Actions */}
            <div
                className="
                relative flex items-center gap-2
                shrink-0
            "
            >
                {/* GitHub */}
                <motion.a
                    whileHover={{ scale: 1.04, y: -1 }}
                    whileTap={{ scale: 0.96 }}
                    href="https://github.com/Razen04/GATEQuest"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="
                        flex items-center gap-1.5
                        border border-border
                        bg-secondary/70
                        backdrop-blur-md
                        text-secondary-foreground
                        shadow-sm
                        px-3 py-1.5
                        text-xs font-semibold
                        transition-colors
                        hover:bg-accent
                        hover:text-accent-foreground
                        focus-visible:outline-none
                        focus-visible:ring-2
                        focus-visible:ring-ring
                    "
                >
                    <GithubLogoIcon size={16} weight="bold" />
                    <span>Star on GitHub</span>
                </motion.a>

                {/* Donate */}
                <motion.button
                    whileHover={{ scale: 1.04, y: -1 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => navigate('/donate')}
                    className="
                        flex items-center gap-1.5
                        border border-primary/20
                        bg-primary/10
                        backdrop-blur-md
                        text-primary
                        shadow-sm
                        px-3 py-1.5
                        text-xs font-semibold
                        transition-colors
                        hover:bg-primary/20
                        focus-visible:outline-none
                        focus-visible:ring-2
                        focus-visible:ring-ring
                    "
                >
                    <CoffeeIcon size={16} weight="bold" />
                    <span>Buy Me a Chai</span>
                </motion.button>
            </div>
        </div>
    );
};

export default Branding;
