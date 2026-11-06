import { FlagIcon } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { formatTime } from '@/shared/utils/helper';
import type { FullAttempt } from '../../types/testTypes';

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
    const avgTime = (data.totalTime / data.attempts.length).toFixed(1);
    const accuracy = ((data.correct / data.attempts.length) * 100).toFixed(0);

    // BOX/CARD LAYOUT FOR TOPICS
    if (isTopic) {
        return (
            <div className="bg-card border border-border shadow-sm p-5 flex flex-col h-full hover:border-chart-2/50 transition-colors">
                <div className="flex flex-col gap-1 mb-5">
                    <div className="flex items-start justify-between">
                        <h3
                            className="font-black uppercase tracking-tight text-xs md:text-sm line-clamp-2 pr-4 flex-1 text-foreground"
                            title={title}
                        >
                            {title}
                        </h3>
                        <span className="text-[10px] font-bold text-muted-foreground whitespace-nowrap bg-muted px-1.5 py-0.5">
                            {data.attempts.length} Qs
                        </span>
                    </div>

                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-border">
                        <div className="flex gap-3 text-[10px] font-mono font-bold">
                            <span className="text-chart-2">
                                {accuracy}% ACC
                            </span>
                            <span className="text-muted-foreground">
                                {formatTime(Number(avgTime))} AVG
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 mt-auto">
                    {data.attempts.map((attempt: FullAttempt) => {
                        let styles = 'bg-muted text-muted-foreground';
                        if (attempt.status === 'answered' && attempt.is_correct)
                            styles =
                                'bg-chart-2/10 text-chart-2 border-chart-2/30';
                        else if (attempt.status === 'answered')
                            styles =
                                'bg-destructive/10 text-destructive border-destructive/30';

                        return (
                            <motion.button
                                key={attempt.question_id}
                                whileHover={{ scale: 1.1 }}
                                className={`relative flex items-center justify-center h-10 border transition-colors text-xs font-black ${styles}`}
                                onClick={() =>
                                    navigate(
                                        `/topic-test-review/${testId}/${attempt.originalIndex}`
                                    )
                                }
                                title={`Question ${attempt.originalIndex + 1} - ${formatTime(attempt.time_spent_seconds)}`}
                            >
                                {attempt.originalIndex + 1}
                                {attempt.marked_for_review && (
                                    <FlagIcon
                                        size={8}
                                        weight="fill"
                                        className="absolute -top-1 -right-1 text-chart-6"
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
            <div className="flex items-center justify-between p-4 border-l-4 bg-muted/50 border-chart-1">
                <h3 className="font-black uppercase tracking-tight text-sm md:text-base text-foreground">
                    {title}{' '}
                    <span className="text-muted-foreground font-medium text-xs ml-1">
                        ({data.attempts.length})
                    </span>
                </h3>
                <div className="flex gap-6 text-[10px] md:text-xs font-bold font-mono text-right">
                    <div>
                        <p className="text-muted-foreground uppercase">
                            Avg Time
                        </p>
                        <p className="text-chart-1">
                            {formatTime(Number(avgTime))}
                        </p>
                    </div>
                    <div>
                        <p className="text-muted-foreground uppercase">
                            Accuracy
                        </p>
                        <p className="text-chart-1">{accuracy}%</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                {data.attempts.map((attempt: FullAttempt) => {
                    let styles = 'bg-muted text-muted-foreground';
                    if (attempt.status === 'answered' && attempt.is_correct)
                        styles = 'bg-chart-2/10 text-chart-2 border-chart-2/30';
                    else if (attempt.status === 'answered')
                        styles =
                            'bg-destructive/10 text-destructive border-destructive/30';

                    return (
                        <motion.button
                            key={attempt.question_id}
                            whileHover={{ scale: 1.05 }}
                            className={`relative flex flex-col items-center justify-center h-14 border transition-colors ${styles}`}
                            onClick={() =>
                                navigate(
                                    `/topic-test-review/${testId}/${attempt.originalIndex}`
                                )
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
                                    className="absolute -top-1 -right-1 text-chart-6"
                                />
                            )}
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}
