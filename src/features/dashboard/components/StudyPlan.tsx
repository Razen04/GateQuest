import { motion } from 'framer-motion';
import useStudyPlan from '@/features/dashboard/hooks/useStudyPlan.ts';
import ModernLoader from '@/shared/components/ModernLoader';
import { itemVariants } from '@/shared/utils/motionVariants.ts';
import { useExamCountdown } from '../hooks/useExamCountdown';

interface StudyPlanData {
    loading: boolean;
    todayUniqueAttemptCount: number;
    dailyQuestionTarget: number;
    isTargetMetToday: boolean;
    todayProgressPercent: number;
}

const StudyPlan = () => {
    const {
        loading,
        todayUniqueAttemptCount,
        dailyQuestionTarget,
        isTargetMetToday,
        todayProgressPercent,
    }: StudyPlanData = useStudyPlan();

    const { days, hours, minutes, seconds } = useExamCountdown(
        '2027-02-08T09:00:00'
    );

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
            className="relative border border-white/20 bg-white/40 dark:bg-white/[0.06] backdrop-blur-2xl shadow-sm p-4 overflow-visible"
        >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/10 to-transparent dark:from-white/5" />

            <div className="relative">
                <p className="mt-0.5 flex items-center gap-2 font-['JetBrains_Mono'] text-sm text-muted-foreground">
                    <span>{days} days</span>
                    <span>:</span>
                    <span>{String(hours).padStart(2, '0')} hours</span>
                    <span>:</span>
                    <span>{String(minutes).padStart(2, '0')} minutes</span>
                    <span>:</span>
                    <span>{String(seconds).padStart(2, '0')} seconds</span>
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

                    <div className="h-2.5 w-full overflow-hidden border border-white/10 bg-black/10 dark:bg-white/10">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{
                                width: `${Math.min(100, todayProgressPercent)}%`,
                            }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                            className={`h-full ${
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
                    className={`mt-5 border p-3 text-center text-sm font-medium backdrop-blur-md ${
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
