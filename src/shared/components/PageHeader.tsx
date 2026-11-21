import { motion } from 'framer-motion';
import * as React from 'react';
import { containerVariants } from '@/shared/utils/motionVariants';
import { Text, Title } from './ui/typography';

interface PageHeaderProps {
    primaryTitle: string;
    secondaryTitle: string;
    caption?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({
    primaryTitle,
    secondaryTitle,
    caption,
}) => {
    return (
        <motion.div
            variants={containerVariants}
            initial="initial"
            animate="animate"
            className="mb-2 font-sans"
        >
            <Title
                className="
                font-display
                text-3xl font-bold
                tracking-tight
                text-foreground
            "
            >
                {primaryTitle}{' '}
                <span
                    className="
                    bg-gradient-to-br
                    from-primary to-chart-1
                    bg-clip-text
                    text-transparent
                "
                >
                    {secondaryTitle}
                </span>
            </Title>

            {caption && (
                <Text
                    className="
                    font-sans
                    text-sm
                    text-muted-foreground
                "
                >
                    {caption}
                </Text>
            )}
        </motion.div>
    );
};

export default PageHeader;
