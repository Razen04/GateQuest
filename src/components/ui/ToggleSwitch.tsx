import React from 'react';
import { motion } from 'framer-motion';
import { X, Check } from '@phosphor-icons/react';

type ToggleSwitchProp = {
    label?: string;
    onToggle: () => void;
    isOn: boolean;
};

const ToggleSwitch = ({ label, onToggle, isOn }: ToggleSwitchProp) => {
    return (
        <div className="flex items-center justify-between py-3">
            <span className="text-black dark:text-gray-100">{label}</span>
            <button
                onClick={onToggle}
                className={`w-12 h-6 flex cursor-pointer items-center p-1 transition-all duration-300 ${
                    isOn
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                        : 'bg-gray-300 dark:bg-gray-700'
                }`}
            >
                <motion.div
                    className="bg-white w-4 h-4 shadow-md flex items-center justify-center"
                    animate={{ x: isOn ? 24 : 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                >
                    {isOn ? (
                        <Check size={20} weight="bold" className="text-blue-600" />
                    ) : (
                        <X size={20} weight="bold" className="text-gray-500" />
                    )}
                </motion.div>
            </button>
        </div>
    );
};

export default ToggleSwitch;
