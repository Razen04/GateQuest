import { ArrowRight, Trophy } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { Button } from '@/shared/components/ui/button';
import type { MockLeaderboardResponse } from '@/shared/types/mock';
import { getMockLeaderboard } from '../../api/mockTest';
import { fmtNum, formatCountdown } from '../../utils/mockFormat';

interface MockLeaderboardSectionProps {
    mockId: string;
    isReAttempt?: boolean;
}

export default function MockLeaderboardSection({
    mockId,
    isReAttempt,
}: MockLeaderboardSectionProps) {
    const navigate = useNavigate();
    const userId = useAuthStore((s) => s.user?.id);

    const [data, setData] = useState<
        MockLeaderboardResponse | { error: string } | null
    >(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            const res = await getMockLeaderboard(mockId);
            if (!cancelled) {
                setData(res);
                setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [mockId]);

    if (loading) {
        return (
            <div className="border border-border bg-card/60 p-6 animate-pulse">
                <div className="h-4 bg-muted/40 w-32 mb-3" />
                <div className="h-24 bg-muted/20" />
            </div>
        );
    }

    // Silently hide on error (result page already shows relevant gates)
    if (!data || 'error' in data) return null;

    const { top, my_rank, total_participants } = data;
    const top5 = top.slice(0, 5);

    return (
        <div className="border border-border bg-card/60 backdrop-blur-2xl p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                    <Trophy
                        size={18}
                        className="text-chart-1"
                        weight="duotone"
                    />
                    <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                        Leaderboard
                    </h2>
                </div>
                {my_rank != null && (
                    <div className="text-sm">
                        <span className="text-muted-foreground">
                            {isReAttempt ? 'First-attempt rank' : 'Your rank'}:{' '}
                        </span>
                        <span className="font-mono font-bold text-chart-1">
                            #{my_rank}
                        </span>
                        <span className="text-muted-foreground">
                            {' '}
                            of {total_participants}
                        </span>
                    </div>
                )}
            </div>

            {top5.length === 0 ? (
                <p className="text-sm text-muted-foreground mb-4">
                    No ranked participants yet.
                </p>
            ) : (
                <div className="space-y-1 mb-4">
                    {top5.map((entry) => {
                        const isMe = entry.user_id === userId;
                        return (
                            <div
                                key={entry.user_id}
                                className={`flex items-center gap-3 px-2 py-1.5 text-sm ${
                                    isMe ? 'bg-chart-1/5' : ''
                                }`}
                            >
                                <span className="font-mono font-bold text-muted-foreground w-8 shrink-0">
                                    #{entry.rank}
                                </span>
                                <span className="flex-1 truncate text-foreground">
                                    {entry.name || entry.username}
                                    {isMe && (
                                        <span className="ml-1.5 text-[9px] font-bold bg-chart-1 text-white px-1 py-0.5 align-middle">
                                            YOU
                                        </span>
                                    )}
                                </span>
                                <span className="font-mono font-bold text-foreground">
                                    {fmtNum(entry.score)}
                                </span>
                                <span className="font-mono text-xs text-muted-foreground w-16 text-right">
                                    {formatCountdown(entry.time_seconds)}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}

            <Button
                variant="outline"
                onClick={() => navigate(`/mock-tests/${mockId}/leaderboard`)}
                className="rounded-none w-full"
            >
                View Full Leaderboard
                <ArrowRight size={14} className="ml-1.5" />
            </Button>

            {isReAttempt && my_rank != null && (
                <p className="text-xs text-muted-foreground mt-3 text-center">
                    Your rank reflects your first attempt. Re-attempts don't
                    appear on the leaderboard.
                </p>
            )}
        </div>
    );
}
