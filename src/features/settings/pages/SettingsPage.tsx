import { Faders, ShieldCheck, User } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Login from '@/features/auth/components/Login';
import AnimatedTabs from '@/shared/components/AnimatedTabs';
import PageHeader from '@/shared/components/PageHeader';
import useAuth from '@/shared/hooks/useAuth';
import { itemVariants } from '@/shared/utils/motionVariants';

const Settings = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const activeTab: string = location.pathname.split('/')[2] || 'account';
    const { showLogin, setShowLogin } = useAuth();

    // Tab Reference
    const tabRefs = useRef<Record<string, HTMLButtonElement>>({});

    // Bring active sub-tab into view on horizontal overflow (mobile / small screens)
    useEffect(() => {
        const activeEl = tabRefs.current[activeTab];
        if (activeEl) {
            activeEl.scrollIntoView({
                behavior: 'smooth',
                inline: 'center',
                block: 'nearest',
            });
        }
    }, [activeTab]);

    // Sub-Navigation Tabs
    const tabs = [
        {
            id: 'account',
            label: 'Account',
            icon: <User size={18} weight="duotone" />,
            activeIcon: <User size={18} weight="fill" />,
        },
        {
            id: 'app-settings',
            label: 'App Settings',
            icon: <Faders size={18} weight="duotone" />,
            activeIcon: <Faders size={18} weight="fill" />,
        },
        {
            id: 'privacy',
            label: 'Privacy & Data',
            icon: <ShieldCheck size={18} weight="duotone" />,
            activeIcon: <ShieldCheck size={18} weight="fill" />,
        },
    ];

    return (
        <div className="relative min-h-dvh select-none">
            {/* Modal Overlay for Login */}
            {showLogin && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm">
                    <Login onClose={() => setShowLogin(false)} />
                </div>
            )}

            <div
                className={`max-w-7xl mx-auto px-4 sm:px-8 pt-6 pb-32 transition-all duration-200 ${
                    showLogin ? 'blur-2xl pointer-events-none' : ''
                }`}
            >
                {/* SECTION PAGE HEADER */}
                <PageHeader
                    primaryTitle="Preferences &"
                    secondaryTitle="Settings"
                    caption="Customize your GATE preparation environment and account controls"
                />

                {/* STICKY SUB-NAVIGATION BAR */}
                <div className="top-14 z-30 -mx-4 px-4 sm:-mx-8 sm:px-8 py-3 my-4 bg-slate-50/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-slate-200/60 dark:border-zinc-800/60">
                    <AnimatedTabs
                        tabs={tabs}
                        activeTab={activeTab}
                        onChange={(tabId) => navigate(`/settings/${tabId}`)}
                    />
                </div>

                {/* NESTED ROUTE CONTENT AREA */}
                <motion.main
                    initial="initial"
                    animate="animate"
                    variants={itemVariants}
                    className="mt-6"
                >
                    <Outlet />
                </motion.main>
            </div>
        </div>
    );
};

export default Settings;
