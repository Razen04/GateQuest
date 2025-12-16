import React from 'react';
import { motion } from 'framer-motion';
import { itemVariants } from '../../utils/motionVariants.ts';

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
            className="p-6 shadow-sm border border-border-primary dark:border-border-primary-dark flex items-center"
        >
            <div className={`p-5.5 ${bgColor} mr-4`}>
                <Icon className={`h-6 w-6 ${iconColor}`} />
            </div>
            <div className="w-full">
                <h3 className="text-gray-500 dark:text-gray-100 text-base font-semibold">
                    {title}
                </h3>
                <div className="flex items-center mt-1">
                    <span className={`text-2xl font-bold ${textColor}`}>{value}</span>
                </div>
                <div className="w-full h-2 bg-gray-200 mt-1 overflow-hidden">
                    <div
                        className="h-full bg-blue-500 transition-all duration-300 ease-out"
                        style={{ width: value }}
                    ></div>
                </div>
            </div>
        </motion.div>
    );
};

export default StatCard;
