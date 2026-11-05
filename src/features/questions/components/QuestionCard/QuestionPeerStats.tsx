import { ChartBar, SpinnerGap } from '@phosphor-icons/react';
import type { Database } from '@/shared/types/supabase.ts';
import { formatTime } from '@/shared/utils/helper';

type BenchmarkData = Database['public']['Tables']['question_peer_stats']['Row'];

type QuestionPeerStatsType = {
    loading: boolean | undefined;
    message: string | null | undefined;
    data: BenchmarkData | null | undefined;
};

const QuestionPeerStats = ({
    loading,
    message,
    data,
}: QuestionPeerStatsType) => {
    if (loading) {
        return (
            <div className="flex items-center justify-center py-6 text-muted-foreground text-sm mb-2">
                <SpinnerGap
                    className="animate-spin mr-2 h-5 w-5"
                    weight="bold"
                />
                Loading stats...
            </div>
        );
    }

    if (message) {
        return (
            <div className="mt-4 mb-2 border border-dashed border-border bg-muted p-4 text-center shadow-sm text-muted-foreground">
                <ChartBar
                    className="mx-auto mb-2 h-6 w-6 text-muted-foreground"
                    weight="duotone"
                />
                {message}
            </div>
        );
    }

    if (!data) {
        return null;
    }

    const { total_attempts, correct_attempts, avg_time_seconds } = data;

    const safeTotal = total_attempts || 0;
    const safeCorrect = correct_attempts || 0;

    const correctPercent =
        safeTotal > 0 ? Math.round((safeCorrect / safeTotal) * 100) : 0;

    const wrongPercent = 100 - correctPercent;

    return (
        <div className="mt-6 mb-2 border border-border shadow-md">
            {/* Header */}
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                <ChartBar className="h-5 w-5 text-primary" weight="duotone" />
                <h2 className="text-lg font-semibold text-foreground">
                    Question Statistics
                </h2>
            </div>

            {/* Content */}
            <div className="space-y-4 p-4">
                {/* Progress Bar */}
                <div>
                    <div className="flex justify-between text-xs font-medium mb-1">
                        <span className="text-success">
                            {correctPercent}% correct
                        </span>
                        <span className="text-destructive">
                            {wrongPercent}% wrong
                        </span>
                    </div>
                    <div className="relative w-full bg-muted h-3 overflow-hidden">
                        <div
                            style={{ width: `${correctPercent}%` }}
                            className="absolute left-0 top-0 h-3 bg-success transition-all duration-500"
                        />
                        <div
                            style={{ width: `${wrongPercent}%` }}
                            className="absolute right-0 top-0 h-3 bg-destructive transition-all duration-500"
                        />
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex flex-col items-center p-3 bg-muted">
                        <span className="text-xs text-muted-foreground">
                            Average Time Taken
                        </span>
                        <span className="font-medium text-foreground">
                            {avg_time_seconds
                                ? `${formatTime(avg_time_seconds)}`
                                : '-'}
                        </span>
                    </div>
                    <div className="flex flex-col items-center p-3 bg-muted">
                        <span className="text-xs text-muted-foreground">
                            Number of people attempted
                        </span>
                        <span className="font-medium text-foreground">
                            {total_attempts}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuestionPeerStats;
