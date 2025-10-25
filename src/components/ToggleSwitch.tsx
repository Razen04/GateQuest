import React from 'react';
import { motion } from 'framer-motion';

type ToggleSwitchProp = {
    label: string;
    onToggle: () => void;
    isOn: boolean;
};

const ToggleSwitch = ({ label, onToggle, isOn }: ToggleSwitchProp) => {
    return (
        <div className="flex items-center justify-between py-3">
            <span>{label}</span>
            <button
                role="switch"
                aria-checked={isOn}
                onClick={onToggle}
                className={`w-12 h-6 flex cursor-pointer items-center rounded-full p-1 transition-all duration-300 ${
                    isOn
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                        : 'bg-gray-300 dark:bg-gray-700'
                }`}
            >
                <motion.div
                    className="bg-white w-4 h-4 rounded-full shadow-md"
                    animate={{ x: isOn ? 24 : 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
            </button>
        </div>
    );
};

export default ToggleSwitch;
