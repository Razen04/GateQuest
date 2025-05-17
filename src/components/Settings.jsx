import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
    FaUserCircle, FaBell, FaPalette, FaClock,
    FaShieldAlt, FaGlobe, FaMoon, FaSun, FaToggleOn,
    FaToggleOff, FaChevronDown, FaChevronUp
} from 'react-icons/fa'
import { useTheme } from '../context/ThemeContext'

const Settings = () => {
    const { darkMode, toggleDarkMode } = useTheme()

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

    // Toggle setting
    const toggleSetting = (setting) => {
        setSettings({
            ...settings,
            [setting]: !settings[setting]
        })
    }

    // Handle language change
    const handleLanguageChange = (e) => {
        setSettings({
            ...settings,
            language: e.target.value
        })
    }

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    }

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5 }
        }
    }

    // Render toggle switch
    const ToggleSwitch = ({ isOn, onToggle, label }) => (
        <div className="flex items-center justify-between py-3">
            <span className="text-gray-700">{label}</span>
            <button
                onClick={onToggle}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-all duration-300 ${isOn ? 'bg-gradient-to-r from-blue-500 to-purple-600' : 'bg-gray-300'
                    }`}
            >
                <motion.div
                    className="bg-white w-4 h-4 rounded-full shadow-md"
                    animate={{ x: isOn ? 24 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
            </button>
        </div>
    )

    // Define tabs
    const tabs = [
        { id: 'account', label: 'Account', icon: <FaUserCircle /> },
        { id: 'appearance', label: 'Appearance', icon: <FaPalette /> },
        { id: 'notifications', label: 'Notifications', icon: <FaBell /> },
        { id: 'study', label: 'Study Preferences', icon: <FaClock /> },
        { id: 'privacy', label: 'Privacy & Data', icon: <FaShieldAlt /> },
        { id: 'app', label: 'App Settings', icon: <FaGlobe /> }
    ]

    return (
        <div className={`p-8 min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-300`}>
            {/* Header Section */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mb-8"
            >
                <h1 className="text-3xl font-bold text-gray-800">
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Settings</span> & Preferences
                </h1>
                <p className="text-gray-600 mt-2">Customize your GATE preparation experience</p>
            </motion.div>

            {/* Settings Tabs Navigation */}
            <div className="mb-8 overflow-x-auto">
                <div className="flex space-x-1 min-w-max bg-white shadow-sm rounded-xl p-1 border border-gray-100">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center px-4 py-3 rounded-lg transition-all ${activeTab === tab.id
                                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                                : 'text-gray-600 hover:bg-gray-100'
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
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
            >
                {/* Account Settings */}
                {activeTab === 'account' && (
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                            <FaUserCircle className="mr-2" /> Account Settings
                        </h2>

                        <div className="space-y-6">
                            <div className="flex items-center">
                                <div className="h-20 w-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 p-1 mr-5">
                                    <img
                                        src="https://via.placeholder.com/100"
                                        alt="Profile"
                                        className="w-full h-full object-cover rounded-full bg-white p-0.5"
                                    />
                                </div>
                                <div>
                                    <h3 className="font-medium text-gray-800">Anonymous User</h3>
                                    <p className="text-sm text-gray-500">GATE CSE Aspirant</p>
                                    <button className="mt-2 text-sm text-blue-500 hover:underline">Change Photo</button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        placeholder="Your Name"
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                    <input
                                        type="email"
                                        placeholder="your.email@example.com"
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">College/University</label>
                                    <input
                                        type="text"
                                        placeholder="Your Institution"
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Target Year</label>
                                    <select
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    >
                                        <option value="2025">GATE 2025</option>
                                        <option value="2026">GATE 2026</option>
                                        <option value="2027">GATE 2027</option>
                                    </select>
                                </div>
                            </div>

                            <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-purple-700 transition-colors">
                                Save Changes
                            </button>
                        </div>
                    </div>
                )}

                {/* Appearance Settings */}
                {activeTab === 'appearance' && (
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                            <FaPalette className="mr-2" /> Appearance
                        </h2>

                        <div className="space-y-6">
                            <div className="flex justify-between items-center py-3">
                                <span className="text-gray-700">Theme Mode</span>
                                <div className="flex items-center">
                                    <button
                                        className={`flex items-center justify-center p-2 rounded-l-lg ${!darkMode ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}
                                        onClick={toggleDarkMode}
                                    >
                                        <FaSun className="mr-2" /> Light
                                    </button>
                                    <button
                                        className={`flex items-center justify-center p-2 rounded-r-lg ${darkMode ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}
                                        onClick={toggleDarkMode}
                                    >
                                        <FaMoon className="mr-2" /> Dark
                                    </button>
                                </div>
                            </div>

                            <div className="py-3">
                                <label className="block text-gray-700 mb-2">Font Size</label>
                                <input
                                    type="range"
                                    min="1"
                                    max="3"
                                    step="1"
                                    defaultValue="2"
                                    className="w-full accent-blue-500"
                                />
                                <div className="flex justify-between text-sm text-gray-500 mt-1">
                                    <span>Small</span>
                                    <span>Medium</span>
                                    <span>Large</span>
                                </div>
                            </div>

                            <div className="py-3">
                                <label className="block text-gray-700 mb-2">Color Theme</label>
                                <div className="flex space-x-4">
                                    <button className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 ring-2 ring-offset-2 ring-blue-500"></button>
                                    <button className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-teal-500"></button>
                                    <button className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-red-500"></button>
                                    <button className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-purple-500"></button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Notification Settings */}
                {activeTab === 'notifications' && (
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                            <FaBell className="mr-2" /> Notifications
                        </h2>

                        <div className="space-y-2">
                            <ToggleSwitch
                                isOn={settings.emailNotifications}
                                onToggle={() => toggleSetting('emailNotifications')}
                                label="Email Notifications"
                            />
                            <ToggleSwitch
                                isOn={settings.pushNotifications}
                                onToggle={() => toggleSetting('pushNotifications')}
                                label="Push Notifications"
                            />
                            <ToggleSwitch
                                isOn={settings.testReminders}
                                onToggle={() => toggleSetting('testReminders')}
                                label="Test Reminders"
                            />
                            <ToggleSwitch
                                isOn={settings.progressUpdates}
                                onToggle={() => toggleSetting('progressUpdates')}
                                label="Weekly Progress Updates"
                            />
                            <ToggleSwitch
                                isOn={settings.studyReminders}
                                onToggle={() => toggleSetting('studyReminders')}
                                label="Study Schedule Reminders"
                            />
                            <div className="mt-6">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Quiet Hours</label>
                                <div className="flex space-x-4">
                                    <div className="w-1/2">
                                        <input
                                            type="time"
                                            defaultValue="22:00"
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        />
                                        <span className="text-xs text-gray-500 mt-1">From</span>
                                    </div>
                                    <div className="w-1/2">
                                        <input
                                            type="time"
                                            defaultValue="08:00"
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        />
                                        <span className="text-xs text-gray-500 mt-1">To</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Study Preferences */}
                {activeTab === 'study' && (
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                            <FaClock className="mr-2" /> Study Preferences
                        </h2>

                        <div className="space-y-6">
                            <div className="py-3">
                                <label className="block text-gray-700 mb-2">Default Study Timer</label>
                                <div className="flex flex-wrap gap-2">
                                    <button className="px-3 py-1 border border-gray-300 rounded-lg bg-blue-500 text-white">25 min</button>
                                    <button className="px-3 py-1 border border-gray-300 rounded-lg">45 min</button>
                                    <button className="px-3 py-1 border border-gray-300 rounded-lg">60 min</button>
                                    <button className="px-3 py-1 border border-gray-300 rounded-lg">Custom</button>
                                </div>
                            </div>

                            <div className="py-3">
                                <label className="block text-gray-700 mb-2">Default Question Difficulty</label>
                                <div className="flex flex-wrap gap-2">
                                    <button className="px-3 py-1 border border-gray-300 rounded-lg">Easy</button>
                                    <button className="px-3 py-1 border border-gray-300 rounded-lg bg-blue-500 text-white">Medium</button>
                                    <button className="px-3 py-1 border border-gray-300 rounded-lg">Hard</button>
                                    <button className="px-3 py-1 border border-gray-300 rounded-lg">Mixed</button>
                                </div>
                            </div>

                            <ToggleSwitch
                                isOn={settings.showTimer}
                                onToggle={() => toggleSetting('showTimer')}
                                label="Show Timer During Tests"
                            />

                            <ToggleSwitch
                                isOn={settings.autoPlayVideos}
                                onToggle={() => toggleSetting('autoPlayVideos')}
                                label="Auto-Play Tutorial Videos"
                            />

                            <div className="py-3">
                                <label className="block text-gray-700 mb-2">Subject Priority</label>
                                <select
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                >
                                    <option value="all">Balanced (All Subjects)</option>
                                    <option value="weak">Focus on Weak Areas</option>
                                    <option value="core">Prioritize Core Subjects</option>
                                    <option value="custom">Custom Priority</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* Privacy & Data */}
                {activeTab === 'privacy' && (
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                            <FaShieldAlt className="mr-2" /> Privacy & Data
                        </h2>

                        <div className="space-y-4">
                            <ToggleSwitch
                                isOn={settings.shareProgress}
                                onToggle={() => toggleSetting('shareProgress')}
                                label="Share My Progress & Ranking"
                            />

                            <ToggleSwitch
                                isOn={settings.dataCollection}
                                onToggle={() => toggleSetting('dataCollection')}
                                label="Allow Anonymous Data Collection"
                            />

                            <div className="py-3 border-t border-gray-100 mt-3 pt-3">
                                <h3 className="text-base font-medium text-gray-800 mb-4">Data Management</h3>

                                <div className="space-y-3">
                                    <button className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 flex justify-between items-center">
                                        <span>Export My Data</span>
                                        <span className="text-blue-500">JSON / CSV</span>
                                    </button>

                                    <button className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 flex justify-between items-center">
                                        <span>Clear Local Storage</span>
                                        <span className="text-blue-500">34.2 MB</span>
                                    </button>

                                    <button className="w-full text-left px-4 py-3 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 flex justify-between items-center">
                                        <span>Delete Account</span>
                                        <span className="text-red-500">Permanent</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* App Settings */}
                {activeTab === 'app' && (
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                            <FaGlobe className="mr-2" /> App Settings
                        </h2>

                        <div className="space-y-4">
                            <div className="py-3">
                                <label className="block text-gray-700 mb-2">Language</label>
                                <select
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    value={settings.language}
                                    onChange={handleLanguageChange}
                                >
                                    <option value="english">English</option>
                                    <option value="hindi">Hindi</option>
                                </select>
                            </div>

                            <ToggleSwitch
                                isOn={settings.soundEffects}
                                onToggle={() => toggleSetting('soundEffects')}
                                label="Sound Effects"
                            />

                            <div className="py-3">
                                <label className="block text-gray-700 mb-2">Storage Usage</label>
                                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-1">
                                    <div className="h-full bg-blue-500 rounded-full" style={{ width: '38%' }}></div>
                                </div>
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>120MB used</span>
                                    <span>315MB available</span>
                                </div>
                            </div>

                            <div className="py-3 border-t border-gray-100 mt-3 pt-3">
                                <h3 className="text-base font-medium text-gray-800 mb-2">App Information</h3>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Version</span>
                                        <span className="text-gray-800">1.2.0</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Build Number</span>
                                        <span className="text-gray-800">2025.05.13.1</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Last Updated</span>
                                        <span className="text-gray-800">May 13, 2025</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    )
}

export default Settings