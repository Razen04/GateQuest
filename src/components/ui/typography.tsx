import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import type React from 'react';

const titleVariants = cva('font-bold tracking-tighter', {
    variants: {
        size: {
            default: 'text-2xl',
            sm: 'text-xl',
            lg: 'text-4xl',
            xl: 'text-5xl',
        },
    },
    defaultVariants: {
        size: 'default',
    },
});

export interface TitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
    size?: 'default' | 'sm' | 'lg' | 'xl';
}

export const Title = ({ className, size, ...props }: TitleProps) => {
    return <h1 className={cn(titleVariants({ size, className }))} {...props} />;
};

export const Text = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => {
    return <p className={cn('text-base leading-relaxed', className)} {...props} />;
};
