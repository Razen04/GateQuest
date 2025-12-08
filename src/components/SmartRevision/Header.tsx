import * as React from 'react';
import { motion } from 'framer-motion';
import { containerVariants } from '../../utils/motionVariants.ts';

const Header = () => {
    return (
        <>
            {/* Header Section */}
            <motion.div
                variants={containerVariants}
                initial="initial"
                animate="animate"
                className="mb-8"
            >
                <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">
                        Smart{' '}
                        <span className="bg-gradient-to-br from-blue-400 to-blue-600 bg-clip-text text-transparent">
                            Revision
                        </span>
                    </h1>
                </div>
                <p className="text-gray-600 dark:text-gray-400 max-w-2xl">
                    Your personalized weekly recovery plan. Revision is must!
                </p>
            </motion.div>
        </>
    );
};

export default Header;
