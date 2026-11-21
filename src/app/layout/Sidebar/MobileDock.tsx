import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import type { Tab } from './Sidebar';

type MobileDockProp = {
    tabs: Tab[];
    handleTabClick: (path: string) => void;
};

const MobileDock = ({ tabs, handleTabClick }: MobileDockProp) => {
    const location = useLocation();

    return (
        <nav
            className="fixed bottom-4 left-4 right-4 z-50 lg:hidden"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
            <div
                className="relative flex items-center justify-between gap-1 rounded-full px-2 py-2.5
                       bg-card/80
                       backdrop-blur-[36px] backdrop-saturate-[200%]
                       border border-border
                       shadow-[0_8px_32px_var(--glass-shadow),0_1px_0_var(--glass-edge)_inset,0_-1px_0_var(--glass-shadow)_inset]"
            >
                {/* Top specular highlight */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-full bg-gradient-to-r from-transparent via-foreground/20 to-transparent" />

                {/* Soft internal glass glow */}
                <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-b from-foreground/[0.04] via-transparent to-transparent" />

                {tabs.map((tab) => {
                    const isActive = location.pathname.startsWith(tab.path);
                    const Icon = isActive ? tab.activeIcon : tab.icon;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => handleTabClick(tab.path)}
                            className="relative flex-1 flex justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
                                               bg-chart-1/10
                                               backdrop-blur-[24px] backdrop-saturate-[180%]
                                               border border-chart-1/20
                                               shadow-[0_4px_14px_var(--glass-shadow),0_1px_0_var(--glass-edge)_inset]"
                                    />
                                )}

                                <div
                                    className={`relative z-10 flex flex-col items-center justify-center leading-none transition-colors duration-200 ${
                                        isActive
                                            ? 'text-chart-1'
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
