import {
    Clock,
    ListChecks,
    PresentationChart,
    Shapes,
    WarningCircle,
} from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Bar,
    BarChart,
    Cell,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { formatTime } from '@/shared/utils/helper';
import { itemVariants } from '@/shared/utils/motionVariants';
import type { FullAttempt } from '../../types/testTypes';
import { getDisplayNumber, getDisplayTotal } from '../../utils/questionPalette';
import { QuestionGrid } from './QuestionGrid';

interface GroupData {
    attempts: FullAttempt[];
    totalTime: number;
    correct: number;
}

interface TypeGroupData {
    total: number;
    correct: number;
}

interface TestAnalysisBodyProps {
    attempts: FullAttempt[];
    testId: string;
}

function SectionHeading({
    icon: Icon,
    title,
    color = 'text-foreground',
}: {
    icon: React.ComponentType<{
        size?: number;
        weight?: string;
        className?: string;
    }>;
    title: string;
    color?: string;
}) {
    return (
        <div className="flex items-center gap-3">
            <Icon size={22} className={color} weight="duotone" />
            <h2
                className={`font-black uppercase tracking-widest text-xs ${color}`}
            >
                {title}
            </h2>
        </div>
    );
}

export default function TestAnalysisBody({
    attempts,
    testId,
}: TestAnalysisBodyProps) {
    const navigate = useNavigate();

    const analysis = useMemo(() => {
        const sortedAttempts = [...attempts].sort(
            (a, b) => (a.attempt_order ?? 0) - (b.attempt_order ?? 0)
        );

        const orderedQuestions = sortedAttempts
            .map((a) => (a as FullAttempt).questions)
            .filter((q): q is NonNullable<typeof q> => Boolean(q));

        const diffGroups: Record<string, GroupData> = {
            Easy: { attempts: [], totalTime: 0, correct: 0 },
            Medium: { attempts: [], totalTime: 0, correct: 0 },
            Hard: { attempts: [], totalTime: 0, correct: 0 },
        };

        const topicGroups: Record<string, GroupData> = {};
        const typeGroups: Record<string, TypeGroupData> = {
            MCQ: { total: 0, correct: 0 },
            MSQ: { total: 0, correct: 0 },
            NAT: { total: 0, correct: 0 },
        };

        sortedAttempts.forEach((a, idx) => {
            const q = (a as FullAttempt).questions;
            const diff = q?.difficulty || 'Medium';
            const topic = q?.topic || 'Uncategorized';
            const type =
                q?.question_type === 'multiple-choice'
                    ? 'MCQ'
                    : q?.question_type === 'multiple-select'
                      ? 'MSQ'
                      : 'NAT';

            const enrichedAttempt: FullAttempt = {
                ...a,
                originalIndex: idx,
                displayNumber: getDisplayNumber(orderedQuestions, idx),
                displayTotal: getDisplayTotal(orderedQuestions, idx),
            };

            if (diffGroups[diff]) {
                diffGroups[diff].attempts.push(enrichedAttempt);
                diffGroups[diff].totalTime += a.time_spent_seconds || 0;
                if (a.is_correct) diffGroups[diff].correct++;
            }

            if (!topicGroups[topic]) {
                topicGroups[topic] = {
                    attempts: [],
                    totalTime: 0,
                    correct: 0,
                };
            }
            topicGroups[topic].attempts.push(enrichedAttempt);
            topicGroups[topic].totalTime += a.time_spent_seconds || 0;
            if (a.is_correct) topicGroups[topic].correct++;

            if (typeGroups[type]) {
                typeGroups[type].total++;
                if (a.is_correct) typeGroups[type].correct++;
            }
        });

        const globalAvg =
            sortedAttempts.reduce(
                (acc, a) => acc + (a.time_spent_seconds || 0),
                0
            ) / (sortedAttempts.length || 1);

        const timeSinks = sortedAttempts
            .filter(
                (a) =>
                    !a.is_correct &&
                    (a.time_spent_seconds || 0) > globalAvg * 1.5
            )
            .sort(
                (a, b) =>
                    (b.time_spent_seconds || 0) - (a.time_spent_seconds || 0)
            )
            .slice(0, 3);

        const pacingData = sortedAttempts.map((a, idx) => {
            let bgColor = 'var(--muted-foreground)';

            if (a.status === 'answered') {
                bgColor =
                    a.is_correct === true
                        ? 'var(--chart-2)'
                        : a.is_correct === false
                          ? 'var(--destructive)'
                          : 'var(--muted-foreground)';
            }

            return {
                name: `${idx + 1}`,
                time: a.time_spent_seconds || 0,
                isCorrect: a.is_correct,
                fill: bgColor,
            };
        });

        return {
            diffGroups,
            topicGroups,
            typeGroups,
            timeSinks,
            pacingData,
            sortedAttempts,
        };
    }, [attempts]);

    if (attempts.length === 0) {
        return (
            <p className="text-sm text-muted-foreground">
                No attempts recorded yet.
            </p>
        );
    }

    return (
        <div className="space-y-12">
            {/* Difficulty Analysis */}
            <motion.div variants={itemVariants} className="space-y-6">
                <SectionHeading
                    icon={PresentationChart}
                    title="Difficulty Analysis"
                />
                {Object.entries(analysis.diffGroups).map(
                    ([diff, data]) =>
                        data.attempts.length > 0 && (
                            <QuestionGrid
                                key={diff}
                                title={diff}
                                data={data}
                                testId={testId}
                                navigate={navigate}
                            />
                        )
                )}
            </motion.div>

            {/* Topic Breakdown */}
            <motion.div variants={itemVariants} className="space-y-6">
                <SectionHeading icon={ListChecks} title="Topic Breakdown" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.entries(analysis.topicGroups).map(
                        ([topic, data]) => (
                            <QuestionGrid
                                key={topic}
                                title={topic}
                                data={data}
                                testId={testId}
                                navigate={navigate}
                                isTopic
                            />
                        )
                    )}
                </div>
            </motion.div>

            {/* Pacing Analysis */}
            <motion.div variants={itemVariants}>
                <SectionHeading icon={Clock} title="Pacing Analysis" />
                <p className="text-[10px] text-muted-foreground font-bold mb-6 uppercase tracking-widest">
                    Time Spent per Question (Seconds)
                </p>

                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analysis.pacingData}>
                            <XAxis
                                dataKey="name"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                tick={{
                                    fill: 'var(--muted-foreground)',
                                }}
                            />
                            <YAxis
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                tick={{
                                    fill: 'var(--muted-foreground)',
                                }}
                            />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                content={({ active, payload }) => {
                                    if (active && payload?.length) {
                                        const data = payload[0]?.payload;
                                        return (
                                            <div className="bg-popover text-popover-foreground p-2 text-[10px] font-bold shadow-xl border border-border">
                                                QUESTION {data.name}:{' '}
                                                {data.time}s
                                                <br />
                                                RESULT:{' '}
                                                {data.isCorrect
                                                    ? 'CORRECT'
                                                    : data.isCorrect === false
                                                      ? 'INCORRECT'
                                                      : 'SKIPPED'}
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Bar dataKey="time" radius={[2, 2, 0, 0]}>
                                {analysis.pacingData.map((entry, i) => (
                                    <Cell key={i} fill={entry.fill} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            {/* Time Sinks + Question Type Accuracy */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <motion.div variants={itemVariants} className="space-y-6">
                    <SectionHeading
                        icon={WarningCircle}
                        title="Biggest Time Sinks"
                        color="text-destructive"
                    />
                    <div className="space-y-3">
                        {analysis.timeSinks.length === 0 ? (
                            <p className="text-muted-foreground text-sm">
                                There are no timesinks in this test.
                            </p>
                        ) : (
                            analysis.timeSinks.map((sink, i) => (
                                <div
                                    key={i}
                                    className="flex items-center justify-between p-4 bg-destructive/5 border border-destructive/20"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 bg-destructive text-white flex items-center justify-center font-black text-xs">
                                            #
                                            {analysis.sortedAttempts.indexOf(
                                                sink
                                            ) + 1}
                                        </div>
                                        <p className="text-xs font-bold text-destructive uppercase">
                                            {(sink as FullAttempt).questions
                                                ?.topic || 'Unknown Topic'}
                                        </p>
                                    </div>
                                    <p className="font-mono font-black text-destructive">
                                        {formatTime(sink.time_spent_seconds)}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-6">
                    <SectionHeading
                        icon={Shapes}
                        title="Question Type Accuracy"
                    />
                    <div className="grid grid-cols-3 gap-4">
                        {Object.entries(analysis.typeGroups).map(
                            ([type, data]) =>
                                data.total > 0 && (
                                    <div
                                        key={type}
                                        className="p-4 bg-card border border-border text-center"
                                    >
                                        <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">
                                            {type}
                                        </p>
                                        <p className="text-xl font-black text-chart-1">
                                            {(
                                                (data.correct / data.total) *
                                                100
                                            ).toFixed(0)}
                                            %
                                        </p>
                                    </div>
                                )
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
