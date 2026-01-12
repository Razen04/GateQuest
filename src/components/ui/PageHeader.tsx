import * as React from 'react';
import { motion } from 'framer-motion';
import { containerVariants } from '@/utils/motionVariants';
import { Text, Title } from './typography';

interface PageHeaderProps {
    primaryTitle: string;
    secondaryTitle: string;
    caption?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ primaryTitle, secondaryTitle, caption }) => {
    return (
        <motion.div
            variants={containerVariants}
            initial="initial"
            animate="animate"
            className="mb-2"
        >
            <Title className="text-3xl font-bold">
                {primaryTitle}{' '}
                <span
                    className="
            bg-gradient-to-br from-blue-400 to-blue-600 bg-clip-text text-transparent"
                >
                    {secondaryTitle}
                </span>
            </Title>
            <Text className="text-gray-500">{caption}</Text>
        </motion.div>
    );
};

export default PageHeader;
