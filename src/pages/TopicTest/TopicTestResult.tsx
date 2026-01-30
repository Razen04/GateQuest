import { useMemo } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Trophy,
    Target,
    Timer,
    ListChecks,
    ArrowRight,
    House,
    Flag,
    ArrowLeftIcon,
} from '@phosphor-icons/react';

import PageHeader from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { containerVariants, itemVariants } from '@/utils/motionVariants';
import type { Attempt, TestSession } from '@/types/storage';

type OutletContext = {
    session: TestSession;
    attempts: Attempt[];
};

const StatCard = ({
    label,
    value,
    subValue,
    icon: Icon,
}: {
    label: string;
    value: string | number;
    subValue?: string;
    icon: any;
}) => (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-5 shadow-sm flex items-start justify-between">
        <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                {label}
            </p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</h3>
            {subValue && <p className="text-xs text-slate-400 mt-1">{subValue}</p>}
        </div>

        <Icon size={22} weight="duotone" />
    </div>
);

export default function TopicTestResult() {
    const { testId } = useParams<{ testId: string }>();
    const navigate = useNavigate();
    const { session, attempts } = useOutletContext<OutletContext>();

    const stats = useMemo(() => {
        const correct = attempts.filter((a) => a.status === 'answered' && a.is_correct).length;
        const incorrect = attempts.filter((a) => a.status === 'answered' && !a.is_correct).length;
        const marked = attempts.filter((a) => a.marked_for_review).length;
        const skipped = attempts.filter(
            (a) => a.status === 'viewed' && !a.is_correct && !a.is_correct,
        ).length;
        const unvisited = attempts.filter((a) => a.status === 'unvisited').length;

        return {
            correct,
            incorrect,
            marked,
            skipped,
            unvisited,
        };
    }, [attempts]);

    const timeTakenSeconds = attempts.reduce((sum, a) => sum + (a.time_spent_seconds ?? 0), 0);

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}m ${s}s`;
    };

    const accuracy = session.accuracy ?? 0;

    return (
        <div className="min-h-screen pb-20">
            <div className="p-6">
                <button
                    onClick={() => navigate('/topic-test')}
                    className="flex items-center mb-4 text-sm hover:text-blue-500"
                >
                    <ArrowLeftIcon className="mr-2" />
                    Back
                </button>

                <PageHeader
                    primaryTitle="Topic Test"
                    secondaryTitle="Performance Report"
                    caption={session?.topics.join(', ') || 'Custom Test'}
                />
            </div>

            <motion.main
                className="max-w-5xl mx-auto px-6 space-y-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <h2 className="font-bold uppercase text-sm tracking-wide">Performance Overview</h2>

                <motion.div
                    variants={itemVariants}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
                >
                    <StatCard
                        label="Score"
                        value={`${session.score?.toFixed(1)}/${session.total_marks}`}
                        icon={Trophy}
                    />
                    <StatCard
                        label="Accuracy"
                        value={`${accuracy}%`}
                        subValue={`${stats.correct} Correct / ${session.attempted_count} Attempted`}
                        icon={Target}
                    />
                    <StatCard
                        label="Time Taken"
                        value={formatTime(timeTakenSeconds)}
                        subValue={`Avg ${(timeTakenSeconds / (session.attempted_count || 1)).toFixed(0)}s / Q`}
                        icon={Timer}
                    />
                    <StatCard
                        label="Attempt Rate"
                        value={`${Math.round((session.attempted_count / attempts.length) * 100)}%`}
                        subValue={`${session.attempted_count} of ${attempts.length}`}
                        icon={ListChecks}
                    />
                </motion.div>

                <motion.div
                    variants={itemVariants}
                    className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6"
                >
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                        <h3 className="font-bold">Question Analysis</h3>

                        <div className="flex flex-wrap gap-3 text-xs font-medium">
                            <Legend color="green" label="Correct" count={stats.correct} />
                            <Legend color="red" label="Incorrect" count={stats.incorrect} />
                            <Legend color="yellow" label="Marked" count={stats.marked} />
                            <Legend color="gray" label="Skipped" count={stats.skipped} />
                            <Legend color="zinc" label="Unvisited" count={stats.unvisited} />
                        </div>
                    </div>

                    <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-3">
                        {attempts.map((attempt, idx) => {
                            let styles = 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400';

                            if (attempt.status === 'answered' && attempt.is_correct)
                                styles = 'bg-green-100 text-green-700 dark:bg-green-900/30';
                            else if (attempt.status === 'answered')
                                styles = 'bg-red-100 text-red-600 dark:bg-red-900/30';
                            else if (attempt.status === 'viewed')
                                styles = 'bg-gray-200 text-gray-600 dark:bg-zinc-700';

                            return (
                                <motion.button
                                    key={attempt.question_id}
                                    whileHover={{ scale: 1.05 }}
                                    className={`relative h-12 border border-transparent hover:border-blue-500 font-bold ${styles}`}
                                    onClick={() => navigate(`/topic-test-review/${testId}/${idx}`)}
                                >
                                    {idx + 1}

                                    {attempt.marked_for_review && (
                                        <Flag
                                            size={12}
                                            weight="fill"
                                            className="absolute -top-1 -right-1 text-violet-500"
                                        />
                                    )}
                                </motion.button>
                            );
                        })}
                    </div>
                </motion.div>

                <motion.div variants={itemVariants} className="flex justify-center gap-4">
                    <Button variant="outline" onClick={() => navigate('/topic-test')}>
                        <House size={18} />
                        Back to TestHub
                    </Button>

                    <Button onClick={() => navigate(`/topic-test-review/${testId}/0`)}>
                        Review Solutions
                        <ArrowRight size={18} />
                    </Button>
                </motion.div>
            </motion.main>
        </div>
    );
}

function Legend({ color, label, count }: { color: string; label: string; count: number }) {
    return (
        <span className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full bg-${color}-500`} />
            {label}
            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-[10px]">
                {count}
            </span>
        </span>
    );
}
