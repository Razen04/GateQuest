import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import type { Tab } from './Sidebar';
import useAuth from '@/shared/hooks/useAuth';

type MobileDockProp = {
    tabs: Tab[];
    handleTabClick: (path: string) => void;
};

const MobileDock = ({ tabs, handleTabClick }: MobileDockProp) => {
    const location = useLocation();
    const { user } = useAuth();

    return (
        <nav
            className="fixed bottom-4 left-4 right-4 z-50 lg:hidden"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
            <div
                className="relative flex items-center justify-between gap-1 rounded-full px-2 py-2.5
                           bg-white/10 dark:bg-black/20
                           backdrop-blur-[36px] backdrop-saturate-[200%]
                           border border-white/20 dark:border-white/10
                           shadow-[0_8px_32px_rgba(0,0,0,0.16),0_1px_0_rgba(255,255,255,0.4)_inset,0_-1px_0_rgba(0,0,0,0.06)_inset]"
            >
                {/* Top specular highlight — the "glass catching light" edge */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-full bg-gradient-to-r from-transparent via-white/70 to-transparent" />

                {/* Soft internal glow, subtler than before so it doesn't wash out icons */}
                <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-b from-white/15 via-transparent to-black/[0.02] dark:from-white/[0.06]" />

                {tabs
                    .filter((tab) => tab.id !== 3 || user?.settings?.is_beta)
                    .map((tab) => {
                        const isActive = location.pathname.startsWith(tab.path);
                        const Icon = isActive ? tab.activeIcon : tab.icon;

                        return (
                            <button
                                key={tab.id}
                                onClick={() => handleTabClick(tab.path)}
                                className="relative flex-1 flex justify-center focus-visible:outline-none"
                            >
                                <motion.div
                                    whileTap={{ scale: 0.92 }}
                                    transition={{
                                        type: 'spring',
                                        stiffness: 500,
                                        damping: 30,
                                    }}
                                    className="relative flex h-10 px-2 w-full max-w-[72px] items-center justify-center rounded-full"
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="mobile-dock-glass"
                                            transition={{
                                                type: 'spring',
                                                stiffness: 380,
                                                damping: 32,
                                            }}
                                            className="absolute inset-0 rounded-full
                                                   bg-white/40 dark:bg-white/[0.14]
                                                   backdrop-blur-[24px] backdrop-saturate-[180%]
                                                   border border-white/40 dark:border-white/15
                                                   shadow-[0_4px_14px_rgba(0,0,0,0.10),0_1px_0_rgba(255,255,255,0.6)_inset]"
                                        />
                                    )}

                                    <div
                                        className={`relative z-10 flex flex-col items-center justify-center leading-none transition-colors duration-200 ${
                                            isActive
                                                ? 'text-foreground'
                                                : 'text-muted-foreground'
                                        }`}
                                    >
                                        <motion.div
                                            animate={{
                                                scale: isActive ? 1.06 : 1,
                                                y: isActive ? -1 : 0,
                                            }}
                                            transition={{
                                                type: 'spring',
                                                stiffness: 420,
                                                damping: 26,
                                            }}
                                            className="flex h-6 items-center justify-center text-xl"
                                        >
                                            {Icon}
                                        </motion.div>
                                    </div>
                                </motion.div>
                            </button>
                        );
                    })}
            </div>
        </nav>
    );
};

export default MobileDock;
