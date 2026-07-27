import { motion } from 'framer-motion';
import useStudyPlan from '@/features/dashboard/hooks/useStudyPlan.ts';
import { itemVariants } from '@/shared/utils/motionVariants.ts';
import ModernLoader from '@/shared/components/ModernLoader';

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

    const statusMessage = isTargetMetToday
        ? "Great job! You've met today's target."
        : `You should attempt ${dailyQuestionTarget - todayUniqueAttemptCount} more unique questions today to stay on track.`;

    return (
        <motion.div
            variants={itemVariants}
            initial="initial"
            animate="animate"
            className="relative mx-auto mb-4 overflow-hidden rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-xl backdrop-saturate-150 shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:border-white/10 dark:bg-white/[0.06]"
        >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/10 to-transparent dark:from-white/5" />

            <div className="relative">
                <p className="mt-0.5 text-sm text-muted-foreground">
                    {daysLeft} day{daysLeft === 1 ? '' : 's'} left until exam
                </p>

                <div>
                    <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-sm font-medium text-text-primary dark:text-text-primary-dark">
                            Today's progress
                        </span>

                        <span className="text-xs text-muted-foreground">
                            {todayUniqueAttemptCount} / {dailyQuestionTarget}
                        </span>
                    </div>

                    <div className="h-2.5 w-full overflow-hidden rounded-full border border-white/10 bg-black/10 dark:bg-white/10">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{
                                width: `${Math.min(100, todayProgressPercent)}%`,
                            }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                            className={`h-full rounded-full ${
                                isTargetMetToday
                                    ? 'bg-gradient-to-r from-blue-400 to-blue-600'
                                    : 'bg-gradient-to-r from-blue-200 to-blue-500'
                            }`}
                        />
                    </div>

                    <div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
                        <span>{todayProgressPercent}% of today's goal</span>

                        <span>
                            {isTargetMetToday
                                ? 'Target met'
                                : `Need ${Math.max(0, dailyQuestionTarget - todayUniqueAttemptCount)} more`}
                        </span>
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className={`mt-5 rounded-xl border p-3 text-center text-sm font-medium backdrop-blur-md ${
                        isTargetMetToday
                            ? 'border-green-400/20 bg-green-500/10 text-green-700 dark:text-green-300'
                            : 'border-yellow-400/20 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300'
                    }`}
                >
                    {statusMessage}
                </motion.div>
            </div>
        </motion.div>
    );
};

export default StudyPlan;
