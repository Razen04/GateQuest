import {
    ArrowClockwiseIcon,
    ArrowRightIcon,
    ArrowUpRightIcon,
    ChartLine,
    Compass,
    LightningIcon,
    Medal,
} from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { useStatsStore } from '@/app/stores/useStatsStore';
// UI Components
import Login from '@/features/auth/components/Login';
import Branding from '@/shared/components/Branding';
import ModernLoader from '@/shared/components/ModernLoader';
// Hooks & Utilities
import { containerVariants, itemVariants } from '@/shared/utils/motionVariants';
import { ContinueSessionWidget } from '../components/ContinueSessionWidget';
import StatCard from '../components/StatCard';
import StreakMap from '../components/StreakMap';
import StudyPlan from '../components/StudyPlan';
import { WebNotificationToggle } from '../components/WebNotificationToggle';

const Dashboard = () => {
    const isLogin = useAuthStore((s) => s.user !== null && s.user.id !== '1');

    const loading = useAuthStore((s) => s.loading);
    const stats = useStatsStore((s) => s.stats);
    const statsLoading = useStatsStore((s) => s.loading);
    const user = useAuthStore((s) => s.user);

    const navigate = useNavigate();

    useEffect(() => {
        useStatsStore.getState().updateStats();
    }, []);

    if (loading) {
        return (
            <div className="flex h-dvh w-full items-center justify-center bg-background">
                <ModernLoader />
            </div>
        );
    }

    if (!isLogin) {
        return (
            <div className="flex min-h-dvh w-full items-center justify-center bg-background">
                <div className="flex flex-1 items-center justify-center p-4">
                    <Login canClose={false} />
                </div>
            </div>
        );
    }

    const userProgress = stats?.progress || 0;
    const userAccuracy = stats?.accuracy || 0;

    return (
        <div className="mx-auto min-h-dvh max-w-7xl space-y-8 px-4 pt-6 pb-32 select-none sm:px-8">
            <WebNotificationToggle />

            {/* HERO BENTO ROW */}
            <motion.div
                variants={containerVariants}
                initial="initial"
                animate="animate"
                className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-12"
            >
                {/* Greeting Hero Card */}
                <motion.div
                    variants={itemVariants}
                    className="relative flex flex-col justify-between overflow-hidden border border-border bg-card p-6 shadow-sm sm:p-8 lg:col-span-8"
                >
                    {/* Subtle Top Inner Glow */}
                    <div className="pointer-events-none absolute -top-24 -right-24 h-60 w-60 bg-primary/10 blur-3xl" />

                    <div className="relative z-10 space-y-2">
                        <h1 className="font-['Sora',sans-serif] text-2xl font-extrabold tracking-tight text-card-foreground sm:text-4xl">
                            Welcome back,{' '}
                            <span className="text-sidebar-primary">
                                {user?.name || 'Scholar'}
                            </span>
                        </h1>

                        <p className="max-w-xl text-sm leading-relaxed font-normal text-muted-foreground sm:text-base">
                            You've completed{' '}
                            <span className="font-semibold text-primary">
                                {userProgress}%
                            </span>{' '}
                            of your target syllabus. Stay focused on your weak
                            areas today.
                        </p>
                    </div>

                    {/* Integrated Quick Progress Bar */}
                    <div className="relative z-10 mt-6 flex items-center gap-4 border-t border-border pt-6">
                        <div className="flex-1 space-y-1.5">
                            <div className="flex justify-between font-mono text-xs font-medium text-muted-foreground">
                                <span>SYLLABUS COVERAGE</span>
                                <span>{userProgress}%</span>
                            </div>

                            <div className="h-2 w-full overflow-hidden bg-muted">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${userProgress}%` }}
                                    transition={{
                                        duration: 1.2,
                                        ease: 'easeOut',
                                    }}
                                    className="h-full bg-primary"
                                />
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Stat Highlights Bento */}
                <motion.div
                    variants={itemVariants}
                    className="grid grid-cols-1 gap-4 lg:col-span-4"
                >
                    <StatCard
                        icon={ChartLine}
                        title="Overall Progress"
                        value={`${userProgress}%`}
                        iconColor="text-primary"
                        bgColor="bg-primary/10"
                    />

                    <StatCard
                        icon={Medal}
                        title="Accuracy Rate"
                        value={`${userAccuracy}%`}
                        iconColor="text-chart-3"
                        bgColor="bg-chart-3/10"
                    />
                </motion.div>
            </motion.div>

            {/* SMART ACTIONS SECTION */}
            <section className="space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="flex items-center gap-2 font-mono text-xs font-bold tracking-wider text-muted-foreground uppercase">
                        <Compass size={14} weight="bold" />
                        <span>Smart Actions</span>
                    </h2>
                </div>

                <ContinueSessionWidget />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* Topic Test */}
                    <motion.div
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.99 }}
                        className="group relative flex cursor-pointer items-center justify-between overflow-hidden border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:border-primary/40 hover:shadow-md"
                        onClick={() => navigate('/topic-test')}
                    >
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center bg-primary/10 text-primary transition-transform group-hover:scale-105">
                                <LightningIcon size={24} weight="bold" />
                            </div>

                            <div>
                                <h3 className="font-['Sora',sans-serif] text-base font-bold text-card-foreground">
                                    Topic Test
                                </h3>

                                <p className="text-xs text-muted-foreground">
                                    Target specific subject topics
                                </p>
                            </div>
                        </div>

                        <ArrowUpRightIcon />
                    </motion.div>

                    {/* Smart Revision */}
                    <motion.div
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.99 }}
                        className="group relative flex cursor-pointer items-center justify-between overflow-hidden border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:border-primary/40 hover:shadow-md"
                        onClick={() => navigate('/revision')}
                    >
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center bg-chart-3/10 text-chart-3 transition-transform group-hover:scale-105">
                                <ArrowClockwiseIcon size={24} weight="bold" />
                            </div>

                            <div>
                                <h3 className="font-['Sora',sans-serif] text-base font-bold text-card-foreground">
                                    Smart Revision
                                </h3>

                                <p className="text-xs text-muted-foreground">
                                    Weak area practice
                                </p>
                            </div>
                        </div>

                        <ArrowUpRightIcon />
                    </motion.div>
                </div>
            </section>

            {/* STUDY PLAN SECTION */}
            <section className="space-y-3">
                <h2 className="font-mono text-xs font-bold tracking-wider text-muted-foreground uppercase">
                    Target Study Roadmap
                </h2>

                <StudyPlan />
            </section>

            {/* STREAK MAP SECTION */}
            {!statsLoading && stats?.heatmapData && (
                <section className="space-y-3">
                    <h2 className="font-mono text-xs font-bold tracking-wider text-muted-foreground uppercase">
                        Consistency & Activity Heatmap
                    </h2>

                    <StreakMap stats={stats} />
                </section>
            )}

            {/* Branding Footer */}
            <Branding className="w-full opacity-60 transition-opacity hover:opacity-100" />
        </div>
    );
};

export default Dashboard;
