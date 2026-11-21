import { motion } from 'framer-motion';
import { useAuthStore } from '@/app/stores/useAuthStore';
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

    const userTargetYear = useAuthStore((s) => s.user?.targetYear);

    const { days, hours, minutes, seconds } = useExamCountdown(
        `${userTargetYear}-02-08T09:00:00`
    );

    if (loading) {
        return <ModernLoader />;
    }

    const remainingQuestions = Math.max(
        0,
        dailyQuestionTarget - todayUniqueAttemptCount
    );

    const progress = Math.min(100, todayProgressPercent);

    const statusMessage = isTargetMetToday
        ? "Great job! You've met today's target."
        : `You should attempt ${remainingQuestions} more unique questions today to stay on track.`;

    return (
        <motion.div
            variants={itemVariants}
            initial="initial"
            animate="animate"
            className="
                relative isolate overflow-hidden
                border border-border
                bg-card/70 text-card-foreground
                shadow-sm backdrop-blur-2xl
                p-4 font-['Manrope']
            "
        >
            {/* Subtle glass overlay */}
            <div
                className="
                pointer-events-none absolute inset-0
                bg-gradient-to-b from-foreground/[0.03] to-transparent
            "
            />

            <div className="relative space-y-5">
                {/* Exam countdown */}
                <div
                    className="
                    flex flex-wrap items-center gap-2
                    text-sm font-bold
                    text-muted-foreground
                    font-['Manrope']
                "
                >
                    <span className="tabular-nums">{days}d</span>
                    <span>:</span>
                    <span className="tabular-nums">
                        {String(hours).padStart(2, '0')}hrs
                    </span>
                    <span>:</span>
                    <span className="tabular-nums">
                        {String(minutes).padStart(2, '0')}min
                    </span>
                    <span>:</span>
                    <span className="tabular-nums">
                        {String(seconds).padStart(2, '0')}s
                    </span>

                    <span className="font-semibold">
                        left for GATE {userTargetYear}
                    </span>
                </div>

                {/* Today's progress */}
                <div>
                    <div
                        className="
                        mb-2 flex items-center justify-between
                        gap-2
                    "
                    >
                        <span
                            className="
                            text-sm font-semibold
                            text-card-foreground
                            font-['Sora']
                        "
                        >
                            Today's progress
                        </span>

                        <span
                            className="
                            text-xs font-semibold
                            text-muted-foreground
                            tabular-nums
                        "
                        >
                            {todayUniqueAttemptCount} / {dailyQuestionTarget}
                        </span>
                    </div>

                    {/* Progress bar */}
                    <div
                        className="
                        h-2.5 w-full overflow-hidden
                        border border-border
                        bg-muted
                    "
                    >
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{
                                duration: 0.6,
                                ease: 'easeOut',
                            }}
                            className={`
                                h-full
                                ${
                                    isTargetMetToday
                                        ? 'bg-chart-2'
                                        : 'bg-primary'
                                }
                            `}
                        />
                    </div>

                    <div
                        className="
                        mt-2 flex justify-between gap-2
                        text-xs text-muted-foreground
                    "
                    >
                        <span>{todayProgressPercent}% of today's goal</span>

                        <span className="font-semibold">
                            {isTargetMetToday
                                ? 'Target met'
                                : `Need ${remainingQuestions} more`}
                        </span>
                    </div>
                </div>

                {/* Status message */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className={`
                        border p-3
                        text-center text-sm font-medium
                        backdrop-blur-md
                        ${
                            isTargetMetToday
                                ? `
                                    border-chart-2/30
                                    bg-chart-2/10
                                    text-card-foreground
                                `
                                : `
                                    border-chart-4/30
                                    bg-chart-4/10
                                    text-card-foreground
                                `
                        }
                    `}
                >
                    {statusMessage}
                </motion.div>
            </div>
        </motion.div>
    );
};

export default StudyPlan;
