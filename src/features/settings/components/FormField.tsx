import type React from 'react';
import { Label } from '@/shared/components/ui/label';

type FormFieldProps = {
    label: string;
    tag?: string;
    htmlFor?: string;
    children: React.ReactNode;
    className?: string;
    Icon?: React.ElementType;
};

export function FormField({
    label,
    tag,
    htmlFor,
    children,
    className,
    Icon,
}: FormFieldProps) {
    return (
        <div className={`group relative space-y-2 ${className || ''}`}>
            <div className="flex items-center justify-between">
                <Label
                    htmlFor={htmlFor}
                    className="font-grotesk text-xs font-bold uppercase tracking-wider text-foreground"
                >
                    {Icon && (
                        <Icon size={12} weight="bold" className="shrink-0" />
                    )}
                    {label}
                </Label>
                {tag && (
                    <span className="font-mono text-[10px] font-medium text-muted-foreground">
                        {tag}
                    </span>
                )}
            </div>
            {children}
        </div>
    );
}
