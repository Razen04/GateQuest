import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Clock, Play, CheckCircle, XCircle, Plus, Timer } from '@phosphor-icons/react';
import PageHeader from '@/components/ui/PageHeader';
import { containerVariants, itemVariants } from '@/utils/motionVariants';
import { Button } from '@/components/ui/button';
import { ArrowLeftIcon } from '@phosphor-icons/react';
import useTopicTestHubData from '@/hooks/topic-test/useTopicTestHubData';
import useAuth from '@/hooks/useAuth';
import { toast } from 'sonner';
import { getUserProfile } from '@/helper';
import ModernLoader from '@/components/ui/ModernLoader';

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
    const { isLogin } = useAuth();
    if (!isLogin) {
        toast.error('You should be logged in to view this page.');
        navigate('/dashboard');
    }

    const user = getUserProfile();
    const userId = user?.id;
    const { loading, activeTest, history: testHistory } = useTopicTestHubData(userId);

    if (loading) {
        return <ModernLoader />;
    }

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
                                                    : 'Start'}
                                            </span>
                                        </div>

                                        <Button
                                            onClick={() => handleResume()}
                                            className="bg-white text-blue-500"
                                        >
                                            {activeTest.status === 'ongoing' ||
                                            activeTest.status === 'paused'
                                                ? 'Resume'
                                                : 'Start'}{' '}
                                            <Play weight="fill" />
                                        </Button>
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
                                        className="bg-white mb-2 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between hover:border-blue-500/50 transition-colors cursor-pointer group"
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
                                                {test.accuracy ?? 0}%
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
