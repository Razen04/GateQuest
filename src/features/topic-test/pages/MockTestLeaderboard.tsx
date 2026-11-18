import { ArrowUpRightIcon, LockIcon, TrophyIcon } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '@/app/stores/useAuthStore';
import ModernLoader from '@/shared/components/ModernLoader';
import { Button } from '@/shared/components/ui/button';
import type { MockLeaderboardResponse } from '@/shared/types/mock';
import { getMockLeaderboard } from '../api/mockTest';
import { LeaderboardAvatar } from '../components/mock/leaderboard/LeaderboardAvatar';
import { RankBadge } from '../components/mock/leaderboard/RankBadge';
import MockResultsEmbargo from '../components/mock/MockResultsEmbargo';
import { TestPageShell } from '../components/TestPageShell';
import { formatCountdown } from '../utils/mockFormat';

const PICKER_PATH = '/topic-test-generate?tab=mocks';

type LeaderboardState = MockLeaderboardResponse | { error: string } | null;

export default function MockTestLeaderboard() {
    const { mockId } = useParams<{ mockId: string }>();
    const navigate = useNavigate();
    const user = useAuthStore((s) => s.user);
    const isLogin = !!user && user.id !== '1';

    const [data, setData] = useState<LeaderboardState>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!mockId) return;
        setLoading(true);
        try {
            const res = await getMockLeaderboard(mockId);
            setData(res);
        } catch (err) {
            console.error('[MockTestLeaderboard] fetch failed:', err);
            setData({ error: 'fetch_failed' });
        } finally {
            setLoading(false);
        }
    }, [mockId]);

    useEffect(() => {
        void fetchData();
    }, [fetchData]);

    if (!mockId) return <Navigate to={PICKER_PATH} replace />;
    if (!isLogin) return <Navigate to="/" replace />;

    if (loading && !data) return <ModernLoader />;
    if (!data) return <ModernLoader />;

    // ── Error branches ────────────────────────────────────
    if ('error' in data) {
        if (data.error === 'embargoed') {
            const resultsAt = (data as { results_at?: string }).results_at;

            return (
                <TestPageShell
                    onBack={() => navigate(PICKER_PATH)}
                    caption="The leaderboard unlocks when the mock window closes."
                >
                    {resultsAt ? (
                        <MockResultsEmbargo
                            resultsAt={resultsAt}
                            onReleased={() => void fetchData()}
                        />
                    ) : (
                        <div className="border border-border bg-card/60 p-6 text-center text-sm text-muted-foreground">
                            Results pending.
                        </div>
                    )}
                </TestPageShell>
            );
        }

        if (data.error === 'tier_required') {
            const minTier = (data as { min_tier?: number }).min_tier ?? 1;

            return (
                <TestPageShell
                    onBack={() => navigate(PICKER_PATH)}
                    caption="Leaderboard access"
                >
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
                </TestPageShell>
            );
        }

        if (data.error === 'mock_not_found') {
            return (
                <TestPageShell
                    onBack={() => navigate(PICKER_PATH)}
                    caption="Leaderboard"
                >
                    <div className="border border-border bg-card/60 p-8 text-center">
                        <h2 className="text-xl font-bold text-foreground mb-2">
                            Mock not found
                        </h2>
                        <p className="text-sm text-muted-foreground mb-6">
                            No leaderboard exists for this mock. It may have
                            been deleted or the ID is wrong.
                        </p>
                        <Button
                            variant="outline"
                            onClick={() => navigate(PICKER_PATH)}
                            className="rounded-none"
                        >
                            Back to Mock Tests
                        </Button>
                    </div>
                </TestPageShell>
            );
        }

        // fetch_failed or unknown
        return (
            <TestPageShell
                onBack={() => navigate(PICKER_PATH)}
                caption="Leaderboard"
            >
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
            </TestPageShell>
        );
    }

    // ── Success ───────────────────────────────────────────
    const { top, my_rank, total_participants } = data;
    const inTop = my_rank != null && top.some((e) => e.rank === my_rank);

    return (
        <TestPageShell onBack={() => navigate(PICKER_PATH)}>
            {/* Summary banner */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">
                        Leaderboard
                    </h1>
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

            {/* Table */}
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
                                const isMe = entry.user_id === user?.id;
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
                                        <td className="px-3 py-2.5">
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
                                            {entry.score}
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

            {/* Bottom actions */}
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
                    onClick={() => {
                        if (my_rank != null) {
                            // Best-effort: the result page re-derives the
                            // user's session from the catalog. If they
                            // re-attempted, this lands on the latest
                            // attempt; if not, on the first. Either way,
                            // the correct place.
                            navigate(`/mock-tests/${mockId}`);
                        }
                    }}
                    className="hidden"
                    aria-hidden
                >
                    View My Result
                    <ArrowUpRightIcon size={14} className="ml-1.5" />
                </Button>
            </div>
        </TestPageShell>
    );
}
