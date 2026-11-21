type StepProgressProps = {
    current: number;
    total: number;
};

export function StepProgress({ current, total }: StepProgressProps) {
    return (
        <div className="flex items-center justify-between gap-4">
            <div
                className="flex items-center gap-1.5"
                role="group"
                aria-label={`Step ${current} of ${total}`}
            >
                {Array.from({ length: total }).map((_, index) => {
                    const stepNumber = index + 1;
                    const isCurrent = stepNumber === current;
                    const isPast = stepNumber < current;

                    return (
                        <div
                            key={index}
                            aria-current={isCurrent ? 'step' : undefined}
                            className={`h-1.5 transition-all duration-300 ${
                                isCurrent
                                    ? 'w-6 bg-chart-1'
                                    : isPast
                                      ? 'w-1.5 bg-chart-1'
                                      : 'w-1.5 bg-muted'
                            }`}
                        />
                    );
                })}
            </div>
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {current} of {total}
            </span>
        </div>
    );
}
