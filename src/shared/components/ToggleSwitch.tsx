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
            isOn ? 'bg-chart-1' : 'bg-muted'
        } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
    >
        <motion.div
            className="flex h-4 w-4 items-center justify-center bg-white shadow-sm"
            animate={{ x: isOn ? 20 : 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
            {isOn ? (
                <Check size={11} weight="bold" className="text-chart-1" />
            ) : (
                <X size={11} weight="bold" className="text-muted-foreground" />
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
                        ? 'border-destructive/30 bg-destructive/5 hover:border-destructive/40'
                        : 'border-border bg-muted/50 hover:border-muted-foreground/30'
                )}
            >
                <div className="flex items-center gap-3.5 pr-4">
                    {icon && (
                        <div
                            className={cn(
                                'flex h-10 w-10 shrink-0 items-center justify-center border transition-colors',
                                isDanger
                                    ? 'border-destructive/20 bg-destructive/10 text-destructive dark:bg-destructive/15'
                                    : isOn
                                      ? 'border-chart-1/30 bg-chart-1/10 text-chart-1 dark:bg-chart-1/20'
                                      : 'border-border bg-card text-muted-foreground'
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
                                    ? 'text-destructive'
                                    : 'text-foreground'
                            )}
                        >
                            {title}
                        </h4>

                        {description && (
                            <p className="text-xs text-muted-foreground">
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
            {label && <span className="text-sm text-foreground">{label}</span>}

            <Switch
                isOn={isOn}
                onToggle={onToggle}
                disabled={disabled ?? false}
            />
        </div>
    );
};

export default ToggleSwitch;
