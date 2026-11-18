import React from 'react';

interface StatMetricCardProps {
    label: string;
    value: string;
    sub?: string | undefined;
    accent?: string;
    icon?: React.ComponentType<{
        size?: number;
        weight?: string;
        className?: string;
    }>;
}

export function StatMetricCard({
    label,
    value,
    sub,
    accent = 'text-foreground',
    icon: Icon,
}: StatMetricCardProps) {
    return (
        <div className="border border-border bg-card/60 backdrop-blur-xl p-4 flex items-start justify-between">
            <div>
                <div className={`flex items-center gap-1.5 mb-1 ${accent}`}>
                    {Icon && <Icon size={14} weight="duotone" />}
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                        {label}
                    </span>
                </div>
                <p className={`text-2xl font-bold ${accent}`}>{value}</p>
                {sub && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {sub}
                    </p>
                )}
            </div>
        </div>
    );
}
