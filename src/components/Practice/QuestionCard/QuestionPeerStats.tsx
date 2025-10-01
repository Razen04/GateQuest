import { SpinnerGap, ChartBar } from '@phosphor-icons/react';
import { usePeerBenchmark } from '../../../hooks/usePeerBenchmark.ts';

type QuestionPeerStatsType = {
    questionId: string | number;
};

const QuestionPeerStats = ({ questionId }: QuestionPeerStatsType) => {
    const { benchmarkDetails, loading, message } = usePeerBenchmark(questionId);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-6 text-gray-500 text-sm mb-2">
                <SpinnerGap className="animate-spin mr-2 h-5 w-5" weight="bold" />
                Loading stats...
            </div>
        );
    }

    if (message) {
        return (
            <div className="mt-4 mb-2 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-zinc-800 p-4 text-center shadow-sm text-gray-600 dark:text-gray-50">
                <ChartBar
                    className="mx-auto mb-2 h-6 w-6 text-gray-400 dark:text-gray-100"
                    weight="duotone"
                />
                {message}
            </div>
        );
    }

    if (!benchmarkDetails) {
        return null;
    }

    const { total_attempts, correct_attempts, avg_time_seconds } = benchmarkDetails;

    const correctPercent =
        total_attempts && correct_attempts
            ? Math.round((correct_attempts / total_attempts) * 100)
            : 0;

    const wrongPercent = 100 - correctPercent;

    return (
        <div className="mt-6 mb-2 rounded-2xl border border-gray-200 dark:border-gray-800 bg-primary dark:bg-primary-dark shadow-md">
            {/* Header */}
            <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 px-4 py-3">
                <ChartBar className="h-5 w-5 text-indigo-500" weight="duotone" />
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    Question Statistics
                </h2>
            </div>

            {/* Content */}
            <div className="space-y-4 p-4">
                {/* Progress Bar */}
                <div>
                    <div className="flex justify-between text-xs font-medium mb-1">
                        <span className="text-green-600">{correctPercent}% correct</span>
                        <span className="text-red-600">{wrongPercent}% wrong</span>
                    </div>
                    <div className="relative w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                            style={{ width: `${correctPercent}%` }}
                            className="absolute left-0 top-0 h-3 bg-green-500 transition-all duration-500"
                        />
                        <div
                            style={{ width: `${wrongPercent}%` }}
                            className="absolute right-0 top-0 h-3 bg-red-500 transition-all duration-500"
                        />
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                        <span className="text-xs text-gray-500 dark:text-gray-300">
                            Average Time Taken
                        </span>
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                            {avg_time_seconds ? `${avg_time_seconds.toFixed(1)}s` : '-'}
                        </span>
                    </div>
                    <div className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                        <span className="text-xs text-gray-500 dark:text-gray-300">
                            Number of people attempted
                        </span>
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                            {total_attempts}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuestionPeerStats;
