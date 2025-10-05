import { motion } from 'framer-motion';
import Login from '../components/Login.tsx';
import { getUserProfile } from '../helper.ts';
import ModernLoader from '../components/ModernLoader.tsx';
import StudyPlan from '../components/Dashboard/StudyPlan.jsx';
import StreakMap from '../components/Dashboard/StreakMap.jsx';
import StatCard from '../components/Dashboard/StatCard.jsx';
import SubjectStats from '../components/Dashboard/SubjectStats.jsx';
import { ChartLine, Info, Medal } from '@phosphor-icons/react';
import { containerVariants } from '../utils/motionVariants.ts';
import useAuth from '../hooks/useAuth.ts';
import useStats from '../hooks/useStats.ts';

const Dashboard = () => {
    const { isLogin, loading } = useAuth();
    const { stats, loading: statsLoading } = useStats();
    const user = getUserProfile();
    const subjectStats = stats?.subjectStats;

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
                    <Info className="text-sm text-red-500 mr-2" />
                    <p className="text-base text-red-500">
                        Attempt 5 questions for Dashboard to refresh.
                    </p>
                </div>
            </motion.div>

            {/* Stats */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4"
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
