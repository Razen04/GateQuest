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
    ArrowLeftIcon,
    WarningCircle,
    PresentationChart,
    Shapes,
    Clock,
} from '@phosphor-icons/react';

import PageHeader from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { containerVariants, itemVariants } from '@/utils/motionVariants';
import type { Attempt, Question, TestSession } from '@/types/storage';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { QuestionGrid } from './test-result/QuestionGrid';

type OutletContext = {
    session: TestSession;
    attempts: Attempt[];
};

interface FullAttempt extends Attempt {
    questions: Question;
    originalIndex: number;
}

interface GroupData {
    attempts: FullAttempt[];
    totalTime: number;
    correct: number;
}

interface TypeGroupData {
    total: number;
    correct: number;
}

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

function SectionHeading({
    icon: Icon,
    title,
    color = 'text-slate-900 dark:text-slate-100',
}: {
    icon: any;
    title: string;
    color?: string;
}) {
    return (
        <div className="flex items-center gap-3">
            <Icon size={22} className={color} weight="duotone" />
            <h2 className={`font-black uppercase tracking-widest text-xs ${color}`}>{title}</h2>
        </div>
    );
}

export default function TopicTestResult() {
    const { testId } = useParams<{ testId: string }>();
    const navigate = useNavigate();
    const { session, attempts } = useOutletContext<OutletContext>();

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}m ${Math.round(s)}s`;
    };

    // 1. Unified Data Analysis Engine
    const analysis = useMemo(() => {
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

        attempts.forEach((a, idx) => {
            const q = (a as FullAttempt).questions; // Extract full question from attempt
            const diff = q?.difficulty || 'Medium';
            const topic = q?.topic || 'Uncategorized';
            const type =
                q?.question_type === 'multiple-choice'
                    ? 'MCQ'
                    : q?.question_type === 'multiple-select'
                      ? 'MSQ'
                      : 'NAT';

            const enrichedAttempt = { ...a, originalIndex: idx };

            // Difficulty grouping
            if (diffGroups[diff]) {
                diffGroups[diff].attempts.push(enrichedAttempt);
                diffGroups[diff].totalTime += a.time_spent_seconds || 0;
                if (a.is_correct) diffGroups[diff].correct++;
            }

            // Topic grouping with Question Buttons
            if (!topicGroups[topic]) {
                topicGroups[topic] = { attempts: [], totalTime: 0, correct: 0 };
            }
            topicGroups[topic].attempts.push(enrichedAttempt);
            topicGroups[topic].totalTime += a.time_spent_seconds || 0;
            if (a.is_correct) topicGroups[topic].correct++;

            // Question Type stats
            if (typeGroups[type]) {
                typeGroups[type].total++;
                if (a.is_correct) typeGroups[type].correct++;
            }
        });

        // Time Sinks Identification
        const globalAvg =
            attempts.reduce((acc, a) => acc + (a.time_spent_seconds || 0), 0) /
            (attempts.length || 1);

        const timeSinks = attempts
            .filter((a) => !a.is_correct && (a.time_spent_seconds || 0) > globalAvg * 1.5)
            .sort((a, b) => (b.time_spent_seconds || 0) - (a.time_spent_seconds || 0))
            .slice(0, 3);

        // Inside the analysis useMemo in TopicTestResult.tsx
        const pacingData = attempts.map((a, idx) => {
            let bgColor = '#808080';

            if (a.status === 'answered') {
                bgColor =
                    a.is_correct === true
                        ? '#10b981'
                        : a.is_correct === false
                          ? '#ef4444'
                          : '#808080';
            }

            return {
                name: `${idx + 1}`,
                time: a.time_spent_seconds || 0,
                isCorrect: a.is_correct,
                fill: bgColor,
            };
        });

        return { diffGroups, topicGroups, typeGroups, timeSinks, pacingData };
    }, [attempts]);

    return (
        <div className="min-h-screen pb-20 bg-slate-50/30 dark:bg-zinc-950/30">
            <div className="p-6 max-w-6xl mx-auto">
                <button
                    onClick={() => navigate('/topic-test')}
                    className="flex items-center mb-4 text-sm font-bold uppercase tracking-tight hover:text-blue-500 transition-colors"
                >
                    <ArrowLeftIcon className="mr-2" />
                    Exit Report
                </button>
                <PageHeader
                    primaryTitle="Topic Test"
                    secondaryTitle="Performance Report"
                    caption={
                        session?.topics?.length
                            ? `${session.topics.slice(0, 10).join(', ')}${
                                  session.topics.length > 10 ? '...' : ''
                              }`
                            : 'Custom Test'
                    }
                />
            </div>

            <motion.main
                className="max-w-6xl mx-auto px-6 space-y-12"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* 2. Overview Stats */}
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
                        value={`${session.accuracy?.toFixed(1)}%`}
                        icon={Target}
                    />
                    <StatCard
                        label="Time Taken"
                        value={formatTime(
                            attempts.reduce((sum, a) => sum + (a.time_spent_seconds ?? 0), 0),
                        )}
                        icon={Timer}
                    />
                    <StatCard
                        label="Attempted"
                        value={`${session.attempted_count}/${attempts.length}`}
                        icon={ListChecks}
                    />
                </motion.div>

                {/* 3. Difficulty-Wise Analysis (With Buttons) */}
                <motion.div variants={itemVariants} className="space-y-6">
                    <SectionHeading icon={PresentationChart} title="Difficulty Analysis" />
                    {Object.entries(analysis.diffGroups).map(
                        ([diff, data]: [string, GroupData]) =>
                            data.attempts.length > 0 && (
                                <QuestionGrid
                                    key={diff}
                                    title={diff}
                                    data={data}
                                    testId={testId!}
                                    navigate={navigate}
                                />
                            ),
                    )}
                </motion.div>

                {/* 4. Topic-Wise Performance (With Buttons) */}
                <motion.div variants={itemVariants} className="space-y-6">
                    <SectionHeading icon={ListChecks} title="Topic Breakdown" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Object.entries(analysis.topicGroups).map(
                            ([topic, data]: [string, GroupData]) => (
                                <QuestionGrid
                                    key={topic}
                                    title={topic}
                                    data={data}
                                    testId={testId!}
                                    navigate={navigate}
                                    isTopic
                                />
                            ),
                        )}
                    </div>
                </motion.div>

                {/* Pacing Analysis Graph */}
                <motion.div
                    variants={itemVariants}
                    className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 shadow-sm"
                >
                    <SectionHeading icon={Clock} title="Pacing Analysis" />
                    <p className="text-[10px] text-slate-400 font-bold mb-6 uppercase tracking-widest">
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
                                    tick={{ fill: '#94a3b8' }}
                                />
                                <YAxis
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fill: '#94a3b8' }}
                                />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0]?.payload;
                                            return (
                                                <div className="bg-slate-900 text-white p-2 text-[10px] font-bold rounded shadow-xl border border-slate-700">
                                                    QUESTION {data.name}: {data.time}s
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
                                <Bar dataKey="time" radius={[2, 2, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* 5. Strategy Insights: Time Sinks & Question Types */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <motion.div variants={itemVariants} className="space-y-6">
                        <SectionHeading
                            icon={WarningCircle}
                            title="Biggest Time Sinks"
                            color="text-rose-500"
                        />
                        <div className="space-y-3">
                            {analysis.timeSinks.length == 0 ? (
                                <p className="text-gray-500 text-sm">
                                    There are no timesinks in this test.
                                </p>
                            ) : (
                                analysis.timeSinks.map((sink, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center justify-between p-4 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center font-black text-xs">
                                                #{attempts.indexOf(sink) + 1}
                                            </div>
                                            <p className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase">
                                                {(sink as any).questions.topic}
                                            </p>
                                        </div>
                                        <p className="font-mono font-black text-rose-600">
                                            {formatTime(sink.time_spent_seconds)}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="space-y-6">
                        <SectionHeading icon={Shapes} title="Question Type Accuracy" />
                        <div className="grid grid-cols-3 gap-4">
                            {Object.entries(analysis.typeGroups).map(
                                ([type, data]: [string, TypeGroupData]) =>
                                    data.total > 0 && (
                                        <div
                                            key={type}
                                            className="p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-center"
                                        >
                                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">
                                                {type}
                                            </p>
                                            <p className="text-xl font-black text-blue-600">
                                                {((data.correct / data.total) * 100).toFixed(0)}%
                                            </p>
                                        </div>
                                    ),
                            )}
                        </div>
                    </motion.div>
                </div>

                {/* Navigation Footer */}
                <motion.div variants={itemVariants} className="flex justify-center gap-4 pt-8">
                    <Button variant="outline" onClick={() => navigate('/topic-test')}>
                        <House size={20} className="mr-2" /> Back to TestHub
                    </Button>
                    <Button onClick={() => navigate(`/topic-test-review/${testId}/0`)}>
                        Review Solutions <ArrowRight size={20} className="ml-2" />
                    </Button>
                </motion.div>
            </motion.main>
        </div>
    );
}
