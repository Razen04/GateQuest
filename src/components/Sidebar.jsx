import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { ChartPieSlice, BookOpen, Gear, Info, ArrowArcRight, CaretRight, CaretLeft } from 'phosphor-react'
import useWindowSize from '../hooks/useWindowSize'
import appLogo from '/logo.svg'

const Sidebar = ({ showSidebar, setShowSidebar }) => {
    const navigate = useNavigate()
    const location = useLocation()
    const [isCollapsed, setIsCollapsed] = useState(false);

    const { width } = useWindowSize();

    const handleSidebarShow = () => {
        setIsCollapsed(!isCollapsed);
    }

    const iconAnimations = {
        dashboard: {
            inactive: { rotate: 0, scale: 1 },
            active: { rotate: -45, scale: 1.1, transition: { type: 'spring', stiffness: 300, damping: 15 } }
        },
        practice: {
            inactive: { rotateY: 0, transition: { duration: 0.3 } },
            active: { rotateY: 360, transition: { duration: 0.7, ease: 'easeInOut' } }
        },
        settings: {
            inactive: { rotate: 0, transition: { duration: 0.4 } },
            active: { rotate: 360, transition: { duration: 0.6, ease: 'linear' } }
        },
        about: {
            inactive: { rotateY: 0, transition: { duration: 0.3 } },
            active: { rotateY: 360, transition: { duration: 0.5, ease: 'easeInOut' } }
        }
    };

    if (width === undefined) {
        return (
            <div>Loading size...</div>
        )
    }
    const tabs = [
        { id: 1, name: "Dashboard", icon: <ChartPieSlice weight='duotone' />, activeIcon: <ChartPieSlice weight="fill" />, path: "/dashboard", animation: iconAnimations.dashboard },
        { id: 2, name: "Practice", icon: <BookOpen size={20} weight="duotone" />, activeIcon: <BookOpen size={20} weight="fill" />, path: "/practice", animation: iconAnimations.practice },
        { id: 3, name: "Settings", icon: <Gear size={20} weight="duotone" />, activeIcon: <Gear size={20} weight="fill" />, path: "/settings", animation: iconAnimations.settings },
        { id: 4, name: "About", icon: <Info size={20} weight="duotone" />, activeIcon: <Info size={20} weight="fill" />, path: "/about", animation: iconAnimations.about }
    ]

    // Handle tab click with navigation
    const handleTabClick = (path) => {
        navigate(path)
        if (showSidebar) {
            setShowSidebar(false)
        }
    }

    // Mobile: bottom navbar, Desktop: sidebar
    const isMobile = width < 768;

    if (isMobile) {
        // Bottom navbar for mobile
        return (
            <nav className="fixed h-16 bottom-0 left-0 right-0 z-20 bg-white dark:bg-primary-dark border-t border-border-primary dark:border-border-primary-dark flex justify-around items-center py-2 shadow-lg lg:hidden">
                {tabs.map((tab) => {
                    const isActive = location.pathname.startsWith(tab.path)
                    const IconComponent = isActive ? tab.activeIcon : tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => handleTabClick(tab.path)}
                            className={`flex flex-col items-center justify-center px-2 py-1 focus:outline-none transition-all font-semibold ${isActive ? 'text-blue-600' : 'text-gray-500 dark:text-gray-300'}`}
                        >
                            <span className={`text-xl mb-0.5 px-3 py-0.5 inline-block ${isActive ? 'bg-gray-100 dark:bg-gray-800 rounded-2xl' : ''}`}>
                                <motion.div
                                    variants={tab.animation}
                                    animate={isActive ? "active" : "inactive"}
                                >
                                    {IconComponent}
                                </motion.div>
                            </span>
                            <span className="text-xs">{tab.name}</span>
                        </button>
                    );
                })}
            </nav>
        );
    }

    // Desktop sidebar
    return (
        <motion.div
            className={`z-10 absolute h-[100dvh] lg:static lg:block border-r border-border-primary dark:border-border-primary-dark bg-gradient-to-b from-gray-50 to-white shadow-sm transition-colors duration-1000`}
            initial={{ x: '-100%' }}
            animate={{
                x: showSidebar || width >= 1024 ? 0 : '-100%',
                width: isCollapsed ? '5rem' : '16rem'
            }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
            <div className="flex flex-col h-full bg-primary dark:bg-primary-dark">
                {/* Branding */}
                <div className='py-8 border-b border-border-primary dark:border-border-primary-dark transition-colors duration-1000'>
                    <motion.div
                        className='flex items-center justify-center text-2xl font-bold dark:text-white'
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                    >
                        <img src={appLogo} alt="App logo" className={`w-8 ${isCollapsed ? 'mr-0' : 'mr-3'} flex-shrink-0`} />
                        <div className={`${isCollapsed ? 'hidden' : 'block'}`}>
                            <h1 className='bg-gradient-to-r from-blue-600 to-purple-700 bg-clip-text text-transparent'>
                                GATE<span className='text-black dark:text-white'>Quest</span>
                            </h1>
                            <p className='text-xs text-gray-500 dark:text-gray-400 font-medium mt-[-5px] text-right w-full'>Good Luck</p>
                        </div>

                    </motion.div>

                </div>

                {/* Navigation */}
                <div className='flex-1 pt-6 overflow-y-auto scrollbar-hide'>
                    <nav className='px-4'>
                        {tabs.map((tab, index) => {
                            const isActive = location.pathname.startsWith(tab.path);
                            return (
                                <motion.div
                                    key={tab.id}
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 * index, duration: 0.5 }}
                                    onClick={() => handleTabClick(tab.path)}
                                    className={`relative flex items-center px-4 py-3 my-2 rounded-lg cursor-pointer group transition-all duration-300 ${isActive
                                        ? `text-white ${isCollapsed ? '' : 'bg-gradient-to-br from-blue-800 to-blue-900 shadow-lg'}`
                                        : `${isCollapsed ? '' : 'hover:bg-gray-200 dark:hover:bg-gray-700'} dark:text-white`
                                        } ${isCollapsed ? 'justify-center' : ''}`}
                                >
                                    <div className={`p-2 rounded-lg ${isActive
                                        ? `dark:bg-white/5 ${isCollapsed ? 'bg-gradient-to-br from-blue-800 to-blue-900' : ''}`
                                        : 'bg-gray-100 group-hover:bg-gray-200 dark:bg-gray-700 dark:group-hover:bg-gray-700'
                                        }`}>
                                        <motion.div
                                            className={`text-lg ${isActive
                                                ? 'text-white'
                                                : 'text-text-primary dark:text-text-primary-dark'
                                                }`}
                                            variants={tab.animation}
                                            animate={isActive ? "active" : "inactive"}
                                        >
                                            {isActive ? tab.activeIcon : tab.icon}
                                        </motion.div>
                                    </div>
                                    <span className={`ml-3 text-base whitespace-nowrap transition-all duration-300 ${isActive
                                        ? 'font-bold'
                                        : 'text-gray-700 group-hover:text-gray-900 dark:text-gray-200 dark:group-hover:text-gray-200'
                                        } ${isCollapsed ? 'hidden' : ''}`}>
                                        {tab.name}
                                    </span>

                                    {isActive && !isCollapsed && (
                                        <motion.div
                                            className="absolute right-4"
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <div className="w-2 h-2 rounded-full bg-white"></div>
                                        </motion.div>
                                    )}
                                </motion.div>
                            )
                        })}
                    </nav>
                </div>

                <div className={`w-full flex ${isCollapsed ? 'justify-center' : 'justify-end-safe'}`}>
                    <button aria-label='Collapse or Uncollapse Sidebar' className='p-3 cursor-pointer dark:text-white hover:dark:text-black bg-white/5 hover:bg-blue-50 tranistion-all duration-300 rounded-full m-3' onClick={handleSidebarShow}>
                        {isCollapsed ? (<CaretRight size={20} />) : (<CaretLeft size={20} />)}
                    </button>
                </div>

            </div>
        </motion.div>
    )
}

export default Sidebar