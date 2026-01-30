import { motion } from 'framer-motion';
import Login from '../components/Login.tsx';
import { getUserProfile } from '../helper.ts';
import ModernLoader from '../components/ui/ModernLoader.tsx';
import StudyPlan from '../components/Dashboard/StudyPlan.jsx';
import StreakMap from '../components/Dashboard/StreakMap.jsx';
import StatCard from '../components/Dashboard/StatCard.jsx';
import SubjectStats from '../components/Dashboard/SubjectStats.jsx';
import { ChartLine, Medal } from '@phosphor-icons/react';
import { containerVariants } from '../utils/motionVariants.ts';
import useAuth from '../hooks/useAuth.ts';
import useStats from '../hooks/useStats.ts';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button.tsx';
import { LightningIcon } from '@phosphor-icons/react';
import { ArrowClockwiseIcon } from '@phosphor-icons/react';
import { InfoIcon } from '@phosphor-icons/react';

const Dashboard = () => {
    const { isLogin, loading } = useAuth();
    const { stats, loading: statsLoading } = useStats();
    const user = getUserProfile();
    const subjectStats = stats?.subjectStats;
    const navigate = useNavigate();

    if (subjectStats) {
        localStorage.setItem('subjectStats', JSON.stringify(subjectStats));
    }

    // Handle loading
    if (loading) {
        return (
            <div className="w-full flex justify-center items-center text-gray-600">
                <ModernLoader />
            </div>
        );
    }

    // If not logged in
    if (!isLogin) {
        return (
            <div className="flex justify-center items-center w-full h-full">
                {/* Sidebar will be rendered by Layout, so just render Login centered in content area */}
                <div className="flex-1 flex justify-center items-center min-h-[60vh]">
                    <Login canClose={false} />
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 pb-40 bg-gray-50 dark:bg-zinc-900 h-dvh overflow-y-scroll">
            {/* Welcome */}
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
                <div className="flex items-center mt-[12px] mb-[-30px]">
                    <InfoIcon className="text-sm text-red-500 mr-2" />
                    <p className="text-base text-red-500">
                        Attempt 3 questions for Dashboard to refresh.
                    </p>
                </div>
            </motion.div>

            <section className="w-full mb-4">
                {/* Section header */}
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold uppercase tracking-wide">Smart Actions</h2>
                </div>

                {/* Action buttons */}
                <div className="grid grid-cols-2 gap-2">
                    <Button
                        onClick={() => navigate('/topic-test')}
                        aria-label="Start topic test"
                        className="flex items-center gap-3 font-semibold px-6 py-6 shadow-md
                       hover:bg-blue-50 hover:shadow-lg
                       focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2
                       transition-all duration-200"
                    >
                        <LightningIcon size={22} weight="bold" />
                        <span>Topic Test (New)</span>
                    </Button>

                    <Button
                        onClick={() => navigate('/revision')}
                        aria-label="Start smart revision"
                        className="flex items-center gap-3 font-semibold px-6 py-6 shadow-md
                       hover:bg-blue-50 hover:shadow-lg
                       focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2
                       transition-all duration-200"
                    >
                        <ArrowClockwiseIcon size={22} weight="bold" />
                        <span>Smart Revision</span>
                    </Button>
                </div>
            </section>

            {/* Stats */}
            <div>
                <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide">Overview</h2>
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 mb-4"
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
            </div>

            <StudyPlan />

            {!statsLoading && stats?.heatmapData?.length > 0 && <StreakMap stats={stats} />}

            {/* Subject Stats */}
            {subjectStats && (
                <div className="w-full">
                    <SubjectStats subjectStats={subjectStats} />
                </div>
            )}
        </div>
    );
};

export default Dashboard;
