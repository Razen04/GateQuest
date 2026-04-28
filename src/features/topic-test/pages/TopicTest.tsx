import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Clock, Play, CheckCircle, XCircle, Plus, Timer } from '@phosphor-icons/react';
import PageHeader from '@/shared/components/PageHeader';
import { containerVariants, itemVariants } from '@/shared/utils/motionVariants';
import { Button } from '@/shared/components/ui/button';
import { ArrowLeftIcon } from '@phosphor-icons/react';
import useTopicTestHubData from '@/features/topic-test/hooks/useTopicTestHubData';
import useAuth from '@/shared/hooks/useAuth';
import { toast } from 'sonner';
import { getUserProfile } from '@/shared/utils/helper';
import ModernLoader from '@/shared/components/ModernLoader';
import { useGoals } from '@/shared/hooks/useGoals';
import { useMemo, useState } from 'react';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
} from 'recharts';
import { ChartLineUpIcon } from '@phosphor-icons/react';
import { supabase } from '@/shared/utils/supabaseClient';
import { syncTestFromSupabaseToDexie } from '@/features/topic-test/services/testSyncService';

const getTestName = (completedAt?: string | null) => {
    if (!completedAt) return 'Untitled Test';

    const date = new Date(completedAt);

    return `Test – ${date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    })} • ${date.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
    })}`;
};

