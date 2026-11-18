import type { MockLeaderboardEntry } from '@/shared/types/mock';

export function LeaderboardAvatar({ entry }: { entry: MockLeaderboardEntry }) {
    const ringCls =
        entry.tier === 3
            ? 'ring-2 ring-yellow-500/60'
            : entry.tier === 2
              ? 'ring-2 ring-slate-400/60'
              : entry.tier === 1
                ? 'ring-2 ring-amber-600/60'
                : 'ring-1 ring-border';

    if (entry.avatar) {
        return (
            <img
                src={entry.avatar}
                alt=""
                className={`h-7 w-7 rounded-full object-cover shrink-0 ${ringCls}`}
            />
        );
    }

    const initial = (entry.name || entry.username || '?')
        .charAt(0)
        .toUpperCase();
    return (
        <div
            className={`h-7 w-7 rounded-full bg-muted text-foreground flex items-center justify-center font-bold text-xs shrink-0 ${ringCls}`}
        >
            {initial}
        </div>
    );
}
