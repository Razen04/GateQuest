import type React from 'react';
import { Label } from '@/shared/components/ui/label';

type FormFieldProps = {
    label: string;
    tag?: string;
    children: React.ReactNode;
    className?: string;
};

export function FormField({ label, tag, children, className }: FormFieldProps) {
    return (
        <div className={`group relative space-y-2 ${className || ''}`}>
            <div className="flex items-center justify-between">
                <Label className="font-['Space_Grotesk',sans-serif] text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    {label}
                </Label>
                {tag && (
                    <span className="font-['JetBrains_Mono',monospace] text-[10px] font-medium text-slate-400">
                        {tag}
                    </span>
                )}
            </div>
            {children}
        </div>
    );
}
