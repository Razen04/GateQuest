import { CheckCircleIcon, WarningCircleIcon } from '@phosphor-icons/react';
import React from 'react';

interface InstructionRuleCardProps {
    tone?: 'info' | 'warning';
    children?: React.ReactNode;
    text?: React.ReactNode;
}

export function InstructionRuleCard({
    tone = 'info',
    children,
    text,
}: InstructionRuleCardProps) {
    const isWarning = tone === 'warning';
    const Icon = isWarning ? WarningCircleIcon : CheckCircleIcon;
    const iconColor = isWarning ? 'text-chart-4' : 'text-chart-2';

    return (
        <div className="flex items-start gap-3 p-3 bg-card/40 border border-border">
            <Icon
                size={18}
                weight="fill"
                className={`${iconColor} shrink-0 mt-0.5`}
            />
            <p className="text-sm text-foreground leading-relaxed">
                {children || text}
            </p>
        </div>
    );
}
