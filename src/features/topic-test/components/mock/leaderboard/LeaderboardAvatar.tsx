import { TieredAvatar } from '@/shared/components/TieredAvatar';
import type { MockLeaderboardEntry } from '@/shared/types/mock';

/**
 * Leaderboard avatar with the donor's animated tier frame when they have one.
 * The tier comes from the leaderboard RPC; non-donors get an ordinary avatar.
 */
export function LeaderboardAvatar({ entry }: { entry: MockLeaderboardEntry }) {
    const initial = (entry.name || entry.username || '?')
        .charAt(0)
        .toUpperCase();

    return (
        <TieredAvatar
            src={entry.avatar}
            alt={entry.name || entry.username || 'Participant'}
            tier={entry.tier}
            className="h-9 w-9 shrink-0"
            fallback={
                <div className="flex h-full w-full items-center justify-center bg-muted font-bold text-xs text-foreground">
                    {initial}
                </div>
            }
        />
    );
}