const TopicTest = () => {
    const navigate = useNavigate();
    const { userGoal } = useGoals();
    const { isLogin } = useAuth();
    if (!isLogin) {
        toast.error('You should be logged in to view this page.');
        navigate('/dashboard');
    }

    const user = getUserProfile();
    const userId = user?.id;
    const {
        loading,
        activeTest,
        history: testHistory,
    } = useTopicTestHubData(userId, userGoal?.branch_id);

    const [viewMode, setViewMode] = useState<'accuracy' | 'score'>('accuracy');

    const chartData = useMemo(() => {
        if (!testHistory) return [];

        return [...testHistory]
            .filter((t) => t.status === 'completed')
            .reverse()
            .map((t, idx) => ({
                attempt: idx + 1,
                date: new Date(t.completed_at!).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                }),
                accuracy: parseFloat(t.accuracy?.toFixed(2) || '0'),
                // Normalized Score Percentage to handle varying total marks
                scorePercent: t.score
                    ? parseFloat(((t.score / t.total_marks) * 100).toFixed(2))
                    : 0,
            }));
    }, [testHistory]);

    if (loading) {
        return <ModernLoader />;
    }

    const handleStartTest = async () => {
        try {
            const user = (await supabase.auth.getUser()).data.user;
            if (!user) throw new Error('No user');

            if (activeTest?.status === 'created') {
                const { error } = await supabase
                    .from('topic_tests')
                    .update({
                        status: 'ongoing',
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', activeTest?.id);

                if (error) throw error;
            }

            await syncTestFromSupabaseToDexie(user.id, userGoal?.branch_id);
            navigate(`/topic-test/${activeTest?.id}/attempt`);
        } catch (err) {
            console.error(err);
            toast.error('Failed to start test. Please check your connection.');
        }
    };

    const handleResume = () => {
        // Navigate to the active test UUID
        if (activeTest) navigate(`/topic-test/${activeTest.id}/attempt`);
    };

    const handleGenerateNew = () => {
        navigate('/topic-test-generate');
    };

    const onBack = () => {
        navigate('/dashboard');
    };

    // helper: format seconds to mm:ss
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    // helper: map status to icon & colors
    const getStatusDisplay = (status?: string) => {
        switch (status) {
            case 'completed':
            case 'passed':
                return {
                    icon: <CheckCircle size={20} weight="fill" />,
                    bg: 'bg-green-100',
                    text: 'text-green-600',
                    darkBg: 'dark:bg-green-900/30',
                    darkText: 'dark:text-green-400',
                };
            case 'failed':
                return {
                    icon: <XCircle size={20} weight="fill" />,
                    bg: 'bg-red-100',
                    text: 'text-red-600',
                    darkBg: 'dark:bg-red-900/30',
                    darkText: 'dark:text-red-400',
                };
            case 'ongoing':
            case 'paused':
            default:
                return {
                    icon: <Clock size={20} />,
                    bg: 'bg-gray-100',
                    text: 'text-gray-600',
                    darkBg: 'dark:bg-gray-900/30',
                    darkText: 'dark:text-gray-400',
                };
        }
    };

    return (
        <div className="max-h-dvh pb-40 flex flex-col text-slate-900 dark:text-slate-100">
            <div className="p-6">
                <button
                    onClick={onBack}
                    className="flex items-center mb-4 hover:text-blue-500 transition-colors cursor-pointer focus:outline-none"
                >
                    <ArrowLeftIcon className="mr-2" />
                    <span>Back</span>
                </button>
                <PageHeader
                    primaryTitle="Topic"
                    secondaryTitle="TestHub"
                    caption="Resume your practice or start a new drilling session."
                />
            </div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="w-full min-h-screen relative flex-1 flex flex-col gap-4 px-6"
            >
                <motion.div variants={itemVariants}>
                    {activeTest ? (
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                    In Progress
                                </h3>
                            </div>

                            <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-5 text-white shadow-lg relative overflow-hidden group">
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-blue-100 text-sm truncate max-w-52 md:max-w-3xl">
                                                {activeTest.topics?.length
                                                    ? activeTest.topics.join(', ')
                                                    : 'No Topics'}
                                            </h3>
                                        </div>
                                        <div className="bg-white/20 backdrop-blur-md px-3 py-1 flex items-center gap-2 text-xs font-mono">
                                            <Timer weight="fill" />
                                            {formatTime(activeTest.remaining_time_seconds ?? 0)}
                                        </div>
                                    </div>

                                    <div className="flex items-end justify-between">
                                        <div className="text-sm text-blue-100">
                                            <span className="font-bold text-white text-lg mr-1">
                                                {activeTest.status === 'ongoing' ||
                                                activeTest.status === 'paused'
                                                    ? 'In Progress'
                                                    : 'Not Started Yet'}
                                            </span>
                                        </div>

                                        {activeTest.status === 'ongoing' ? (
                                            <Button
                                                onClick={() => handleResume()}
                                                className="bg-white text-blue-500"
                                            >
                                                {' '}
                                                Resume
                                                <Play weight="fill" />
                                            </Button>
                                        ) : (
                                            <Button
                                                onClick={() => handleStartTest()}
                                                className="bg-white text-blue-500"
                                            >
                                                Start
                                                <Play weight="fill" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                    No Active Test
                                </h3>
                            </div>

                            <div className="bg-gray-100 dark:bg-gray-800 p-5 shadow-lg relative overflow-hidden group text-center">
                                <div className="relative z-10 flex flex-col items-center gap-4">
                                    <p className="text-gray-700 dark:text-gray-200 text-sm">
                                        You currently have no ongoing or paused test sessions.
                                    </p>

                                    <Button
                                        onClick={handleGenerateNew}
                                        className="bg-blue-600 text-white hover:bg-blue-700"
                                    >
                                        Start a New Test <Plus weight="bold" className="ml-2" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>

                <motion.div variants={itemVariants} className="my-8">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                            Progress Trends
                        </h3>

                        <div className="flex bg-zinc-100 dark:bg-zinc-900 p-2">
                            <button
                                onClick={() => setViewMode('accuracy')}
                                className={`px-3 py-2 text-sm font-bold uppercase transition-all ${
                                    viewMode === 'accuracy'
                                        ? 'bg-white dark:bg-zinc-800 shadow-sm text-blue-500'
                                        : 'text-slate-500'
                                }`}
                            >
                                Accuracy
                            </button>
                            <button
                                onClick={() => setViewMode('score')}
                                className={`px-3 py-2 text-sm font-bold uppercase transition-all ${
                                    viewMode === 'score'
                                        ? 'bg-white dark:bg-zinc-800 shadow-sm text-blue-500'
                                        : 'text-slate-500'
                                }`}
                            >
                                Performance %
                            </button>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 h-64 shadow-sm">
                        {chartData.length > 1 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient
                                            id="colorMetric"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="5%"
                                                stopColor="#3b82f6"
                                                stopOpacity={0.3}
                                            />
                                            <stop
                                                offset="95%"
                                                stopColor="#3b82f6"
                                                stopOpacity={0}
                                            />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        vertical={false}
                                        stroke="#e2e8f0"
                                        opacity={0.5}
                                    />
                                    <XAxis
                                        dataKey="date"
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{ fill: '#94a3b8' }}
                                    />
                                    <YAxis
                                        domain={[0, 100]}
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{ fill: '#94a3b8' }}
                                        tickFormatter={(val) => `${val}%`}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#1e293b',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontSize: '12px',
                                            color: '#f8fafc',
                                        }}
                                        itemStyle={{ color: '#60a5fa' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey={
                                            viewMode === 'accuracy' ? 'accuracy' : 'scorePercent'
                                        }
                                        stroke="#3b82f6"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorMetric)"
                                        animationDuration={1500}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-zinc-400">
                                <ChartLineUpIcon
                                    size={32}
                                    weight="duotone"
                                    className="mb-2 opacity-20"
                                />
                                <p className="text-xs italic">
                                    Complete at least 2 tests to see your progress graph
                                </p>
                            </div>
                        )}
                    </div>
                </motion.div>

                <motion.div variants={itemVariants} className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-semibold mb-2 uppercase tracking-wide text-gray-500 dark:text-gray-400">
                            Previous Attempts
                        </h3>
                    </div>

                    <div>
                        {testHistory?.length ? (
                            testHistory.map((test) => {
                                const { icon, bg, text, darkBg, darkText } = getStatusDisplay(
                                    test.status,
                                );
                                const testName = getTestName(test.completed_at);
                                const timeTookForTest = Math.round(
                                    Math.ceil(test.total_questions * 2.77) * 60 -
                                        test.remaining_time_seconds,
                                );
                                return (
                                    <div
                                        key={test.id}
                                        onClick={() => navigate(`/topic-test-result/${test.id}`)}
                                        className="bg-white my-2 dark:bg-zinc-900 border border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between hover:border-blue-500/50 transition-colors cursor-pointer group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div
                                                className={`p-2 rounded-full ${bg} ${text} ${darkBg} ${darkText}`}
                                            >
                                                {icon}
                                            </div>

                                            <div>
                                                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                                    {testName}
                                                </h3>

                                                <h4 className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                                    Time taken:{' '}
                                                    {test.total_questions &&
                                                    test.remaining_time_seconds
                                                        ? formatTime(timeTookForTest)
                                                        : '—'}
                                                </h4>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div
                                                className={`text-lg font-bold ${
                                                    test.accuracy !== undefined
                                                        ? test.accuracy >= 80
                                                            ? 'text-green-600 dark:text-green-400'
                                                            : test.accuracy < 40
                                                              ? 'text-red-500 dark:text-red-400'
                                                              : 'text-yellow-600 dark:text-yellow-400'
                                                        : 'text-gray-500 dark:text-gray-400'
                                                }`}
                                            >
                                                {test.accuracy?.toFixed(2) ?? 0}%
                                            </div>
                                            <p className="text-xs text-slate-400">
                                                {`${test.score?.toFixed(2)}/${test.total_marks}`}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                No previous attempts
                            </p>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default TopicTest;
