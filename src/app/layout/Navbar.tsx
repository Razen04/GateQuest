import {
    BookOpen,
    ChartPieSlice,
    Coffee,
    DiscordLogo,
    Gear,
    GithubLogo,
    Info,
    Notification,
    Star,
    UserCircleDashedIcon,
} from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Changelog from '@/shared/components/Changelog';
import NotificationDialog from '@/shared/components/NotificationDialog';
import useAuth from '@/shared/hooks/useAuth';
import useWindowSize from '@/shared/hooks/useWindowSize';

const springTransition = {
    type: 'spring' as const,
    stiffness: 400,
    damping: 32,
};

const Navbar = () => {
    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadNotifications, setUnreadNotifications] = useState(false);
    const [starCount, setStarCount] = useState<string | null>(null);
    const notificationRef = useRef<HTMLDivElement | null>(null);
    const animatedLogo = '/icons/animated_logo.svg';

    const { user } = useAuth();

    const { width } = useWindowSize();
    const navigate = useNavigate();
    const location = useLocation();

    // Close notifications panel on click outside
    const handleClickOutside = useCallback((event: MouseEvent) => {
        if (
            notificationRef.current &&
            !notificationRef.current.contains(event.target as Node)
        ) {
            setShowNotifications(false);
        }
    }, []);

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, [handleClickOutside]);

    // Fetch GitHub Stars with 1-hour cache
    useEffect(() => {
        const CACHE_KEY = 'repo_stars';
        const CACHE_EXPIRY = 60 * 60 * 1000;

        const fetchStars = () => {
            fetch('https://api.github.com/repos/Razen04/GateQuest')
                .then((res) => res.json())
                .then((data) => {
                    const count = data.stargazers_count;
                    const formatted =
                        count > 999
                            ? (count / 1000).toFixed(1) + 'k'
                            : String(count || 0);

                    setStarCount(formatted);
                    localStorage.setItem(
                        CACHE_KEY,
                        JSON.stringify({
                            count: formatted,
                            timestamp: Date.now(),
                        })
                    );
                })
                .catch(() => setStarCount('0'));
        };

        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            const { count, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_EXPIRY) {
                setStarCount(count);
            } else {
                fetchStars();
            }
        } else {
            fetchStars();
        }
    }, []);

    // Navigation Tabs Data
    const tabs = [
        {
            id: 'dashboard',
            name: 'Dashboard',
            path: '/dashboard',
            icon: <ChartPieSlice size={18} weight="duotone" />,
            activeIcon: <ChartPieSlice size={18} weight="fill" />,
        },
        {
            id: 'practice',
            name: 'Practice',
            path: '/practice',
            icon: <BookOpen size={18} weight="duotone" />,
            activeIcon: <BookOpen size={18} weight="fill" />,
        },
        // NOTE: This is currently in beta.
        {
            id: 'profile',
            name: 'Profile',
            path: `/u/${user?.username}`,
            icon: <UserCircleDashedIcon size={18} weight="duotone" />,
            activeIcon: <UserCircleDashedIcon size={18} weight="fill" />,
        },
        {
            id: 'settings',
            name: 'Settings',
            path: '/settings',
            icon: <Gear size={18} weight="duotone" />,
            activeIcon: <Gear size={18} weight="fill" />,
        },
        {
            id: 'about',
            name: 'About',
            path: '/about',
            icon: <Info size={18} weight="duotone" />,
            activeIcon: <Info size={18} weight="fill" />,
        },
    ];

    if (width === undefined) return null;
    const isMobile = width < 1024;

    return (
        <div className="sticky top-0 z-40 w-full pointer-events-none py-3 px-4 sm:px-8">
            <div className="relative mx-auto flex max-w-7xl items-center justify-between">
                {/* BRAND CAPSULE */}
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    onClick={() => navigate('/dashboard')}
                    className="pointer-events-auto flex cursor-pointer items-center gap-2 p-1.5 pr-4 backdrop-blur-2xl dark:border-white/10 dark:shadow-[0_8px_32px_rgba(0,0,0,0.37)] hover:border-blue-500/30 transition-all duration-300 group"
                >
                    <motion.div
                        whileHover={{ scale: 1.08, rotate: 5 }}
                        whileTap={{ scale: 0.92 }}
                        className="flex h-6 w-6 md:h-8 md:w-8 items-center justify-center"
                    >
                        <img
                            src={animatedLogo}
                            alt="GateQuest Logo"
                            className="h-full w-full object-contain"
                        />
                    </motion.div>

                    <div className="hidden md:flex flex-col">
                        <h1 className="font-['Space_Grotesk',sans-serif] text-lg font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                            <span className="bg-blue-500 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
                                GATE
                            </span>
                            <span>Quest</span>
                        </h1>
                    </div>
                </motion.div>

                {/* FLOATING CENTER NAVIGATION DOCK */}
                {!isMobile && (
                    <motion.nav
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{
                            duration: 0.5,
                            delay: 0.1,
                            ease: 'easeOut',
                        }}
                        className="absolute left-1/2 -translate-x-1/2 pointer-events-auto flex items-center gap-1 p-1.5  dark:bg-zinc-900/60"
                    >
                        {/* Light highlight edge */}
                        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent dark:via-white/20" />

                        {tabs
                            .filter(
                                (tab) =>
                                    tab.id !== 'profile' ||
                                    user?.settings?.is_beta
                            )
                            .map((tab) => {
                                const isActive = location.pathname.startsWith(
                                    tab.path
                                );
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => navigate(tab.path)}
                                        className={`relative flex items-center gap-2 px-4 py-1.5 text-xs font-semibold tracking-wide transition-colors duration-200 outline-none select-none ${
                                            isActive
                                                ? 'text-slate-900 dark:text-white'
                                                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                                        }`}
                                    >
                                        {isActive && (
                                            <motion.div
                                                layoutId="floating-nav-pill"
                                                transition={springTransition}
                                                className="absolute inset-0 border border-blue-500/20 to-transparent shadow-[0_2px_12px_rgba(59,130,246,0.15)] backdrop-blur-md dark:border-blue-400/30 dark:from-blue-500/20 dark:via-indigo-500/20"
                                            />
                                        )}
                                        <span className="relative z-10 text-base">
                                            {isActive
                                                ? tab.activeIcon
                                                : tab.icon}
                                        </span>
                                        <span className="relative z-10 font-['Space_Grotesk',sans-serif]">
                                            {tab.name}
                                        </span>
                                    </button>
                                );
                            })}
                    </motion.nav>
                )}

                {/* UTILITY DOCK */}
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
                    className="pointer-events-auto flex items-center gap-0.5 md:gap-1.5 p-1.5"
                >
                    <a
                        href="https://discord.gg/dFmg3g52c5"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Discord"
                        className="flex h-8 w-8 items-center justify-center text-slate-500 hover:bg-slate-900/5 hover:text-indigo-600 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-indigo-400 transition-all"
                    >
                        <DiscordLogo size={18} weight="bold" />
                    </a>

                    <a
                        href="https://github.com/Razen04/GateQuest"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="GitHub Repository"
                        className="flex h-8 items-center gap-1.5 px-2.5 text-slate-500 hover:bg-slate-900/5 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white transition-all"
                    >
                        <GithubLogo size={18} weight="bold" />
                        {starCount !== null && (
                            <span className="hidden md:flex items-center gap-0.5 border border-slate-900/10 bg-slate-100/80 px-1.5 py-0.5 font-['JetBrains_Mono',monospace] text-[10px] font-bold text-slate-700 dark:border-white/10 dark:bg-white/10 dark:text-slate-300">
                                <Star
                                    size={10}
                                    weight="fill"
                                    className="text-amber-500"
                                />
                                {starCount}
                            </span>
                        )}
                    </a>

                    <Changelog />

                    <button
                        onClick={() => navigate('/donate')}
                        aria-label="Support Project"
                        className="flex h-8 w-8 items-center justify-center border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:border-emerald-500/30 dark:text-emerald-400 transition-all"
                    >
                        <Coffee size={17} weight="bold" />
                    </button>

                    <div className="mx-0.5 h-4 w-px bg-slate-200 dark:bg-white/10" />

                    <div className="relative" ref={notificationRef}>
                        <button
                            onClick={() =>
                                setShowNotifications(!showNotifications)
                            }
                            aria-label="Notifications"
                            className="relative flex h-8 w-8 items-center justify-center text-slate-500 hover:bg-slate-900/5 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white transition-all"
                        >
                            <Notification
                                size={18}
                                weight={showNotifications ? 'fill' : 'duotone'}
                            />
                            {unreadNotifications && (
                                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 ring-2 ring-white dark:ring-zinc-950" />
                            )}
                        </button>

                        <NotificationDialog
                            isOpen={showNotifications}
                            setUnreadNotifications={setUnreadNotifications}
                        />
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Navbar;
