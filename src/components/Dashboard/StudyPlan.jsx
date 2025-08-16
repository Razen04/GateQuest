import React from 'react';
import { motion } from 'framer-motion';
import useStudyPlan from '../../hooks/useStudyPlan';
import { getUserProfile } from '../../helper';
import { itemVariants } from '../../utils/motionVariants';

const StudyPlan = () => {
    // assume user is stored in localStorage as before
    const profile = getUserProfile();
    const userId = profile?.id;

    const {
        loading,
        error,
        todayUniqueAttemptCount, // unique done today
        dailyQuestionTarget,
        daysLeft,
        isTargetMetToday,
        todayProgressPercent,
    } = useStudyPlan({ userId });

    if (loading) {
        return (
            <div className="p-6 bg-primary dark:bg-primary-dark rounded-xl shadow-sm border border-border-primary dark:border-border-primary-dark mt-8">
                <p className="text-center text-gray-500">Loading study plan...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 bg-red-50 dark:bg-red-900/30 rounded-xl shadow-sm border border-red-200 dark:border-red-300 mt-8">
                <p className="text-center text-red-700">Failed to load study plan. Try refreshing.</p>
            </div>
        );
    }

    // Status message logic
    const statusMessage = isTargetMetToday
        ? "Great job! You've met today's target."
        : `You should attempt ${dailyQuestionTarget - todayUniqueAttemptCount} more questions today to stay on track.`;

    return (
        <motion.div
            variants={itemVariants}
            initial="initial"
            animate="animate"
            className="mx-auto p-6 rounded-xl shadow-sm border border-border-primary dark:border-border-primary-dark mb-4"
        >
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h2 className="text-2xl font-bold mb-1 text-gray-800 dark:text-gray-100">Smart Study Plan</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {daysLeft} day{daysLeft === 1 ? "" : "s"} left until exam
                    </p>
                </div>
            </div>

            <div className="">
                {/* Today's target */}
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-base text-text-primary dark:text-text-primary-dark">Today's progress</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            {todayUniqueAttemptCount} / {dailyQuestionTarget}
                        </span>
                    </div>
                    <div className="w-full h-3 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                            className="h-full"
                            style={{
                                width: `${Math.min(100, todayProgressPercent)}%`,
                                background:
                                    isTargetMetToday
                                        ? "linear-gradient(to right, #10b981, #06b6d4)" // green-blue if met
                                        : "linear-gradient(to right, #6366f1, #a78bfa)", // purple if pending
                                transition: "width .5s ease",
                            }}
                        ></div>
                    </div>
                    <div className="flex justify-between mt-1 text-xs">
                        <span className="text-gray-500 dark:text-gray-400">{todayProgressPercent}% of today's goal</span>
                        <span className="text-gray-500 dark:text-gray-400">
                            {isTargetMetToday ? "Target met" : `Need ${Math.max(0, dailyQuestionTarget - todayUniqueAttemptCount)} more`}
                        </span>
                    </div>
                </div>
            </div>

            {/* Status */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className={`mt-6 p-4 rounded-lg text-center font-medium ${isTargetMetToday
                    ? "bg-green-50 text-green-800 border border-green-200 dark:bg-green-900/30 dark:text-green-300"
                    : "bg-yellow-50 text-yellow-800 border border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300"
                    }`}
            >
                {statusMessage}
            </motion.div>
        </motion.div>
    );
};

export default StudyPlan;