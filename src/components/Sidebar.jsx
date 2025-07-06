import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import {
    FaChartPie,
    FaLaptopCode,
    FaBookOpen,
    FaCog,
    FaHeadset,
    FaGraduationCap
} from 'react-icons/fa'

const Sidebar = () => {
    const navigate = useNavigate()
    const location = useLocation()

    // Determine active tab based on current path
    const getActiveTab = () => {
        const path = location.pathname
        if (path.includes('/practice')) return 2
        if (path.includes('/resources')) return 3
        if (path.includes('/settings')) return 4
        if (path.includes('/contact')) return 5
        return 1 // Dashboard is default
    }

    const [activeTab, setActiveTab] = useState(getActiveTab())

    const tabs = [
        { id: 1, name: "Dashboard", icon: <FaChartPie />, path: "/" },
        { id: 2, name: "Practice", icon: <FaLaptopCode />, path: "/practice" },
        { id: 3, name: "Settings", icon: <FaCog />, path: "/settings" },
        { id: 4, name: "Contact", icon: <FaHeadset />, path: "/contact" }
    ]

    // Handle tab click with navigation
    const handleTabClick = (tabId, path) => {
        setActiveTab(tabId)
        navigate(path)
    }

    return (
        <motion.div
            className='w-64 h-lvh border-r border-gray-200 bg-gradient-to-b from-gray-50 to-white shadow-lg'
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
        >
            <div className="flex flex-col h-full">
                {/* Branding */}
                <div className='flex items-center justify-center py-8 border-b border-gray-100'>
                    <motion.div
                        className="text-3xl text-blue-600"
                        initial={{ scale: 0.1 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                    >
                        <FaGraduationCap />
                    </motion.div>
                    <motion.h1
                        className='ml-3 text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                    >
                        GateQuest
                    </motion.h1>
                </div>

                {/* Navigation */}
                <div className='flex-1 pt-6 overflow-y-auto scrollbar-hide'>
                    <nav className='px-4'>
                        {tabs.map((tab, index) => (
                            <motion.div
                                key={tab.id}
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * index, duration: 0.5 }}
                                onClick={() => handleTabClick(tab.id, tab.path)}
                                className={`relative flex items-center px-4 py-3 my-2 rounded-xl cursor-pointer group transition-all duration-300 ${activeTab === tab.id
                                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                                        : 'hover:bg-gray-100'
                                    }`}
                            >
                                <div className={`p-2 rounded-lg ${activeTab === tab.id
                                        ? 'bg-white/20'
                                        : 'bg-gray-100 group-hover:bg-gray-200'
                                    }`}>
                                    <span
                                        className={`text-lg transition-transform duration-300 group-hover:scale-110 ${activeTab === tab.id
                                                ? 'text-white'
                                                : 'text-gray-700'
                                            }`}
                                    >
                                        {tab.icon}
                                    </span>
                                </div>
                                <span className={`ml-3 text-base transition-all duration-300 ${activeTab === tab.id
                                        ? 'font-bold'
                                        : 'text-gray-700 group-hover:text-gray-900'
                                    }`}>
                                    {tab.name}
                                </span>

                                {activeTab === tab.id && (
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
                        ))}
                    </nav>
                </div>

                {/* Footer */}
                <motion.div
                    className="p-4 mt-auto border-t border-gray-100"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                >
                    <div className="px-4 py-2 text-xs text-center text-gray-500">
                        © 2025 GateQuest
                    </div>
                </motion.div>
            </div>
        </motion.div>
    )
}

export default Sidebar