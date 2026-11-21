import { motion } from 'framer-motion';
import React from 'react';
import { itemVariants } from '@/shared/utils/motionVariants';

type StatCardType = {
    icon: React.ElementType;
    title: string;
    value: string;
    iconColor: string;
    bgColor: string;
    textColor?: string;
};

const StatCard = ({
    icon: Icon,
    title,
    value,
    iconColor,
    bgColor,
    textColor = 'text-card-foreground',
}: StatCardType) => {
    // Extract percentage when the value represents progress.
    const percentage = value.endsWith('%')
        ? Math.min(100, Math.max(0, Number.parseFloat(value) || 0))
        : null;

    return (
        <motion.div
            variants={itemVariants}
            initial="initial"
            animate="animate"
            className="
                relative overflow-hidden
                border border-border
                bg-card/80
                p-4
                shadow-sm
                backdrop-blur-xl backdrop-saturate-150
                transition-colors duration-200
            "
        >
            {/* Subtle glass highlight */}
            <div
                className="
                    pointer-events-none absolute inset-0
                    bg-gradient-to-b
                    from-foreground/[0.035]
                    to-transparent
                "
            />

            <div className="relative flex items-center">
                {/* Icon Container */}
                <div
                    className={`
                        mr-3 flex h-12 w-12 shrink-0
                        items-center justify-center
                        border border-border/70
                        backdrop-blur-md
                        ${bgColor}
                    `}
                >
                    <Icon className={`h-6 w-6 ${iconColor}`} />
                </div>

                {/* Stat Information */}
                <div className="w-full min-w-0">
                    <h3 className="truncate text-sm font-semibold text-muted-foreground">
                        {title}
                    </h3>

                    <div className="mt-0.5 flex items-center">
                        <span className={`text-xl font-bold ${textColor}`}>
                            {value}
                        </span>
                    </div>

                    {/* Progress Indicator */}
                    {percentage !== null && (
                        <div className="mt-2 h-1.5 w-full overflow-hidden bg-muted">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                transition={{
                                    duration: 0.8,
                                    ease: 'easeOut',
                                }}
                                className="h-full bg-primary"
                            />
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default StatCard;
