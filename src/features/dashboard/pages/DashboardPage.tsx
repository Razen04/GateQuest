import {
    ArrowClockwiseIcon,
    ArrowRightIcon,
    CaretDownIcon,
    ChartLine,
    Compass,
    LightningIcon,
    Medal,
} from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// UI Components
import Login from '@/features/auth/components/Login';
import Branding from '@/shared/components/Branding';
import ModernLoader from '@/shared/components/ModernLoader';
import { Button } from '@/shared/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
// Hooks & Utilities
import useAuth from '@/shared/hooks/useAuth';
import { useGoals } from '@/shared/hooks/useGoals';
import { getUserProfile } from '@/shared/utils/helper';
import { containerVariants, itemVariants } from '@/shared/utils/motionVariants';
import { ContinueSessionWidget } from '../components/ContinueSessionWidget';
import StatCard from '../components/StatCard';
import StreakMap from '../components/StreakMap';
import StudyPlan from '../components/StudyPlan';
import SubjectStats from '../components/SubjectStats';
import { WebNotificationToggle } from '../components/WebNotificationToggle';
import useStats from '../hooks/useStats';

const Dashboard = () => {
    const { isLogin, loading } = useAuth();
    const { stats, loading: statsLoading } = useStats();
    const user = getUserProfile();
    const navigate = useNavigate();
    const { userGoal } = useGoals();

    const activeExams = useMemo(
        () => (userGoal?.target_exams as string[]) || [],
        [userGoal?.target_exams]
    );

    const [selectedExam, setSelectedExam] = useState(activeExams[0] || '');

    useEffect(() => {
        if (activeExams[0] && !selectedExam) {
            setSelectedExam(activeExams[0]);
        }
    }, [activeExams, selectedExam]);

    const currentSubjectStats = useMemo(
        () => stats?.subjectStatsMap?.[selectedExam.toUpperCase()] || [],
        [stats?.subjectStatsMap, selectedExam]
    );

    useEffect(() => {
        if (currentSubjectStats.length) {
            localStorage.setItem(
                'subjectStats',
                JSON.stringify(currentSubjectStats)
            );
        }
    }, [currentSubjectStats]);

    if (loading) {
        return (
            <div className="w-full h-dvh flex justify-center items-center bg-slate-50 dark:bg-zinc-950">
                <ModernLoader />
            </div>
        );
    }

    if (!isLogin) {
        return (
            <div className="flex justify-center items-center w-full min-h-dvh bg-slate-50 dark:bg-zinc-950">
                <div className="flex-1 flex justify-center items-center p-4">
                    <Login canClose={false} />
                </div>
            </div>
        );
    }

    const userProgress = stats?.progress || 0;
    const userAccuracy = stats?.accuracy || 0;

    return (
        <div className="min-h-dvh pb-32 px-4 sm:px-8 pt-6 max-w-7xl mx-auto space-y-8 select-none">
            <WebNotificationToggle />

            {/* HERO BENTO ROW */}
            <motion.div
                variants={containerVariants}
                initial="initial"
                animate="animate"
                className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch"
            >
                {/* Greeting Hero Card */}
                <motion.div
                    variants={itemVariants}
                    className="lg:col-span-8 relative overflow-hidden border border-slate-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900/80 p-6 sm:p-8 shadow-sm flex flex-col justify-between"
                >
                    {/* Subtle Top Inner Glow */}
                    <div className="pointer-events-none absolute -top-24 -right-24 h-60 w-60 bg-blue-500/10 blur-3xl dark:bg-blue-600/15" />

                    <div className="relative z-10 space-y-2">
                        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white font-['Space_Grotesk',sans-serif]">
                            Welcome back,{' '}
                            <span className="bg-blue-500 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-300">
                                {user?.name || 'Scholar'}
                            </span>
                        </h1>

                        <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-400 max-w-xl font-normal leading-relaxed">
                            You've completed{' '}
                            <span className="font-semibold text-slate-900 dark:text-white">
                                {userProgress}%
                            </span>{' '}
                            of your target syllabus. Stay focused on your weak
                            areas today.
                        </p>
                    </div>

                    {/* Integrated Quick Progress Bar */}
                    <div className="relative z-10 mt-6 pt-6 border-t border-slate-100 dark:border-zinc-800/80 flex items-center gap-4">
                        <div className="flex-1 space-y-1.5">
                            <div className="flex justify-between text-xs font-medium text-slate-500 dark:text-zinc-400 font-mono">
                                <span>SYLLABUS COVERAGE</span>
                                <span>{userProgress}%</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${userProgress}%` }}
                                    transition={{
                                        duration: 1.2,
                                        ease: 'easeOut',
                                    }}
                                    className="h-full bg-blue-500"
                                />
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Stat Highlights Bento */}
                <motion.div
                    variants={itemVariants}
                    className="lg:col-span-4 grid grid-cols-1 gap-4"
                >
                    <StatCard
                        icon={ChartLine}
                        title="Overall Progress"
                        value={`${userProgress}%`}
                        iconColor="text-blue-600 dark:text-blue-400"
                        bgColor="bg-blue-500/10"
                    />

                    <StatCard
                        icon={Medal}
                        title="Accuracy Rate"
                        value={`${userAccuracy}%`}
                        iconColor="text-indigo-600 dark:text-indigo-400"
                        bgColor="bg-indigo-500/10"
                    />
                </motion.div>
            </motion.div>

            {/* SMART ACTIONS SECTION */}
            <section className="space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 font-mono flex items-center gap-2">
                        <Compass size={14} weight="bold" />
                        <span>Smart Actions</span>
                    </h2>
                </div>

                <ContinueSessionWidget />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Topic Test */}
                    <motion.div
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.99 }}
                        className="group relative cursor-pointer overflow-hidden border border-slate-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-5 shadow-sm hover:border-blue-500/40 hover:shadow-md transition-all duration-200 flex items-center justify-between"
                        onClick={() => navigate('/topic-test')}
                    >
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center bg-blue-500/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400 group-hover:scale-105 transition-transform">
                                <LightningIcon size={24} weight="bold" />
                            </div>
                            <div>
                                <h3 className="font-['Space_Grotesk',sans-serif] font-bold text-slate-900 dark:text-white text-base">
                                    Topic Test
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-zinc-400">
                                    Target specific subject topics
                                </p>
                            </div>
                        </div>
                        <span className="hidden sm:inline-block border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-[10px] text-slate-400 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-500">
                            <ArrowRightIcon />
                        </span>
                    </motion.div>

                    {/* Smart Revision */}
                    <motion.div
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.99 }}
                        className="group relative cursor-pointer overflow-hidden border border-slate-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-5 shadow-sm hover:border-indigo-500/40 hover:shadow-md transition-all duration-200 flex items-center justify-between"
                        onClick={() => navigate('/revision')}
                    >
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center bg-indigo-500/10 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-400 group-hover:scale-105 transition-transform">
                                <ArrowClockwiseIcon size={24} weight="bold" />
                            </div>
                            <div>
                                <h3 className="font-['Space_Grotesk',sans-serif] font-bold text-slate-900 dark:text-white text-base">
                                    Smart Revision
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-zinc-400">
                                    Weak area practice
                                </p>
                            </div>
                        </div>
                        <span className="hidden sm:inline-block border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-[10px] text-slate-400 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-500">
                            <ArrowRightIcon />
                        </span>
                    </motion.div>
                </div>
            </section>

            {/* STUDY PLAN SECTION */}
            <section className="space-y-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 font-mono">
                    Target Study Roadmap
                </h2>
                <StudyPlan />
            </section>

            {/* STREAK MAP SECTION */}
            {!statsLoading && stats?.heatmapData?.length > 0 && (
                <section className="space-y-3">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 font-mono">
                        Consistency & Activity Heatmap
                    </h2>
                    <StreakMap stats={stats} />
                </section>
            )}

            {/* SUBJECT ANALYTICS WITH EXAM SWITCHER */}
            <section className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/80 dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 font-mono">
                            Subject Performance Overview
                        </h2>
                    </div>

                    {/* Active Exam Switcher Dropdown */}
                    {activeExams.length > 1 && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 gap-2 rounded-none border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-bold font-mono text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800"
                                >
                                    <span className="text-blue-600 dark:text-blue-400">
                                        EXAM:
                                    </span>
                                    <span>{selectedExam.toUpperCase()}</span>
                                    <CaretDownIcon size={12} weight="bold" />
                                </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent
                                align="end"
                                className="w-44 rounded-none border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl"
                            >
                                {activeExams.map((exam) => (
                                    <DropdownMenuItem
                                        key={exam}
                                        onClick={() => setSelectedExam(exam)}
                                        className={`text-xs font-mono font-semibold rounded-none cursor-pointer ${
                                            selectedExam === exam
                                                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                                : 'text-slate-600 dark:text-zinc-400'
                                        }`}
                                    >
                                        {exam.toUpperCase()}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>

                {/* Subject Stats Grid */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={selectedExam}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                    >
                        {currentSubjectStats.length > 0 ? (
                            <SubjectStats subjectStats={currentSubjectStats} />
                        ) : (
                            <div className="p-12 text-center border border-dashed border-slate-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/30">
                                <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium">
                                    No activity data logged yet for{' '}
                                    {selectedExam.toUpperCase()}.
                                </p>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </section>

            {/* Branding Footer */}
            <Branding className="w-full opacity-60 hover:opacity-100 transition-opacity" />
        </div>
    );
};

export default Dashboard;
