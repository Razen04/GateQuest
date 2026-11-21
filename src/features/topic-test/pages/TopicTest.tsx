import {
    ArrowLeftIcon,
    ChartLineUpIcon,
    CheckCircle,
    Clock,
    Play,
    Plus,
    Timer,
    XCircle,
} from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { toast } from 'sonner';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { useGoalStore } from '@/app/stores/useGoalStore';
import useTopicTestHubData from '@/features/topic-test/hooks/useTopicTestHubData';
import { syncTestFromSupabaseToDexie } from '@/features/topic-test/services/testSyncService';
import { getCurrentUser } from '@/shared/api/auth';
import ModernLoader from '@/shared/components/ModernLoader';
import PageHeader from '@/shared/components/PageHeader';
import { Button } from '@/shared/components/ui/button';
import { getDonorTier } from '@/shared/types/donor';
import type { TestSession } from '@/shared/types/storage';
import { formatTime } from '@/shared/utils/helper';
import { containerVariants, itemVariants } from '@/shared/utils/motionVariants';
import { updateTestStatus } from '../api/topicTest';

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
    const userGoal = useGoalStore((s) => s.userGoal);
    const isLogin = useAuthStore((s) => s.user !== null && s.user.id !== '1');

    if (!isLogin) {
        toast.error('You should be logged in to view this page.');
        navigate('/dashboard');
    }

    const userId = useAuthStore((s) => s.user?.id);
    const donorTier = getDonorTier(
        useAuthStore((s) => s.user?.notification_tags)
    );
    const {
        loading,
        loadingMore,
        hasMore,
        activeTest,
        history: testHistory,
        loadMore,
    } = useTopicTestHubData(userId, userGoal?.branch_id, donorTier);

    const [viewMode, setViewMode] = useState<'accuracy' | 'score'>('accuracy');

    // Donors can load their full history, but the progress chart stays
    // readable by only plotting the newest 10 attempts.
    const chartHistory = useMemo(() => testHistory.slice(0, 10), [testHistory]);

    const chartData = useMemo(() => {
        if (!chartHistory) return [];

        return [...chartHistory]
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
    }, [chartHistory]);

    function getDisplayRemainingSeconds(t: TestSession): number {
        const paperId = t.paper_id ?? '';
        const isMock =
            paperId.startsWith('mock-') && !paperId.includes('-practice-');

        if (!isMock || !t.mock_ends_at || !t.mock_duration_seconds) {
            return t.remaining_time_seconds ?? 0;
        }

        const now = Date.now();
        const endsAtMs = new Date(t.mock_ends_at).getTime();
        const durationSec = t.mock_duration_seconds;
        const startedAtMs = t.started_at
            ? new Date(t.started_at).getTime()
            : now;
        const elapsedSec = Math.floor((now - startedAtMs) / 1000);
        const remainingByDuration = durationSec - elapsedSec;
        const remainingByWindow = Math.floor((endsAtMs - now) / 1000);

        return Math.max(0, Math.min(remainingByDuration, remainingByWindow));
    }

    if (loading) {
        return <ModernLoader />;
    }

    const handleStartTest = async () => {
        if (!activeTest) return;

        const paperId = activeTest.paper_id ?? '';
        const isMock =
            paperId.startsWith('mock-') && !paperId.includes('-practice-');

        if (isMock) {
            navigate(`/mock-tests/attempt/${activeTest.id}`);
            return;
        }

        try {
            const user = await getCurrentUser();
            if (!user) throw new Error('No user');

            if (activeTest.status === 'created') {
                const { error } = await updateTestStatus(
                    activeTest.id,
                    'ongoing'
                );
                if (error) throw error;
            }

            await syncTestFromSupabaseToDexie(user.id, userGoal?.branch_id);
            navigate(`/topic-test/${activeTest.id}/attempt`);
        } catch (err) {
            console.error(err);
            toast.error('Failed to start test. Please check your connection.');
        }
    };

    const handleResume = () => {
        if (!activeTest) return;
        const paperId = activeTest.paper_id ?? '';
        const isMock =
            paperId.startsWith('mock-') && !paperId.includes('-practice-');

        if (isMock) {
            navigate(`/mock-tests/attempt/${activeTest.id}`);
        } else {
            navigate(`/topic-test/${activeTest.id}/attempt`);
        }
    };

    const handleGenerateNew = () => {
        navigate('/topic-test-generate');
    };

    // helper: map status to icon & colors
    const getStatusDisplay = (status?: string) => {
        switch (status) {
            case 'completed':
            case 'passed':
                return {
                    icon: <CheckCircle size={20} weight="fill" />,
                    cls: 'bg-chart-2/10 text-chart-2',
                };
            case 'failed':
                return {
                    icon: <XCircle size={20} weight="fill" />,
                    cls: 'bg-destructive/10 text-destructive',
                };
            default:
                return {
                    icon: <Clock size={20} />,
                    cls: 'bg-muted text-muted-foreground',
                };
        }
    };

    return (
        <div className="max-h-dvh pb-40 flex flex-col text-foreground max-w-7xl mx-auto">
            <div className="p-6">
                <motion.button
                    whileHover={{ x: -4 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => navigate('/dashboard')}
                    className="mb-4 group inline-flex items-center gap-2 border border-border bg-card/60 px-3.5 py-2 font-grotesk text-xs font-bold text-foreground shadow-sm backdrop-blur-md transition-colors hover:border-chart-1/30 hover:text-chart-1"
                >
                    <ArrowLeftIcon
                        size={16}
                        className="transition-transform group-hover:-translate-x-0.5"
                    />
                    <span>Back to Dashboard</span>
                </motion.button>

                <PageHeader
                    primaryTitle="Custom"
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
                            <div className="bg-white/20 backdrop-blur-md px-3 py-1 flex items-center gap-2 text-xs font-mono">
                                <Timer weight="fill" />
                                {formatTime(
                                    getDisplayRemainingSeconds(activeTest)
                                )}
                            </div>
                            <div className="bg-gradient-to-br from-chart-1 to-chart-1/70 backdrop-blur-2xl border border-white/20 p-5 text-white shadow-xl relative overflow-hidden">
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-white/80 text-sm truncate max-w-52 md:max-w-3xl">
                                            {activeTest.topics?.length
                                                ? activeTest.topics.join(', ')
                                                : 'No Topics'}
                                        </h3>
                                        <div className="bg-white/20 backdrop-blur-md px-3 py-1 flex items-center gap-2 text-xs font-mono">
                                            <Timer weight="fill" />
                                            {formatTime(
                                                activeTest.remaining_time_seconds ??
                                                    0
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-end justify-between">
                                        <div className="text-sm text-white/80">
                                            <span className="font-bold text-white text-lg mr-1">
                                                {activeTest.status ===
                                                    'ongoing' ||
                                                activeTest.status === 'paused'
                                                    ? 'In Progress'
                                                    : 'Not Started Yet'}
                                            </span>
                                        </div>

                                        {activeTest.status === 'ongoing' ? (
                                            <Button
                                                onClick={handleResume}
                                                className="bg-white/90 text-chart-1 rounded-none backdrop-blur-xl hover:bg-white hover:text-chart-1"
                                            >
                                                Resume <Play weight="fill" />
                                            </Button>
                                        ) : (
                                            <Button
                                                onClick={handleStartTest}
                                                className="bg-white/90 text-black rounded-none backdrop-blur-xl hover:bg-white hover:text-black"
                                            >
                                                Start <Play weight="fill" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                    No Active Test
                                </h3>
                            </div>

                            <div className="bg-card/50 backdrop-blur-2xl border border-border p-5 shadow-xl text-center">
                                <div className="flex flex-col items-center gap-4">
                                    <p className="text-muted-foreground text-sm">
                                        You currently have no ongoing or paused
                                        test sessions.
                                    </p>
                                    <Button
                                        onClick={handleGenerateNew}
                                        className="bg-chart-1 text-white rounded-none"
                                    >
                                        Start a New Test{' '}
                                        <Plus weight="bold" className="ml-2" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>

                <motion.div variants={itemVariants} className="my-8">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs md:text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                            Progress
                        </h3>

                        <div className="flex bg-muted/40 border border-border backdrop-blur-xl p-1">
                            <button
                                onClick={() => setViewMode('accuracy')}
                                className={`p-2 text-xs md:text-sm font-bold uppercase transition-all ${viewMode === 'accuracy' ? 'bg-card shadow-sm text-chart-1' : 'text-muted-foreground'}`}
                            >
                                Accuracy
                            </button>
                            <button
                                onClick={() => setViewMode('score')}
                                className={`p-2 text-xs md:text-sm font-bold uppercase transition-all ${viewMode === 'score' ? 'bg-card shadow-sm text-chart-1' : 'text-muted-foreground'}`}
                            >
                                Performance %
                            </button>
                        </div>
                    </div>

                    <div className="bg-card/50 backdrop-blur-2xl border border-border p-4 h-64 shadow-xl">
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
                                                stopColor="var(--chart-1)"
                                                stopOpacity={0.3}
                                            />
                                            <stop
                                                offset="95%"
                                                stopColor="var(--chart-1)"
                                                stopOpacity={0}
                                            />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        vertical={false}
                                        stroke="var(--border)"
                                        opacity={0.5}
                                    />
                                    <XAxis
                                        dataKey="date"
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{
                                            fill: 'var(--muted-foreground)',
                                        }}
                                    />
                                    <YAxis
                                        domain={[0, 100]}
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{
                                            fill: 'var(--muted-foreground)',
                                        }}
                                        tickFormatter={(val) => `${val}%`}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'var(--popover)',
                                            border: 'none',
                                            borderRadius: '12px',
                                            fontSize: '12px',
                                            color: 'var(--popover-foreground)',
                                        }}
                                        itemStyle={{
                                            color: 'var(--chart-1)',
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey={
                                            viewMode === 'accuracy'
                                                ? 'accuracy'
                                                : 'scorePercent'
                                        }
                                        stroke="var(--chart-1)"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorMetric)"
                                        animationDuration={1500}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                                <ChartLineUpIcon
                                    size={32}
                                    weight="duotone"
                                    className="mb-2 opacity-20"
                                />
                                <p className="text-xs italic">
                                    Complete at least 2 tests to see your
                                    progress graph
                                </p>
                            </div>
                        )}
                    </div>
                </motion.div>

                <motion.div variants={itemVariants} className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-semibold mb-2 uppercase tracking-wide text-muted-foreground">
                            Previous Attempts
                        </h3>
                    </div>

                    <div>
                        {testHistory?.length ? (
                            <>
                                {testHistory.map((test) => {
                                    const { icon, cls } = getStatusDisplay(
                                        test.status
                                    );

                                    // ─── Mock-aware name + time ───
                                    const paperId =
                                        (test as { paper_id?: string })
                                            .paper_id ?? '';
                                    const isMock =
                                        paperId.startsWith('mock-') &&
                                        !paperId.includes('-practice-');

                                    const testName =
                                        isMock && test.topics?.[0]
                                            ? test.topics[0]
                                            : getTestName(test.completed_at);

                                    const startedAt = (
                                        test as { started_at?: string | null }
                                    ).started_at;
                                    let timeTookSeconds: number | null = null;
                                    if (
                                        isMock &&
                                        startedAt &&
                                        test.completed_at
                                    ) {
                                        timeTookSeconds = Math.round(
                                            (new Date(
                                                test.completed_at
                                            ).getTime() -
                                                new Date(startedAt).getTime()) /
                                                1000
                                        );
                                    } else if (
                                        test.total_questions &&
                                        test.remaining_time_seconds
                                    ) {
                                        timeTookSeconds = Math.round(
                                            Math.ceil(
                                                test.total_questions * 2.77
                                            ) *
                                                60 -
                                                test.remaining_time_seconds
                                        );
                                    }

                                    return (
                                        <div
                                            key={test.id}
                                            onClick={() =>
                                                navigate(
                                                    `/topic-test-result/${test.id}`
                                                )
                                            }
                                            className="bg-card/50 backdrop-blur-xl border border-border p-4 my-2 flex items-center justify-between hover:border-chart-1/50 transition-colors cursor-pointer"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`p-2 ${cls}`}>
                                                    {icon}
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-semibold text-foreground">
                                                        {testName}
                                                    </h3>
                                                    <h4 className="text-xs text-muted-foreground flex items-center gap-2">
                                                        Time taken:{' '}
                                                        {timeTookSeconds != null
                                                            ? formatTime(
                                                                  timeTookSeconds
                                                              )
                                                            : '—'}
                                                    </h4>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <div
                                                    className={`text-lg font-bold ${test.accuracy !== undefined ? (test.accuracy >= 80 ? 'text-chart-2' : test.accuracy < 40 ? 'text-destructive' : 'text-chart-4') : 'text-muted-foreground'}`}
                                                >
                                                    {test.accuracy?.toFixed(
                                                        2
                                                    ) ?? 0}
                                                    %
                                                </div>
                                                <p className="text-xs text-muted-foreground">{`${test.score?.toFixed(2)}/${test.total_marks}`}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                                {hasMore && (
                                    <div className="flex justify-center pt-3">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={loadMore}
                                            disabled={loadingMore}
                                        >
                                            {loadingMore
                                                ? 'Loading…'
                                                : 'Load more attempts'}
                                        </Button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <p className="text-sm text-muted-foreground">
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
