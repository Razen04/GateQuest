import { ArrowUpRightIcon, LockIcon, TrophyIcon } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/app/stores/useAuthStore';
import ModernLoader from '@/shared/components/ModernLoader';
import { Button } from '@/shared/components/ui/button';
import type { MockLeaderboardResponse } from '@/shared/types/mock';
import { getMockLeaderboard } from '../../../api/mockTest';
import { fmtNum, formatCountdown } from '../../../utils/mockFormat';
import MockResultsEmbargo from '../MockResultsEmbargo';
import { LeaderboardAvatar } from './LeaderboardAvatar';
import { RankBadge } from './RankBadge';

type LeaderboardState = MockLeaderboardResponse | { error: string } | null;

interface FullMockLeaderboardProps {
    mockId: string;
    /** Hide page-level navigation buttons when embedded in a result tab. */
    embedded?: boolean;
}

/**
 * The complete leaderboard (all ranked participants, not just the top five).
 * Shared by the dedicated leaderboard page and the result page's tab.
 */
export function FullMockLeaderboard({
    mockId,
    embedded = false,
}: FullMockLeaderboardProps) {
    const navigate = useNavigate();
    const userId = useAuthStore((s) => s.user?.id);

    const [data, setData] = useState<LeaderboardState>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getMockLeaderboard(mockId);
            setData(res);
        } catch (err) {
            console.error('[FullMockLeaderboard] fetch failed:', err);
            setData({ error: 'fetch_failed' });
        } finally {
            setLoading(false);
        }
    }, [mockId]);

    useEffect(() => {
        void fetchData();
    }, [fetchData]);

    if (loading && !data) {
        return embedded ? (
            <div className="border border-border bg-card/60 p-8 text-center text-sm text-muted-foreground animate-pulse">
                Loading leaderboard…
            </div>
        ) : (
            <ModernLoader />
        );
    }
    if (!data) return <ModernLoader />;

    if ('error' in data) {
        if (data.error === 'embargoed') {
            const resultsAt = (data as { results_at?: string }).results_at;
            return resultsAt ? (
                <MockResultsEmbargo
                    resultsAt={resultsAt}
                    onReleased={() => void fetchData()}
                />
            ) : (
                <div className="border border-border bg-card/60 p-6 text-center text-sm text-muted-foreground">
                    Results pending.
                </div>
            );
        }

        if (data.error === 'tier_required') {
            const minTier = (data as { min_tier?: number }).min_tier ?? 1;
            return (
                <div className="border border-chart-4/30 bg-chart-4/5 p-8 text-center">
                    <div className="inline-flex items-center justify-center h-14 w-14 bg-chart-4/10 text-chart-4 mb-4">
                        <LockIcon size={28} weight="fill" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground mb-2">
                        Leaderboard locked
                    </h2>
                    <p className="text-sm text-muted-foreground mb-6">
                        Leaderboard access requires tier {minTier}+ (₹50
                        cumulative). Beta mocks are free.
                    </p>
                    <Button
                        onClick={() => navigate('/donate')}
                        className="rounded-none bg-chart-4 text-white hover:bg-chart-4/90"
                    >
                        Learn About Supporter Perks
                    </Button>
                </div>
            );
        }

        if (data.error === 'mock_not_found') {
            return (
                <div className="border border-border bg-card/60 p-8 text-center">
                    <h2 className="text-xl font-bold text-foreground mb-2">
                        Mock not found
                    </h2>
                    <p className="text-sm text-muted-foreground mb-6">
                        No leaderboard exists for this mock. It may have been
                        deleted or the ID is wrong.
                    </p>
                    {!embedded && (
                        <Button
                            variant="outline"
                            onClick={() =>
                                navigate('/topic-test-generate?tab=mocks')
                            }
                            className="rounded-none"
                        >
                            Back to Mock Tests
                        </Button>
                    )}
                </div>
            );
        }

        return (
            <div className="border border-border bg-card/60 p-8 text-center">
                <p className="text-sm text-destructive mb-4">
                    Failed to load leaderboard.
                </p>
                <Button
                    variant="outline"
                    onClick={() => void fetchData()}
                    className="rounded-none"
                >
                    Retry
                </Button>
            </div>
        );
    }

    const { top, my_rank, total_participants } = data;
    const inTop = my_rank != null && top.some((e) => e.rank === my_rank);

    return (
        <div>
            {/* Summary banner */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <div>
                    <h2 className="text-xl font-bold text-foreground">
                        Leaderboard
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        {total_participants} participant
                        {total_participants === 1 ? '' : 's'} · ranked by score,
                        tiebreak by time
                    </p>
                </div>

                {my_rank != null && (
                    <div className="border border-chart-1 bg-chart-1/5 px-4 py-2 inline-flex items-center gap-2">
                        <TrophyIcon
                            size={16}
                            weight="fill"
                            className="text-chart-1"
                        />
                        <span className="text-xs uppercase tracking-wider text-muted-foreground">
                            Your rank
                        </span>
                        <span className="font-mono font-bold text-chart-1">
                            #{my_rank}
                            {!inTop && ` / ${total_participants}`}
                        </span>
                    </div>
                )}
            </div>

            {my_rank == null && (
                <div className="border border-border bg-muted/40 p-3 mb-4 text-xs text-muted-foreground">
                    You don't appear on this leaderboard — you haven't completed
                    a first attempt for this mock. Re-attempts don't count
                    toward the leaderboard.
                </div>
            )}

            {top.length === 0 ? (
                <div className="border border-border bg-card/60 p-8 text-center text-sm text-muted-foreground">
                    No ranked participants yet.
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-border overflow-hidden"
                >
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                            <tr>
                                <th className="text-left px-3 py-2.5 font-bold uppercase tracking-wider text-[10px] w-14">
                                    Rank
                                </th>
                                <th className="text-left px-3 py-2.5 font-bold uppercase tracking-wider text-[10px]">
                                    User
                                </th>
                                <th className="text-right px-3 py-2.5 font-bold uppercase tracking-wider text-[10px] w-20">
                                    Score
                                </th>
                                <th className="text-right px-3 py-2.5 font-bold uppercase tracking-wider text-[10px] w-24 hidden sm:table-cell">
                                    Time
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {top.map((entry) => {
                                const isMe = entry.user_id === userId;
                                return (
                                    <tr
                                        key={entry.user_id}
                                        className={`border-t border-border transition-colors ${
                                            isMe
                                                ? 'bg-chart-1/5'
                                                : 'hover:bg-muted/20'
                                        }`}
                                    >
                                        <td className="px-3 py-2.5">
                                            <RankBadge rank={entry.rank} />
                                        </td>
                                        <td className="px-4 py-3">
                                            <Link
                                                to={
                                                    entry.username
                                                        ? `/u/${entry.username}`
                                                        : '#'
                                                }
                                                onClick={(e) => {
                                                    if (!entry.username)
                                                        e.preventDefault();
                                                }}
                                                className="flex items-center gap-2.5 min-w-0 hover:opacity-80 transition-opacity"
                                            >
                                                <LeaderboardAvatar
                                                    entry={entry}
                                                />
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-medium text-foreground truncate">
                                                            {entry.name ||
                                                                entry.username ||
                                                                'Anonymous'}
                                                        </span>
                                                        {isMe && (
                                                            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-chart-1 text-white shrink-0">
                                                                You
                                                            </span>
                                                        )}
                                                    </div>
                                                    {entry.username &&
                                                        entry.name && (
                                                            <p className="text-[11px] text-muted-foreground truncate">
                                                                @
                                                                {entry.username}
                                                            </p>
                                                        )}
                                                </div>
                                            </Link>
                                        </td>
                                        <td className="px-3 py-2.5 text-right font-mono font-bold text-foreground">
                                            {fmtNum(entry.score)}
                                        </td>
                                        <td className="px-3 py-2.5 text-right font-mono text-muted-foreground hidden sm:table-cell">
                                            {formatCountdown(
                                                entry.time_seconds
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </motion.div>
            )}

            {my_rank != null && !inTop && (
                <p className="text-xs text-muted-foreground mt-3 text-center">
                    You're ranked #{my_rank} of {total_participants}. Only the
                    top 100 are shown above.
                </p>
            )}

            {!embedded && (
                <div className="flex flex-wrap gap-2 mt-6">
                    <Button
                        variant="outline"
                        onClick={() => navigate(`/mock-tests/${mockId}`)}
                        className="rounded-none"
                    >
                        Back to Mock
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => navigate(`/mock-tests/${mockId}`)}
                        className="hidden"
                        aria-hidden
                    >
                        View My Result
                        <ArrowUpRightIcon size={14} className="ml-1.5" />
                    </Button>
                </div>
            )}
        </div>
    );
}
