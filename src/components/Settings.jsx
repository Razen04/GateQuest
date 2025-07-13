import React, { useContext, useState } from 'react'
import { motion } from 'framer-motion'
import {
    FaUserCircle, FaBell, FaPalette, FaClock,
    FaShieldAlt, FaGlobe, FaMoon, FaSun, FaToggleOn,
    FaToggleOff, FaChevronDown, FaChevronUp
} from 'react-icons/fa'
import AccountSettings from './Settings/AccountSettings'
import AppearanceSettings from './Settings/AppearanceSettings'
import PrivacySettings from './Settings/PrivacySettings'
import AppSettings from './Settings/AppSettings'

const Settings = () => {

    // Track active tab (instead of expanded sections)
    const [activeTab, setActiveTab] = useState('account')

    // Settings states
    const [settings, setSettings] = useState({
        darkMode: false,
        emailNotifications: true,
        pushNotifications: true,
        soundEffects: true,
        testReminders: true,
        progressUpdates: true,
        studyReminders: true,
        autoPlayVideos: false,
        showTimer: true,
        shareProgress: false,
        dataCollection: true,
        language: 'english'
    })

    // Toggle settings
    const toggleSetting = (settings) => {
        setSettings({
            ...settings,
            [settings]: !settings[settings]
        })
    }

    // Define tabs
    const tabs = [
        { id: 'account', label: 'Account', icon: <FaUserCircle /> },
        { id: 'appearance', label: 'Appearance', icon: <FaPalette /> },
        { id: 'privacy', label: 'Privacy & Data', icon: <FaShieldAlt /> },
        { id: 'app', label: 'App Settings', icon: <FaGlobe /> }
    ]

    return (
        <div className={`p-8 min-h-screen transition-colors duration-500 bg-primary dark:bg-primary-dark text-text-primary dark:text-text-primary-dark`}>
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
                <div className="flex space-x-1 min-w-max shadow-sm rounded-xl p-1 border border-border-primary dark:border-border-primary-dark">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex cursor-pointer items-center px-4 py-3 rounded-lg transition-all ${activeTab === tab.id
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
                {/* Account Settings */}
                {activeTab === 'account' && (
                    <AccountSettings />
                )}

                {/* Appearance Settings */}
                {activeTab === 'appearance' && (
                    <AppearanceSettings />
                )}

                {/* Privacy & Data */}
                {activeTab === 'privacy' && (
                    <PrivacySettings settings={settings} toggleSetting={toggleSetting} />
                )}

                {/* App Settings */}
                {activeTab === 'app' && (
                    <AppSettings settings={settings} toggleSetting={toggleSetting} />
                )}
            </motion.div>
        </div>
    )
}

export default Settings