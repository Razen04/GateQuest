import React, { useContext, useState } from 'react'
import { motion } from 'framer-motion'
import {
    FaUserCircle, FaPalette,
    FaShieldAlt, FaGlobe,
} from 'react-icons/fa'
import AccountSettings from './Settings/AccountSettings'
import PrivacySettings from './Settings/PrivacySettings'
import AppSettings from './Settings/AppSettings'
import AuthContext from '../context/AuthContext'
import Login from './Login'

const Settings = () => {

    // Track active tab (instead of expanded sections)
    const [activeTab, setActiveTab] = useState('account')
    const { showLogin, setShowLogin } = useContext(AuthContext);

    // Define tabs
    const tabs = [
        { id: 'account', label: 'Account', icon: <FaUserCircle />, component: <AccountSettings /> },
        { id: 'privacy', label: 'Privacy & Data', icon: <FaShieldAlt />, component: <PrivacySettings /> },
        { id: 'app', label: 'App Settings', icon: <FaGlobe />, component: <AppSettings /> }
    ]

    return (
        <div className='relative'>
            {showLogin && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-transparent bg-opacity-30">
                    <Login onClose={() => setShowLogin(false)} canClose={true} />
                </div>
            )}
            <div className={`p-8 min-h-[100dvh] transition-colors duration-500 bg-primary dark:bg-primary-dark text-text-primary dark:text-text-primary-dark ${showLogin ? 'blur-2xl' : null}`}>
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
                    <div className="flex sm:flex-nowrap gap-2 min-w-0 shadow-xs rounded-xl p-1 border border-border-primary dark:border-border-primary-dark">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex cursor-pointer items-center px-4 py-2 sm:py-3 rounded-lg transition-all whitespace-nowrap text-sm sm:text-base ${activeTab === tab.id
                                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-text-primary dark:text-text-primary-dark'
                                    }`}
                            >
                                <span className="mr-2">{tab.icon}</span>
                                <span className="font-medium">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="rounded-xl shadow-sm border border-border-primary dark:border-border-primary-dark p-6"
                >
                    {tabs.find(tab => tab.id === activeTab)?.component}
                </motion.div>
            </div>
        </div>

    )
}

export default Settings