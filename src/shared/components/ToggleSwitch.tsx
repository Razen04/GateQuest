import { Check, X } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import type React from 'react';
import { cn } from '../utils/cn';

type SwitchProps = {
    isOn: boolean;
    onToggle: () => void;
    disabled?: boolean;
};

type ToggleSwitchProps = {
    isOn: boolean;
    onToggle: () => void;
    disabled?: boolean;
    label?: string;
    icon?: React.ReactNode;
    title?: string;
    description?: string;
    isDanger?: boolean;
};

const Switch = ({ isOn, onToggle, disabled }: SwitchProps) => (
    <button
        onClick={onToggle}
        disabled={disabled}
        className={`flex h-5 w-10 items-center p-0.5 transition-all duration-300 ${
            isOn
                ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                : 'bg-gray-300 dark:bg-zinc-700'
        } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
    >
        <motion.div
            className="flex h-4 w-4 items-center justify-center bg-white shadow-sm"
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
);

const ToggleSwitch = ({
    label,
    icon,
    title,
    description,
    isOn,
    onToggle,
    disabled,
    isDanger,
}: ToggleSwitchProps) => {
    if (title) {
        return (
            <motion.div
                whileHover={{ scale: disabled ? 1 : 1.005 }}
                whileTap={{ scale: disabled ? 1 : 0.995 }}
                className={cn(
                    'group relative flex items-center justify-between border p-4 transition-all',
                    isDanger
                        ? 'border-red-300/60 bg-red-50/50 hover:border-red-400 dark:border-red-500/20 dark:bg-red-500/5 dark:hover:border-red-500/40'
                        : 'border-slate-900/10 bg-slate-50/50 hover:border-slate-300 dark:border-white/10 dark:bg-white/[0.02] dark:hover:border-white/20'
                )}
            >
                <div className="flex items-center gap-3.5 pr-4">
                    {icon && (
                        <div
                            className={cn(
                                'flex h-10 w-10 shrink-0 items-center justify-center border transition-colors',
                                isDanger
                                    ? 'border-red-500/20 bg-red-500/10 text-red-500 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-400'
                                    : isOn
                                      ? 'border-[#2A5CFF]/30 bg-[#2A5CFF]/10 text-[#2A5CFF] dark:bg-[#2A5CFF]/20 dark:text-blue-400'
                                      : 'border-slate-900/10 bg-white text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400'
                            )}
                        >
                            {icon}
                        </div>
                    )}

                    <div className="space-y-0.5">
                        <h4
                            className={cn(
                                "font-['Space_Grotesk',sans-serif] text-sm font-bold",
                                isDanger
                                    ? 'text-red-600 dark:text-red-400'
                                    : 'text-slate-900 dark:text-white'
                            )}
                        >
                            {title}
                        </h4>

                        {description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {description}
                            </p>
                        )}
                    </div>
                </div>

                <div className="shrink-0">
                    <Switch
                        isOn={isOn}
                        onToggle={onToggle}
                        disabled={disabled ?? false}
                    />
                </div>
            </motion.div>
        );
    }

    // Standalone Mode
    return (
        <div className="flex items-center justify-between py-1.5">
            {label && (
                <span className="text-sm text-gray-800 dark:text-gray-100">
                    {label}
                </span>
            )}

            <Switch
                isOn={isOn}
                onToggle={onToggle}
                disabled={disabled ?? false}
            />
        </div>
    );
};

export default ToggleSwitch;
