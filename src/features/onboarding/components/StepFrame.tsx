import { motion } from 'framer-motion';
import type React from 'react';
import { StepProgress } from './StepProgress';

type StepFrameProps = {
    title: string;
    subtitle?: string;
    currentStep: number;
    totalSteps: number;
    children: React.ReactNode;
    footer?: React.ReactNode;
};

export function StepFrame({
    title,
    subtitle,
    currentStep,
    totalSteps,
    children,
    footer,
}: StepFrameProps) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="mx-auto w-full max-w-5xl"
        >
            <StepProgress current={currentStep} total={totalSteps} />

            <div className="mt-10">
                <h1 className="font-['Space_Grotesk',sans-serif] text-2xl font-bold tracking-tight text-slate-900 md:text-3xl dark:text-white">
                    {title}
                </h1>
                {subtitle && (
                    <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-zinc-400">
                        {subtitle}
                    </p>
                )}
            </div>

            <div className="mt-8">{children}</div>

            {footer}
        </motion.div>
    );
}
