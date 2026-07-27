import { motion } from 'framer-motion';
import { X, Check } from '@phosphor-icons/react';

type ToggleSwitchProp = {
    label?: string;
    onToggle: () => void;
    isOn: boolean;
    disabled?: boolean;
};

const ToggleSwitch = ({ label, onToggle, isOn, disabled }: ToggleSwitchProp) => {
    return (
        <div className="flex items-center justify-between py-1.5">
            <span className="text-sm text-gray-800 dark:text-gray-100">{label}</span>

            <button
                onClick={onToggle}
                disabled={disabled}
                className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-all duration-300 ${
                    isOn
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                        : 'bg-gray-300 dark:bg-zinc-700'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
                <motion.div
                    className="w-4 h-4 bg-white rounded-full shadow-sm flex items-center justify-center"
                    animate={{ x: isOn ? 20 : 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                >
                    {isOn ? (
                        <Check size={11} weight="bold" className="text-blue-600" />
                    ) : (
                        <X size={11} weight="bold" className="text-gray-500" />
                    )}
                </motion.div>
            </button>
        </div>
    );
};

export default ToggleSwitch;
