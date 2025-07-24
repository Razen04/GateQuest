import React from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import {
    FaChartPie,
    FaLaptopCode,
    FaCog,
    FaHeadset,
    FaDiscord
} from 'react-icons/fa'
import { FaGithub, FaReddit } from 'react-icons/fa6'
import useWindowSize from '../hooks/useWindowSize'
import appLogo from '/logo.svg'

const Sidebar = ({ showSidebar, setShowSidebar }) => {
    const navigate = useNavigate()
    const location = useLocation()

    const { width, height } = useWindowSize();

    if (width === undefined) {
        return (
            <div>Loading size...</div>
        )
    }
    const tabs = [
        { id: 1, name: "Dashboard", icon: <FaChartPie />, path: "/" },
        { id: 2, name: "Practice", icon: <FaLaptopCode />, path: "/practice" },
        { id: 3, name: "Settings", icon: <FaCog />, path: "/settings" },
        { id: 4, name: "Contact", icon: <FaHeadset />, path: "/contact" }
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
            <nav className="fixed bottom-0 left-0 right-0 z-20 bg-white dark:bg-primary-dark border-t border-border-primary dark:border-border-primary-dark flex justify-around items-center py-2 shadow-lg lg:hidden">
                {tabs.map((tab, index) => {
                    const isActive = location.pathname === tab.path;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => handleTabClick(tab.path)}
                            className={`flex flex-col items-center justify-center px-2 py-1 focus:outline-none transition-all ${isActive ? 'text-blue-600 font-bold' : 'text-gray-500 dark:text-gray-300'}`}
                        >
                            <span className={`text-xl mb-0.5 ${isActive ? 'scale-110' : ''}`}>{tab.icon}</span>
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
            className={`w-64 z-10 absolute h-[100dvh] lg:static lg:block border-r border-border-primary dark:border-border-primary-dark bg-gradient-to-b from-gray-50 to-white shadow-lg transition-colors duration-1000`}
            initial={{ x: '-100%' }}
            animate={{ x: showSidebar || width >= 1024 ? 0 : '-100%' }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', duration: 0.4, ease: 'easeIn' }}
        >
            <div className="flex flex-col h-full bg-primary dark:bg-primary-dark">
                {/* Branding */}
                <div className='flex items-center justify-center py-8 border-b border-border-primary dark:border-border-primary-dark transition-colors duration-1000'>
                    <motion.div
                        className="text-3xl text-blue-600"
                        initial={{ scale: 0.1 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                    >
                        <img src={appLogo} alt="App logo" className='w-7' />
                    </motion.div>
                    <motion.h1
                        className='ml-3 text-2xl font-bold dark:text-white'
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                    >
                        <span className='bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>GATE</span>Quest
                    </motion.h1>
                </div>

                {/* Navigation */}
                <div className='flex-1 pt-6 overflow-y-auto scrollbar-hide'>
                    <nav className='px-4'>
                        {tabs.map((tab, index) => {
                            const isActive = location.pathname === tab.path;
                            return (
                                <motion.div
                                    key={tab.id}
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 * index, duration: 0.5 }}
                                    onClick={() => handleTabClick(tab.path)}
                                    className={`relative flex items-center px-4 py-3 my-2 rounded-xl cursor-pointer group transition-all duration-300 ${isActive
                                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                                        : 'hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-white'
                                        }`}
                                >
                                    <div className={`p-2 rounded-lg ${isActive
                                        ? 'bg-white/20'
                                        : 'bg-gray-100 group-hover:bg-gray-200 dark:bg-gray-700 dark:group-hover:bg-gray-700'
                                        }`}>
                                        <span
                                            className={`text-lg transition-transform duration-300 group-hover:scale-110 ${isActive
                                                ? 'text-white'
                                                : 'text-text-primary dark:text-text-primary-dark'
                                                }`}
                                        >
                                            {tab.icon}
                                        </span>
                                    </div>
                                    <span className={`ml-3 text-base transition-all duration-300 ${isActive
                                        ? 'font-bold'
                                        : 'text-gray-700 group-hover:text-gray-900 dark:text-gray-200 dark:group-hover:text-gray-200'
                                        }`}>
                                        {tab.name}
                                    </span>

                                    {isActive && (
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

                {/* Footer */}
                <motion.div
                    className="p-4 mt-auto border-t border-border-primary dark:border-border-primary-dark"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                >
                    <div className="px-2 py-2 text-xs text-center text-gray-500 flex justify-around items-center">
                        <span className='p-2 rounded-full bg-blue-500 text-white text-lg hover:bg-white hover:text-blue-500 cursor-pointer transition-all hover:scale-150  hover:text-xl'><a href="https://github.com/Razen04/GateQuest" target="_blank" rel="noopener noreferrer"><FaGithub /></a></span>
                        <span className='p-2 rounded-full bg-blue-500 text-white text-lg hover:bg-white hover:text-blue-500 hover:scale-150 transition-all hover:text-xl cursor-pointer'><a href="https://www.reddit.com/r/GATEtard/" target="_blank" rel="noopener noreferrer"><FaReddit /></a></span>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    )
}

export default Sidebar