import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { User, ShieldCheck, Faders } from '@phosphor-icons/react';

import Login from '../../components/Login.jsx';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { itemVariants } from '../../utils/motionVariants.ts';
import useAuth from '../../hooks/useAuth.ts';
import PageHeader from '@/components/ui/PageHeader.tsx';
import AnimatedTabs from '@/components/ui/AnimatedTabs.tsx';

const Settings = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const activeTab: string = location.pathname.split('/')[2] || 'account';
    const { showLogin, setShowLogin } = useAuth();

    // Tab Reference
    const tabRefs = useRef<Record<string, HTMLButtonElement>>({});

    // This brings the active tab in view
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

    // Tabs
    const tabs = [
        {
            id: 'account',
            label: 'Account',
            icon: <User size={20} weight="duotone" />,
            activeIcon: <User size={20} weight="fill" />,
        },
        {
            id: 'privacy',
            label: 'Privacy & Data',
            icon: <ShieldCheck size={20} weight="duotone" />,
            activeIcon: <ShieldCheck size={20} weight="fill" />,
        },
        {
            id: 'app-settings',
            label: 'App Settings',
            icon: <Faders size={20} weight="duotone" />,
            activeIcon: <Faders size={20} weight="fill" />,
        },
    ];

    return (
        <div className="relative pb-10">
            {showLogin && (
                <div className="w-full h-screen flex z-50 items-center justify-center bg-transparent bg-opacity-30">
                    <Login onClose={() => setShowLogin(false)} />
                </div>
            )}
            <div
                className={`p-6 min-h-[100dvh] transition-colors duration-50 ${showLogin ? 'blur-2xl' : ''}`}
            >
                {/* Header Section */}
                <PageHeader
                    primaryTitle="Preferences &amp;"
                    secondaryTitle="Settings"
                    caption="Customize your GATE preparation experience"
                />

                {/* Settings Tabs Navigation */}
                <div>
                    <AnimatedTabs tabs={tabs} activeTab={activeTab} onChange={navigate} />

                    <div className="mt-6">
                        {activeTab === 'general' && <div>General content…</div>}
                        {activeTab === 'appearance' && <div>Appearance content…</div>}
                        {activeTab === 'advanced' && <div>Advanced settings…</div>}
                    </div>
                </div>

                {/* Content Area */}
                <motion.div
                    initial="initial"
                    animate="animate"
                    variants={itemVariants}
                    className="overflow-y-scroll h-[60vh] pb-20"
                >
                    <Outlet />
                </motion.div>
            </div>
        </div>
    );
};

export default Settings;
