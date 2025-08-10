import React, { useContext } from 'react';
import { motion } from 'framer-motion';
import {
    FaChartLine,
    FaLaptopCode, FaMedal
} from 'react-icons/fa';
import Login from '../components/Login';
import AuthContext from '../context/AuthContext';
import { getBackgroundColor, getUserProfile } from '../helper';
import StatsContext from '../context/StatsContext';
import subjects from '../data/subjects';
import ModernLoader from '../components/ModernLoader';
import StudyPlan from '../components/StudyPlan';
import { ResponsiveTimeRange } from '@nivo/calendar';
import ThemeContext from '../context/ThemeContext';

const StatCard = ({ icon: Icon, title, value, quantity, iconColor, bgColor, textColor = "text-gray-800 dark:text-gray-100" }) => {

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { duration: 0.5 }
        }
    };

    return (
        <motion.div
            variants={itemVariants}
            className="p-6 rounded-xl shadow-sm border border-border-primary dark:border-border-primary-dark flex items-center"
        >
            <div className={`p-4 rounded-full ${bgColor} mr-4`}>
                <Icon className={`h-6 w-6 ${iconColor}`} />
            </div>
            <div className='w-full'>
                <h3 className="text-gray-500 dark:text-gray-100 text-sm">{title}</h3>
                <div className="flex items-center mt-1">
                    <span className={`text-2xl font-bold ${textColor}`}>{value}</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full mt-1 overflow-hidden">
                    <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${quantity}%` }}
                    ></div>
                </div>
            </div>
        </motion.div>
    )
};

const Dashboard = () => {
    const { isLogin, loading } = useContext(AuthContext);
    const { stats, loading: statsLoading } = useContext(StatsContext);
    const { dark: isDark } = useContext(ThemeContext);
    const user = getUserProfile();
    const subjectStats = stats?.subjectStats;
    const toDate = new Date();
    toDate.setMonth(toDate.getMonth() + 1);
    const toIso = toDate.toISOString().slice(0, 10);
    const toLabel = toDate.toLocaleDateString();

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

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
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mb-8"
            >
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">
                    Welcome back,{' '}
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {user?.name}
                    </span>
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Your preparation journey is {stats?.progress}% complete. Keep going!</p>
            </motion.div>

            <StudyPlan />

            {!statsLoading && stats?.heatmapData?.length > 0 && (
                <div className="p-6 border mb-4 shadow-sm rounded-xl border-border-primary dark:border-border-primary-dark">
                    <div className="mb-4">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Streak Map</h2>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Feb 7, 2025 → {toLabel}</span>
                    </div>
                    <div className='w-full overflow-x-auto sm:overflow-x-visible'>
                        <div className='min-w-[860px] sm:min-w-0'>
                            <div className='h-[200px] sm:h-[200px] md:h-[210px] lg:h-[230px] xl:h-[250px] pr-2'>
                                <ResponsiveTimeRange
                                    data={stats.heatmapData.map(d => ({
                                        day: d.date,
                                        value: d.count
                                    }))}
                                    from="2025-02-07"
                                    to={toIso}
                                    emptyColor={isDark ? '#18181B' : '#F9FAFB'}
                                    colors={
                                        isDark
                                            ? ['#1f2937', '#312e81', '#4338ca', '#4f46e5', '#6366f1', '#818cf8'] // no “zero” color
                                            : ['#ebedf0', '#c7d2fe', '#a5b4fc', '#818cf8', '#6366f1', '#4f46e5']
                                    }
                                    minValue={0} // start coloring from count=1
                                    maxValue={Math.max(...stats.heatmapData.map(d => d.count))}
                                    theme={{
                                        text: { fill: isDark ? '#e5e7eb' : '#111827' },
                                        labels: { text: { fill: isDark ? '#e5e7eb' : '#111827' } },
                                        legends: { text: { fill: isDark ? '#e5e7eb' : '#111827' } },
                                        tooltip: {
                                            container: {
                                                background: isDark ? '#111827' : '#ffffff',
                                                color: isDark ? '#f9fafb' : '#111827',
                                                fontSize: 12,
                                                borderRadius: 6,
                                                boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                                            }
                                        }
                                    }}
                                    margin={{ top: 30, right: 20, bottom: 10, left: 20 }}
                                    monthBorderColor={isDark ? '#18181B' : '#F9FAFB'}
                                    dayBorderWidth={2}
                                    dayBorderColor={isDark ? '#18181B' : '#F9FAFB'}
                                    weekdayLegend={() => ''}
                                    legends={[
                                        {
                                            anchor: 'bottom-right',
                                            direction: 'row',
                                            translateY: 36,
                                            itemCount: 5,
                                            itemWidth: 30,
                                            itemHeight: 14,
                                            itemsSpacing: 4,
                                            itemDirection: 'right-to-left',
                                            symbolSize: 14,
                                            itemTextColor: isDark ? '#e5e7eb' : '#111827'
                                        }
                                    ]}
                                />
                            </div>
                        </div>
                    </div>

                </div>
            )}

            {/* Stats */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
            >
                <StatCard
                    icon={FaChartLine}
                    title="Overall Progress"
                    value={`${stats?.progress}%`}
                    delta="2%"
                    iconColor="text-blue-500"
                    bgColor="bg-blue-50"
                    quantity={stats?.progress}
                />

                <StatCard
                    icon={FaMedal}
                    title="Overall Accuracy"
                    value={`${stats?.accuracy}%`}
                    delta="2%"
                    iconColor="text-purple-500"
                    bgColor="bg-purple-50"
                    quantity={stats?.accuracy}
                />

            </motion.div>

            {/* Subject Stats */}
            {subjectStats && <div className="w-full">
                <motion.div
                    className="lg:col-span-2 space-y-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                >
                    <motion.div className="p-6 rounded-xl shadow-sm border border-border-primary dark:border-border-primary-dark">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Subject Stats</h2>
                        </div>

                        <div className="space-y-4 flex justify-around">
                            {/* Courses */}
                            <div className="overflow-x-auto">
                                <div className="flex gap-4 sm:gap-6 md:gap-8 px-2 py-4 w-full">
                                    {subjectStats?.map((subject, index) => {
                                        const progress = Number(subject.progress) || 0;
                                        const accuracy = Number(subject.accuracy) || 0;
                                        // Find the subject meta info
                                        const subjectMeta = subjects.find(s => s.apiName === subject.subject);
                                        const Icon = subjectMeta?.icon || FaLaptopCode; // fallback icon
                                        const questionCount = subjectMeta?.questions;
                                        const subjectColor = subjectMeta?.color;

                                        return (
                                            <motion.div
                                                key={index}
                                                className="min-w-[250px] sm:min-w-[280px] md:min-w-[300px] shadow-md rounded-xl border border-gray-100 dark:border-zinc-800 p-5 flex flex-col justify-between hover:shadow-lg hover:bg-blue-50 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                                                whileHover={{ scale: 1.03 }}
                                            >
                                                <div className="flex items-center mb-4">
                                                    <div className={`p-3 ${getBackgroundColor(subjectColor)} rounded-lg text-white mr-3`}>
                                                        <Icon className={`h-6 w-6 ${getBackgroundColor(subjectColor)}`} />
                                                    </div>
                                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{subject.subject}</h3>
                                                </div>

                                                {/* Progress Bar */}
                                                <div className="mb-2">
                                                    <span className="text-sm text-gray-60 dark:text-gray-300">Progress</span>
                                                    <div className="w-full h-2 bg-gray-200 rounded-full mt-1 overflow-hidden">
                                                        <div
                                                            className="h-full bg-blue-500 rounded-full transition-all duration-300 ease-out"
                                                            style={{ width: `${progress}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 inline-block">{progress}% complete</span>
                                                </div>

                                                {/* Accuracy */}
                                                <div className="mb-2">
                                                    <span className="text-sm text-gray-600 dark:text-gray-300">Accuracy</span>
                                                    <div className="w-full h-2 bg-gray-200 rounded-full mt-1 overflow-hidden">
                                                        <div
                                                            className="h-full bg-green-500 rounded-full transition-all duration-300 ease-out"
                                                            style={{ width: `${accuracy}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 inline-block">{accuracy}% correct</span>
                                                </div>

                                                {/* Meta stats */}
                                                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                                    <p>Attempted: <strong>{subject.attempted}</strong></p>
                                                    <p>Total Questions: <strong>{questionCount}</strong></p>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>}
        </div>
    );
};

export default Dashboard;