import type { Variants } from 'framer-motion';

export const containerVariants: Variants = {
    initial: { opacity: 0, y: -20 },
    animate: {
        opacity: 1,
        y: 0,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2,
            duration: 0.6,
        },
    },
};

export const itemVariants: Variants = {
    initial: { opacity: 0, y: 20 },
    animate: {
        opacity: 1,
        y: 0,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2,
            duration: 0.6,
        },
    },
};

export const navItemVariants: Variants = {
    initial: { opacity: 0, x: -20 },
    animate: {
        opacity: 1,
        x: 0,
        transition: {
            duration: 0.6,
        },
    },
};

export const fadeInUp: Variants = {
    initial: { opacity: 0, y: -40 },
    animate: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.6,
            ease: 'easeOut',
        },
    },
};

export const stagger: Variants = {
    animate: {
        transition: {
            staggerChildren: 0.1,
        },
    },
};
