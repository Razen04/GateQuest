import { motion } from 'framer-motion';
import Login from '@/features/auth/components/Login';
import { getUserProfile } from '@/shared/utils/helper';
import ModernLoader from '@/shared/components/ModernLoader';
import StudyPlan from '../components/StudyPlan';
import StreakMap from '../components/StreakMap';
import StatCard from '../components/StatCard';
import SubjectStats from '../components/SubjectStats';
import {
    ChartLine,
    Medal,
    LightningIcon,
    ArrowClockwiseIcon,
    CaretDownIcon,
} from '@phosphor-icons/react';
import { containerVariants } from '@/shared/utils/motionVariants';
import useAuth from '@/shared/hooks/useAuth';
import useStats from '../hooks/useStats';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { useGoals } from '@/shared/hooks/useGoals';
import { useEffect, useMemo, useState } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import Branding from '@/shared/components/Branding';
import { WebNotificationToggle } from '../components/WebNotificationToggle';
import { ContinueSessionWidget } from '../components/ContinueSessionWidget';

const Dashboard = () => {
    const { isLogin, loading } = useAuth();
    const { stats, loading: statsLoading } = useStats();
    const user = getUserProfile();
    const navigate = useNavigate();
    const { userGoal } = useGoals();

    const activeExams = useMemo(
        () => (userGoal?.target_exams as string[]) || [],
        [userGoal?.target_exams],
    );

    const [selectedExam, setSelectedExam] = useState(activeExams[0] || '');

    useEffect(() => {
        if (activeExams[0] && !selectedExam) {
            setSelectedExam(activeExams[0]);
        }
    }, [activeExams, selectedExam]);

    const currentSubjectStats = useMemo(
        () => stats?.subjectStatsMap?.[selectedExam.toUpperCase()] || [],
        [stats?.subjectStatsMap, selectedExam],
    );

    useEffect(() => {
        if (currentSubjectStats.length) {
            localStorage.setItem('subjectStats', JSON.stringify(currentSubjectStats));
        }
    }, [currentSubjectStats]);

    if (loading) {
        return (
            <div className="w-full flex justify-center items-center text-gray-600">
                <ModernLoader />
            </div>
        );
    }

    if (!isLogin) {
        return (
            <div className="flex justify-center items-center w-full h-full">
                <div className="flex-1 flex justify-center items-center min-h-[60vh]">
                    <Login canClose={false} />
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 pb-40 h-dvh overflow-y-scroll bg-gradient-to-br from-white via-blue-50/40 to-white dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
            <WebNotificationToggle />

            <motion.div
                variants={containerVariants}
                initial="initial"
                animate="animate"
                className="mb-8"
            >
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">
                    Welcome back,{' '}
                    <span className="bg-gradient-to-br from-blue-400 to-blue-600 bg-clip-text text-transparent">
                        {user?.name}
                    </span>
                </h1>

                <p className="text-gray-600 dark:text-gray-400">
                    Your preparation journey is {stats?.progress}% complete. Keep going!
                </p>
            </motion.div>

            <section className="w-full mb-5">
                <ContinueSessionWidget />

                <h2 className="text-sm font-semibold uppercase tracking-wide mb-2">
                    Smart Actions
                </h2>

                <div className="grid grid-cols-2 gap-3">
                    <Button
                        onClick={() => navigate('/topic-test')}
                        className="flex items-center gap-3 font-semibold px-6 py-6 rounded-2xl border border-white/20 bg-white/40 dark:bg-white/10 backdrop-blur-xl shadow-lg hover:bg-white/60 dark:hover:bg-white/20 transition-all"
                    >
                        <LightningIcon size={22} weight="bold" />
                        Topic Test
                    </Button>

                    <Button
                        onClick={() => navigate('/revision')}
                        className="flex items-center gap-3 font-semibold px-6 py-6 rounded-2xl border border-white/20 bg-white/40 dark:bg-white/10 backdrop-blur-xl shadow-lg hover:bg-white/60 dark:hover:bg-white/20 transition-all"
                    >
                        <ArrowClockwiseIcon size={22} weight="bold" />
                        Smart Revision
                    </Button>
                </div>
            </section>

            <section>
                <h2 className="text-sm font-semibold uppercase tracking-wide mb-2">Overview</h2>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5"
                >
                    <StatCard
                        icon={ChartLine}
                        title="Overall Progress"
                        value={`${stats?.progress}%`}
                        iconColor="text-blue-500"
                        bgColor="bg-blue-50"
                    />

                    <StatCard
                        icon={Medal}
                        title="Overall Accuracy"
                        value={`${stats?.accuracy}%`}
                        iconColor="text-purple-500"
                        bgColor="bg-purple-50"
                    />
                </motion.div>
            </section>

            <section className="mb-5">
                <h2 className="text-sm font-semibold uppercase tracking-wide mb-2">Study Plan</h2>
                <StudyPlan />
            </section>

            {!statsLoading && stats?.heatmapData?.length > 0 && (
                <div>
                    {' '}
                    <h2 className="text-sm font-semibold uppercase tracking-wide mb-2">
                        Streak Map
                    </h2>
                    <StreakMap stats={stats} />
                </div>
            )}

            <section className="mt-6 mb-4">
                {activeExams.length > 1 && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="group rounded-xl border border-white/20 bg-white/30 dark:bg-white/10 backdrop-blur-xl shadow-md"
                            >
                                <span className="font-semibold text-blue-600 dark:text-blue-400">
                                    {selectedExam.toUpperCase()}
                                </span>

                                <CaretDownIcon
                                    size={14}
                                    weight="bold"
                                    className="ml-2 transition-transform group-data-[state=open]:rotate-180"
                                />
                            </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent
                            align="end"
                            className="w-40 rounded-xl border border-white/20 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl shadow-xl"
                        >
                            {activeExams.map((exam) => (
                                <DropdownMenuItem
                                    key={exam}
                                    onClick={() => setSelectedExam(exam)}
                                    className={`rounded-lg ${
                                        selectedExam === exam
                                            ? 'bg-blue-500/10 text-blue-600 font-semibold'
                                            : ''
                                    }`}
                                >
                                    {exam.toUpperCase()}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </section>

            {currentSubjectStats.length > 0 ? (
                <div>
                    <h2 className="text-sm font-semibold uppercase tracking-wide mb-2">
                        Subject Stats
                    </h2>

                    <SubjectStats subjectStats={currentSubjectStats} />
                </div>
            ) : (
                <div className="p-12 text-center rounded-3xl border border-dashed border-white/20 bg-white/30 dark:bg-white/5 backdrop-blur-xl">
                    <p className="text-gray-500">No data found for {selectedExam} subjects.</p>
                </div>
            )}

            <Branding className="mt-4 w-full" />
        </div>
    );
};

export default Dashboard;
