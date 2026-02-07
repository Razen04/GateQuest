import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { SidebarItem } from './SidebarItem';
import { Button } from '@/components/ui/button';
import animatedLogo from '/animated_logo.svg';
import { CaretLeft, DiscordLogo, GithubLogo, Coffee } from '@phosphor-icons/react';
import { Text, Title } from '../ui/typography';
import type { Tab } from './Sidebar';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import changelog from '/CHANGELOG.md?raw';
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArticleIcon } from '@phosphor-icons/react';
import { GithubLogoIcon } from '@phosphor-icons/react';
import { LinkIcon } from '@phosphor-icons/react';
import Changelog from './Changelog';

type SidebarDesktopProps = {
    showSidebar: boolean;
    tabs: Tab[];
    locationPath: any;
    navigate: (path: string) => void;
};

export const SidebarDesktop = ({
    showSidebar,
    tabs,
    locationPath,
    navigate,
}: SidebarDesktopProps) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    const handleCollapse = () => setIsCollapsed(!isCollapsed);

    const [starCount, setStarCount] = useState<number | null>(null);

    useEffect(() => {
        const CACHE_KEY = 'repo_stars';
        const CACHE_EXPIRY = 60 * 60 * 1000; // 1 hour in milliseconds

        const fetchStars = () => {
            fetch('https://api.github.com/repos/Razen04/GateQuest')
                .then((res) => res.json())
                .then((data) => {
                    const count = data.stargazers_count;
                    const formatted = count > 999 ? (count / 1000).toFixed(1) + 'k' : count;

                    // Save to state
                    setStarCount(formatted);

                    // Save to local storage with timestamp
                    localStorage.setItem(
                        CACHE_KEY,
                        JSON.stringify({
                            count: formatted,
                            timestamp: Date.now(),
                        }),
                    );
                })
                .catch(() => setStarCount(0));
        };

        // 1. Check Local Storage first
        const cached = localStorage.getItem(CACHE_KEY);

        if (cached) {
            const { count, timestamp } = JSON.parse(cached);
            const isExpired = Date.now() - timestamp > CACHE_EXPIRY;

            if (!isExpired) {
                setStarCount(count); // Use cached value
            } else {
                fetchStars(); // Cache expired, fetch new
            }
        } else {
            fetchStars(); // No cache, fetch new
        }
    }, []);

    return (
        <motion.div
            className="h-full z-10 flex justify-between flex-col border-r border-border-primary dark:border-border-primary-dark shadow-sm overflow-x-hidden"
            initial={{ x: '-100%' }}
            animate={{
                x: showSidebar ? 0 : '-100%',
                width: isCollapsed ? '5rem' : '16rem',
            }}
            transition={{ type: 'spring', stiffness: 200, damping: 30 }}
        >
            <div>
                {/* Branding */}
                <div className="py-8 border-b border-border-primary dark:border-border-primary-dark transition-colors duration-1000">
                    <motion.div
                        className="flex items-center justify-center text-2xl font-bold dark:text-white"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                    >
                        <img
                            src={animatedLogo}
                            alt="App logo"
                            className={`w-8 ${isCollapsed ? 'mr-0' : 'mr-3'} flex-shrink-0`}
                        />
                        <div className={`${isCollapsed ? 'hidden' : 'block'}`}>
                            <Title className="bg-gradient-to-br from-blue-400 to-blue-600 bg-clip-text text-transparent">
                                GATE
                                <span className="text-black dark:text-white">Quest</span>
                            </Title>
                            <Text className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-[-5px] text-right w-full">
                                Good Luck
                            </Text>
                        </div>
                    </motion.div>
                </div>

                {/* Tabs */}
                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                    {tabs.map((tab, idx) => (
                        <SidebarItem
                            key={tab.id}
                            index={idx}
                            name={tab.name}
                            icon={tab.icon}
                            activeIcon={tab.activeIcon}
                            isActive={locationPath.pathname.startsWith(tab.path)}
                            isCollapsed={isCollapsed}
                            animation={tab.animation}
                            onClick={() => navigate(tab.path)}
                        />
                    ))}
                </nav>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border-primary dark:border-border-primary-dark">
                <div
                    className={`flex items-center transition-all duration-300 ${isCollapsed ? 'flex-col gap-4' : 'justify-between'}`}
                >
                    {/* Social links */}
                    <div
                        className={`flex items-center ${isCollapsed ? 'flex-col gap-6' : 'space-x-2'}`}
                    >
                        <Button
                            variant="ghost"
                            size="sm"
                            className="p-2 rounded-none hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-white"
                            aria-label="Join our Discord"
                        >
                            <a
                                href="https://discord.gg/dFmg3g52c5"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <DiscordLogo size={16} />
                            </a>
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="p-2 rounded-none hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-white"
                            aria-label="Github"
                        >
                            <a
                                href="https://github.com/Razen04/GateQuest"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2"
                            >
                                <GithubLogo size={16} />
                                {starCount !== null && (
                                    <span className="text-base font-extralight">{starCount}</span>
                                )}
                            </a>
                        </Button>
                        <Changelog />
                        <Button
                            variant="ghost"
                            size="sm"
                            className="p-2 rounded-none cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-white border-b border-green-500"
                            aria-label="Support Me"
                            onClick={() => navigate('/donate')}
                        >
                            <Coffee size={16} />
                        </Button>
                    </div>

                    {/* Collapse button */}
                    <motion.button
                        animate={{ rotate: isCollapsed ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-white"
                        onClick={handleCollapse}
                    >
                        <CaretLeft size={16} />
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
};
