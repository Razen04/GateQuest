import { motion } from 'framer-motion';
import useStudyPlan from '../../hooks/useStudyPlan.ts';
import { itemVariants } from '../../utils/motionVariants.ts';
import ModernLoader from '../ui/ModernLoader.tsx';

interface StudyPlanData {
    loading: boolean;
    todayUniqueAttemptCount: number;
    dailyQuestionTarget: number;
    daysLeft: number;
    isTargetMetToday: boolean;
    todayProgressPercent: number;
}

const StudyPlan = () => {
    const {
        loading,
        todayUniqueAttemptCount,
        dailyQuestionTarget,
        daysLeft,
        isTargetMetToday,
        todayProgressPercent,
    }: StudyPlanData = useStudyPlan();

    if (loading) {
        return <ModernLoader />;
    }

    // Status message logic
    const statusMessage = isTargetMetToday
        ? "Great job! You've met today's target."
        : `You should attempt ${dailyQuestionTarget - todayUniqueAttemptCount} more unique questions today to stay on track.`;

    return (
        <motion.div
            variants={itemVariants}
            initial="initial"
            animate="animate"
            className="mx-auto p-6 shadow-sm border border-border-primary dark:border-border-primary-dark mb-4"
        >
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h2 className="text-2xl font-bold mb-1 text-gray-800 dark:text-gray-100">
                        Smart Study Plan
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {daysLeft} day{daysLeft === 1 ? '' : 's'} left until exam
                    </p>
                </div>
            </div>

            <div className="">
                {/* Today's target */}
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-base text-text-primary dark:text-text-primary-dark">
                            Today's progress
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            {todayUniqueAttemptCount} / {dailyQuestionTarget}
                        </span>
                    </div>
                    <div className="w-full h-3 bg-gray-200 dark:bg-zinc-800 overflow-hidden">
                        <div
                            className="h-full"
                            style={{
                                width: `${Math.min(100, todayProgressPercent)}%`,
                                background: isTargetMetToday
                                    ? 'linear-gradient(to right, #10b981, #06b6d4)' // green-blue if met
                                    : 'linear-gradient(to right, #6366f1, #a78bfa)', // purple if pending
                                transition: 'width .5s ease',
                            }}
                        ></div>
                    </div>
                    <div className="flex justify-between mt-1 text-xs">
                        <span className="text-gray-500 dark:text-gray-400">
                            {todayProgressPercent}% of today's goal
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">
                            {isTargetMetToday
                                ? 'Target met'
                                : `Need ${Math.max(0, dailyQuestionTarget - todayUniqueAttemptCount)} more`}
                        </span>
                    </div>
                </div>
            </div>

            {/* Status */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className={`mt-6 p-4 text-center font-medium ${
                    isTargetMetToday
                        ? 'bg-green-50 text-green-800 border border-green-200 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-yellow-50 text-yellow-800 border border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300'
                }`}
            >
                {statusMessage}
            </motion.div>
        </motion.div>
    );
};

export default StudyPlan;
