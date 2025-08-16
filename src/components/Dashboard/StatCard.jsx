import React from 'react'
import { motion } from 'framer-motion';
import { itemVariants } from '../../utils/motionVariants';

const StatCard = ({ icon: Icon, title, value, quantity, iconColor, bgColor, textColor = "text-gray-800 dark:text-gray-100" }) => {

    return (
        <motion.div
            variants={itemVariants}
            initial="initial"
            animate="animate"
            className="p-6 rounded-xl shadow-sm border border-border-primary dark:border-border-primary-dark flex items-center"
        >
            <div className={`p-4 rounded-full ${bgColor} mr-4`}>
                <Icon className={`h-6 w-6 ${iconColor}`} />
            </div>
            <div className='w-full'>
                <h3 className="text-gray-500 dark:text-gray-100 text-sm">{title}</h3>
                <div className="flex items-center mt-1">
                    <span className={`text-2xl font-bold ${textColor}`}>{value}</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full mt-1 overflow-hidden">
                    <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${quantity}%` }}
                    ></div>
                </div>
            </div>
        </motion.div>
    )
}

export default StatCard