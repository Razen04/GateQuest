export function StrikeBadge({
    strikes,
    max,
}: {
    strikes: number;
    max: number;
}) {
    const danger = strikes >= max - 1;
    return (
        <div
            className={`fixed left-4 bottom-32 md:bottom-20 z-40 px-3 py-1.5 text-xs font-bold ${
                danger
                    ? 'bg-destructive text-white'
                    : strikes > 0
                      ? 'bg-chart-4 text-white'
                      : 'bg-muted text-foreground border border-border'
            }`}
        >
            Fullscreen strikes: {strikes} / {max}
        </div>
    );
}
