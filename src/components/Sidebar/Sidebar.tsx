import React, { type JSX } from 'react';
import { type Variants } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChartPieSlice, BookOpen, Gear, Info } from '@phosphor-icons/react';
import useWindowSize from '../../hooks/useWindowSize.js';
import MobileDock from './MobileDock.js';
import { SidebarDesktop } from './SidebarDesktop.js';
import ModernLoader from '../ui/ModernLoader.js';

type SidebarProp = {
    showSidebar: boolean;
    setShowSidebar: React.Dispatch<React.SetStateAction<boolean>>;
    hideMobileNavigation: boolean;
};

export type Tab = {
    id: number;
    name: string;
    icon: JSX.Element;
    activeIcon: JSX.Element;
    path: string;
    animation: Variants;
};

const Sidebar = ({ showSidebar, setShowSidebar, hideMobileNavigation }: SidebarProp) => {
    const navigate = useNavigate();
    const location = useLocation();

    const { width } = useWindowSize();

    // Icon animations
    const iconAnimations = {
        dashboard: {
            inactive: { rotate: 0, scale: 1 },
            active: {
                rotate: -45,
                scale: 1.1,
                transition: { type: 'spring', stiffness: 300, damping: 15 },
            },
        },
        practice: {
            inactive: { rotateY: 0, transition: { duration: 0.3 } },
            active: {
                rotateY: 360,
                transition: { duration: 0.7, ease: 'easeInOut' },
            },
        },
        settings: {
            inactive: { rotate: 0, transition: { duration: 0.4 } },
            active: {
                rotate: 360,
                transition: { duration: 0.6, ease: 'linear' },
            },
        },
        about: {
            inactive: { rotateY: 0, transition: { duration: 0.3 } },
            active: {
                rotateY: 360,
                transition: { duration: 0.5, ease: 'easeInOut' },
            },
        },
    };

    // Tabs data
    const tabs = [
        {
            id: 1,
            name: 'Dashboard',
            icon: <ChartPieSlice weight="duotone" />,
            activeIcon: <ChartPieSlice weight="fill" />,
            path: '/dashboard',
            animation: iconAnimations.dashboard,
        },
        {
            id: 2,
            name: 'Practice',
            icon: <BookOpen size={20} weight="duotone" />,
            activeIcon: <BookOpen size={20} weight="fill" />,
            path: '/practice',
            animation: iconAnimations.practice,
        },
        {
            id: 3,
            name: 'Settings',
            icon: <Gear size={20} weight="duotone" />,
            activeIcon: <Gear size={20} weight="fill" />,
            path: '/settings',
            animation: iconAnimations.settings,
        },
        {
            id: 4,
            name: 'About',
            icon: <Info size={20} weight="duotone" />,
            activeIcon: <Info size={20} weight="fill" />,
            path: '/about',
            animation: iconAnimations.about,
        },
    ];

    // Handle tab click with navigation
    const handleTabClick = (path: string) => {
        navigate(path);
        if (showSidebar) {
            setShowSidebar(false);
        }
    };

    if (width === undefined) {
        return <ModernLoader />;
    }

    // Mobile: bottom navbar, Desktop: sidebar
    const isMobile: boolean = width < 1024;

    if (isMobile) {
        if (hideMobileNavigation) return null;

        // Bottom dock for mobile
        return <MobileDock tabs={tabs} handleTabClick={handleTabClick} />;
    }

    // Desktop sidebar
    return (
        <SidebarDesktop
            showSidebar={showSidebar}
            tabs={tabs}
            locationPath={location}
            navigate={navigate}
        />
    );
};

export default Sidebar;
