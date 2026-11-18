import { CrownIcon } from '@phosphor-icons/react';

export function RankBadge({ rank }: { rank: number }) {
    const tier =
        rank === 1
            ? 'gold'
            : rank === 2
              ? 'silver'
              : rank === 3
                ? 'bronze'
                : 'plain';

    const cls =
        tier === 'gold'
            ? 'bg-yellow-500/15 text-yellow-600 border-yellow-500/30'
            : tier === 'silver'
              ? 'bg-slate-400/15 text-slate-600 border-slate-400/30'
              : tier === 'bronze'
                ? 'bg-amber-700/15 text-amber-700 border-amber-700/30'
                : 'bg-muted text-muted-foreground border-border';

    return (
        <div
            className={`inline-flex items-center justify-center min-w-8 h-8 px-1.5 border font-mono font-bold text-xs ${cls}`}
        >
            {tier === 'gold' && (
                <CrownIcon size={12} weight="fill" className="mr-0.5" />
            )}
            #{rank}
        </div>
    );
}
