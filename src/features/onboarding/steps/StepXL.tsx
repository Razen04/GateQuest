import { useState } from 'react';
import useGoal from '@/shared/hooks/useGoal';
import { StepFooter } from '../components/StepFooter';
import type { XLFormData } from '../types';

type StepXLProps = {
    defaultValue: XLFormData;
    onNext: (data: XLFormData) => void;
    onBack: () => void;
    isFirst: boolean;
    isLast: boolean;
};

export function StepXL({ defaultValue, onNext, onBack, isFirst }: StepXLProps) {
    const { optionalSubjects } = useGoal();
    const [selected, setSelected] = useState<string[]>(
        defaultValue.xlOptionals
    );

    const toggle = (id: string) => {
        setSelected((prev) => {
            if (prev.includes(id)) return prev.filter((s) => s !== id);
            if (prev.length >= 2) return prev;
            return [...prev, id];
        });
    };

    const isValid = selected.length === 2;

    return (
        <>
            <div className="space-y-2">
                {optionalSubjects.map((subject) => {
                    const isSelected = selected.includes(subject.id);
                    const isDisabled = !isSelected && selected.length >= 2;

                    return (
                        <label
                            key={subject.id}
                            className={`flex cursor-pointer items-center gap-3 border p-3 transition-colors ${
                                isSelected
                                    ? 'border-chart-1 bg-chart-1/5'
                                    : 'border-border hover:border-muted-foreground/40'
                            } ${isDisabled ? 'cursor-not-allowed opacity-50' : ''}`}
                        >
                            <input
                                type="checkbox"
                                checked={isSelected}
                                disabled={isDisabled}
                                onChange={() => toggle(subject.id)}
                                className="h-4 w-4 accent-chart-1"
                            />
                            <span className="font-grotesk text-sm text-foreground">
                                {subject.name}
                            </span>
                        </label>
                    );
                })}
            </div>

            <p className="mt-3 text-xs text-muted-foreground">
                Select exactly two. {selected.length}/2 chosen.
            </p>

            <StepFooter
                onBack={isFirst ? undefined : onBack}
                onNext={() => onNext({ xlOptionals: selected })}
                isNextDisabled={!isValid}
            />
        </>
    );
}
