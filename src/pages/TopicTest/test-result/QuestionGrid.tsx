import { motion } from 'framer-motion';
import { FlagIcon } from '@phosphor-icons/react';
import type { Attempt, Question } from '@/types/storage';

interface FullAttempt extends Attempt {
    questions: Question;
    originalIndex: number;
}

interface GroupData {
    attempts: FullAttempt[];
    totalTime: number;
    correct: number;
}

export function QuestionGrid({
    title,
    data,
    testId,
    navigate,
    isTopic = false,
}: {
    title: string;
    data: GroupData;
    testId: string;
    navigate: (path: string) => void;
    isTopic?: boolean;
}) {
    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}m ${Math.round(s)}s`;
    };

    const avgTime = (data.totalTime / data.attempts.length).toFixed(1);
    const accuracy = ((data.correct / data.attempts.length) * 100).toFixed(0);

    // BOX/CARD LAYOUT FOR TOPICS
    if (isTopic) {
        return (
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm p-5 flex flex-col h-full hover:border-emerald-500/50 transition-colors">
                <div className="flex flex-col gap-1 mb-5">
                    <div className="flex items-start justify-between">
                        <h3
                            className="font-black uppercase tracking-tight text-xs md:text-sm line-clamp-2 pr-4 flex-1"
                            title={title}
                        >
                            {title}
                        </h3>
                        <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                            {data.attempts.length} Qs
                        </span>
                    </div>

                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800">
                        <div className="flex gap-3 text-[10px] font-mono font-bold">
                            <span className="text-emerald-500">{accuracy}% ACC</span>
                            <span className="text-slate-500">
                                {formatTime(Number(avgTime))} AVG
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 mt-auto">
                    {data.attempts.map((attempt: FullAttempt) => {
                        let styles = 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400';
                        if (attempt.status === 'answered' && attempt.is_correct)
                            styles =
                                'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400';
                        else if (attempt.status === 'answered')
                            styles =
                                'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400';

                        return (
                            <motion.button
                                key={attempt.question_id}
                                whileHover={{ scale: 1.1 }}
                                className={`relative flex items-center justify-center h-10 border rounded-sm transition-colors text-xs font-black ${styles}`}
                                onClick={() =>
                                    navigate(
                                        `/topic-test-review/${testId}/${attempt.originalIndex}`,
                                    )
                                }
                                title={`Question ${attempt.originalIndex + 1} - ${formatTime(attempt.time_spent_seconds)}`}
                            >
                                {attempt.originalIndex + 1}
                                {attempt.marked_for_review && (
                                    <FlagIcon
                                        size={8}
                                        weight="fill"
                                        className="absolute -top-1 -right-1 text-violet-500"
                                    />
                                )}
                            </motion.button>
                        );
                    })}
                </div>
            </div>
        );
    }

    // ORIGINAL FULL-WIDTH LAYOUT FOR DIFFICULTY
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border-l-4 bg-slate-50 dark:bg-zinc-800/50 border-blue-500">
                <h3 className="font-black uppercase tracking-tight text-sm md:text-base">
                    {title}{' '}
                    <span className="text-slate-400 font-medium text-xs ml-1">
                        ({data.attempts.length})
                    </span>
                </h3>
                <div className="flex gap-6 text-[10px] md:text-xs font-bold font-mono text-right">
                    <div>
                        <p className="text-slate-400 uppercase">Avg Time</p>
                        <p className="text-blue-500">{formatTime(Number(avgTime))}</p>
                    </div>
                    <div>
                        <p className="text-slate-400 uppercase">Accuracy</p>
                        <p className="text-blue-500">{accuracy}%</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                {data.attempts.map((attempt: FullAttempt) => {
                    let styles = 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400';
                    if (attempt.status === 'answered' && attempt.is_correct)
                        styles =
                            'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400';
                    else if (attempt.status === 'answered')
                        styles =
                            'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400';

                    return (
                        <motion.button
                            key={attempt.question_id}
                            whileHover={{ scale: 1.05 }}
                            className={`relative flex flex-col items-center justify-center h-14 border rounded-sm transition-colors ${styles}`}
                            onClick={() =>
                                navigate(`/topic-test-review/${testId}/${attempt.originalIndex}`)
                            }
                        >
                            <span className="text-xs font-black mb-0.5">
                                {attempt.originalIndex + 1}
                            </span>
                            <span className="text-[10px] font-mono font-bold opacity-70">
                                {formatTime(attempt.time_spent_seconds)}
                            </span>
                            {attempt.marked_for_review && (
                                <FlagIcon
                                    size={10}
                                    weight="fill"
                                    className="absolute -top-1 -right-1 text-violet-500"
                                />
                            )}
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}
