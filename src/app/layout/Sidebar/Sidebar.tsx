import {
    BookOpen,
    ChartPieSlice,
    Gear,
    Info,
    UserCircleDashedIcon,
} from '@phosphor-icons/react';
import { type Variants } from 'framer-motion';
import React, { type JSX } from 'react';
import { useNavigate } from 'react-router-dom';
import ModernLoader from '@/shared/components/ModernLoader';
import useAuth from '@/shared/hooks/useAuth';
import useWindowSize from '@/shared/hooks/useWindowSize';
import MobileDock from './MobileDock';

type SidebarProp = {
    showSidebar?: boolean;
    setShowSidebar?: React.Dispatch<React.SetStateAction<boolean>>;
    hideMobileNavigation: boolean;
};

export type Tab = {
    id: number;
    name: string;
    icon: JSX.Element;
    activeIcon: JSX.Element;
    path: string;
    animation?: Variants;
};

const Sidebar = ({ hideMobileNavigation }: SidebarProp) => {
    const navigate = useNavigate();
    const { width } = useWindowSize();

    const { user } = useAuth();

    const tabs: Tab[] = [
        {
            id: 1,
            name: 'Dashboard',
            icon: <ChartPieSlice weight="duotone" />,
            activeIcon: <ChartPieSlice weight="fill" />,
            path: '/dashboard',
        },
        {
            id: 2,
            name: 'Practice',
            icon: <BookOpen size={20} weight="duotone" />,
            activeIcon: <BookOpen size={20} weight="fill" />,
            path: '/practice',
        },
        // NOTE: This is currently in beta.
        {
            id: 3,
            name: 'Profile',
            path: `/u/${user?.username}`,
            icon: <UserCircleDashedIcon size={18} weight="duotone" />,
            activeIcon: <UserCircleDashedIcon size={18} weight="fill" />,
        },
        {
            id: 4,
            name: 'Settings',
            icon: <Gear size={20} weight="duotone" />,
            activeIcon: <Gear size={20} weight="fill" />,
            path: '/settings',
        },
        {
            id: 5,
            name: 'About',
            icon: <Info size={20} weight="duotone" />,
            activeIcon: <Info size={20} weight="fill" />,
            path: '/about',
        },
    ];

    const handleTabClick = (path: string) => {
        navigate(path);
    };

    if (width === undefined) {
        return <ModernLoader />;
    }

    const isMobile: boolean = width < 1024;

    // Mobile Dock for Mobile Viewport
    if (isMobile) {
        if (hideMobileNavigation) return null;
        return <MobileDock tabs={tabs} handleTabClick={handleTabClick} />;
    }

    // No desktop sidebar rendered (Top Bar takes over)
    return null;
};

export default Sidebar;
