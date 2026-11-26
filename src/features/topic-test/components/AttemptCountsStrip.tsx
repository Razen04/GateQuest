import { CheckCircle, ListChecks, XCircle } from '@phosphor-icons/react';

type AttemptCountsStripProps = {
    attempted: number;
    correct: number;
    incorrect: number;
};

/**
 * Attempt breakdown shown on every result page, for all users regardless of
 * donor status. Keep these numbers server-derived (or derived from the
 * graded session) rather than from tier-gated analysis data.
 */
export function AttemptCountsStrip({
    attempted,
    correct,
    incorrect,
}: AttemptCountsStripProps) {
    const items = [
        {
            label: 'Questions Attempted',
            value: attempted,
            icon: ListChecks,
            accent: 'text-chart-1',
        },
        {
            label: 'Correct Attempts',
            value: correct,
            icon: CheckCircle,
            accent: 'text-chart-2',
        },
        {
            label: 'Incorrect Attempts',
            value: incorrect,
            icon: XCircle,
            accent: 'text-destructive',
        },
    ];

    console.log('items: ', items);

    return (
        <section className="border border-border bg-card/60 backdrop-blur-xl mb-6">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                <ListChecks
                    size={18}
                    weight="duotone"
                    className="text-chart-1"
                />
                <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                    Attempt Breakdown
                </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
                {items.map(({ label, value, icon: Icon, accent }) => (
                    <div key={label} className="px-4 py-5 text-center">
                        <Icon
                            size={20}
                            weight="duotone"
                            className={`${accent} mx-auto mb-2`}
                        />
                        <p
                            className={`text-3xl font-black tabular-nums ${accent}`}
                        >
                            {value}
                        </p>
                        <p className="mt-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            {label}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
}
