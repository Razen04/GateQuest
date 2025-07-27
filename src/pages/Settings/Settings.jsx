import React, { useContext } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
    FaUserCircle, FaPalette,
    FaShieldAlt, FaGlobe,
} from 'react-icons/fa'

import AuthContext from '../../context/AuthContext'
import Login from '../../components/Login'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'

const Settings = () => {

    const location = useLocation();
    const navigate = useNavigate();
    const activeTab = location.pathname.split('/')[2] || 'account';
    const { showLogin, setShowLogin } = useContext(AuthContext);

    // Define tabs
    const tabs = [
        { id: 'account', label: 'Account', icon: <FaUserCircle /> },
        { id: 'privacy', label: 'Privacy & Data', icon: <FaShieldAlt /> },
        { id: 'app-settings', label: 'App Settings', icon: <FaGlobe /> }
    ]

    return (
        <div className='relative pb-10'>
            {showLogin && (
                <div className="w-full h-screen flex z-50 items-center justify-center bg-transparent bg-opacity-30">
                    <Login onClose={() => setShowLogin(false)} canClose={true} />
                </div>
            )}
            <div className={`p-6 min-h-[100dvh] transition-colors duration-500 bg-primary dark:bg-primary-dark text-text-primary dark:text-text-primary-dark ${showLogin ? 'blur-2xl' : null}`}>
                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mb-8"
                >
                    <h1 className="text-3xl font-bold">
                        <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Settings</span> & Preferences
                    </h1>
                    <p className="mt-2">Customize your GATE preparation experience</p>
                </motion.div>

                {/* Settings Tabs Navigation */}
                <div className="mb-8 overflow-x-auto">
                    <nav className="flex sm:flex-nowrap gap-2 min-w-0 shadow-xs rounded-xl p-1 border border-border-primary dark:border-border-primary-dark">
                        {tabs.map((tab) => {
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => navigate(tab.id)}
                                    className={`flex cursor-pointer items-center px-4 py-2 sm:py-3 rounded-lg transition-all whitespace-nowrap text-sm sm:text-base ${activeTab === tab.id
                                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-text-primary dark:text-text-primary-dark'
                                        }`}
                                >
                                    <span className="mr-2">{tab.icon}</span>
                                    <span className="font-medium">{tab.label}</span>
                                </button>
                            )
                        })}
                    </nav>
                </div>

                {/* Content Area */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="rounded-xl shadow-sm border border-border-primary dark:border-border-primary-dark p-6 overflow-y-scroll h-[60vh] pb-20"
                    >
                        <Outlet />
                    </motion.div>
            </div>
        </div>

    )
}

export default Settings