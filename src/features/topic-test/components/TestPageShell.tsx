import { ArrowLeftIcon } from '@phosphor-icons/react';
import React from 'react';

interface TestPageShellProps {
    onBack: () => void;
    backLabel?: string;
    caption?: string;
    children: React.ReactNode;
    maxWidth?: string;
}

export function TestPageShell({
    onBack,
    backLabel = 'Back',
    caption,
    children,
    maxWidth = 'max-w-4xl',
}: TestPageShellProps) {
    return (
        <div
            className={`${maxWidth} mx-auto p-4 md:p-8 min-h-screen flex flex-col`}
        >
            <button
                onClick={onBack}
                className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-chart-1 mb-4 transition-colors"
            >
                <ArrowLeftIcon className="mr-2 h-4 w-4" />
                {backLabel}
            </button>
            {caption && (
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-1">
                    {caption}
                </p>
            )}
            {children}
        </div>
    );
}
