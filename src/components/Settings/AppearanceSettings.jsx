import React, { useContext, useState } from 'react'
import { FaPallet, FaSun, FaMoon } from 'react-icons/fa'
import { motion, AnimatePresence } from 'framer-motion'
import Buttons from '../Buttons'
import ThemeContext from '../../context/ThemeContext'
import ToggleSwitch from '../ToggleSwitch'

const AppearanceSettings = () => {
    const { dark, toggleDarkMode } = useContext(ThemeContext);

    return (
        <div>
            <h2 className="text-2xl font-semibold mb-6 flex items-center">
                <FaPallet className="mr-2" /> Appearance
            </h2>

            <div className="space-y-6">
                <ToggleSwitch label="Dark Mode" onToggle={toggleDarkMode} isOn={dark} />

                <div className="flex items-center justify-between py-3">
                    <label className="block mb-2 text-lg">Font Size</label>
                    <div className='flex space-x-2'>
                        <Buttons children="Small" active={false} />
                        <Buttons children="Medium" active={true} />
                        <Buttons children="Large" active={false} />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AppearanceSettings