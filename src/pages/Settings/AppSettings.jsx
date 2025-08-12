import React, { useContext, useState } from 'react'
import { FaGlobe } from 'react-icons/fa'
import ToggleSwitch from '../../components/ToggleSwitch'
import AppSettingContext from '../../context/AppSettingContext'
import ThemeContext from '../../context/ThemeContext'
import { FaGithub, FaReddit } from 'react-icons/fa6'
import { motion } from 'framer-motion'


const AppSettings = () => {
    const { settings, handleSettingToggle } = useContext(AppSettingContext)
    const { dark, toggleDarkMode } = useContext(ThemeContext);

    return (
        <div>
            <h2 className="text-xl font-semibold mb-6 flex items-center">
                <FaGlobe className="mr-2" /> App Settings
            </h2>

            <div className="space-y-4">
                <ToggleSwitch
                    isOn={settings.sound}
                    onToggle={() => handleSettingToggle('sound')}
                    label="Sound Effects"
                />
                <ToggleSwitch
                    label="Auto Timer"
                    onToggle={() => handleSettingToggle("autoTimer")}
                    isOn={settings.autoTimer}
                />

                <ToggleSwitch label="Dark Mode" onToggle={toggleDarkMode} isOn={dark} />

                <div className="py-3 border-t border-border-primary dark:border-border-primary-dark mt-3 pt-3">
                    <h3 className="text-lg font-medium mb-2">App Information</h3>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span>Version</span>
                            <span>0.6.1</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>Last Updated</span>
                            <span>August 12, 2025</span>
                        </div>
                        <motion.div
                            className="p-4 mt-auto border-t border-border-primary dark:border-border-primary-dark"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8, duration: 0.6 }}
                        >
                            <div className="px-2 py-2 text-xs text-center text-gray-500 flex justify-around items-center lg:hidden">
                                <span className='p-2 rounded-full bg-blue-500 text-white text-lg hover:bg-white hover:text-blue-500 cursor-pointer transition-all hover:scale-150  hover:text-xl'><a href="https://github.com/Razen04/GateQuest" target="_blank" rel="noopener noreferrer"><FaGithub /></a></span>
                                <span className='p-2 rounded-full bg-blue-500 text-white text-lg hover:bg-white hover:text-blue-500 hover:scale-150 transition-all hover:text-xl cursor-pointer'><a href="https://www.reddit.com/r/GATEtard/" target="_blank" rel="noopener noreferrer"><FaReddit /></a></span>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AppSettings