import React from 'react';
import { motion } from 'framer-motion';
import { itemVariants } from '@/shared/utils/motionVariants.ts';

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
    textColor = 'text-gray-800 dark:text-gray-100',
}: StatCardType) => {
    return (
        <motion.div
            variants={itemVariants}
            initial="initial"
            animate="animate"
            className="relative overflow-hidden border border-black/10 bg-white/20 p-4 backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-white/[0.06]"
        >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/20 to-transparent dark:from-white/5" />

            <div className="relative flex items-center">
                <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center border border-white/20 backdrop-blur-md mr-3 ${bgColor}`}
                >
                    <Icon className={`h-6 w-6 ${iconColor}`} />
                </div>

                <div className="w-full min-w-0">
                    <h3 className="truncate text-sm font-semibold text-muted-foreground">
                        {title}
                    </h3>

                    <div className="flex items-center mt-0.5">
                        <span className={`text-xl font-bold ${textColor}`}>{value}</span>
                    </div>

                    <div className="mt-2 h-1.5 w-full overflow-hidden bg-black/10 dark:bg-white/10">
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 ease-out"
                            style={{ width: value }}
                        />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default StatCard;
