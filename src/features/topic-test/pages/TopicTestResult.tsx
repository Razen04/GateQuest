import {
    ArrowLeftIcon,
    ArrowRight,
    House,
    ListChecks,
    Target,
    Timer,
    Trophy,
} from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import PageHeader from '@/shared/components/PageHeader';
import { Button } from '@/shared/components/ui/button';
import type { Attempt, TestSession } from '@/shared/types/storage';
import { formatTime } from '@/shared/utils/helper';
import { containerVariants, itemVariants } from '@/shared/utils/motionVariants';
import TestAnalysisBody from '../components/test-result/TestAnalysisBody';
import type { FullAttempt } from '../types/testTypes';

type OutletContext = {
    session: TestSession;
    attempts: Attempt[];
};

const StatCard = ({
    label,
    value,
    subValue,
    icon: Icon,
}: {
    label: string;
    value: string | number;
    subValue?: string;
    icon: React.ComponentType<{
        size?: number;
        weight?: string;
        className?: string;
    }>;
}) => (
    <div className="bg-card border border-border p-5 shadow-sm flex items-start justify-between">
        <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                {label}
            </p>
            <h3 className="text-2xl font-bold text-foreground">{value}</h3>
            {subValue && (
                <p className="text-xs text-muted-foreground/70 mt-1">
                    {subValue}
                </p>
            )}
        </div>
        <Icon size={22} weight="duotone" className="text-chart-1" />
    </div>
);

export default function TopicTestResult() {
    const { testId } = useParams<{ testId: string }>();
    const navigate = useNavigate();
    const { session, attempts } = useOutletContext<OutletContext>();

    return (
        <div className="max-w-7xl mx-auto pb-20">
            <div className="p-6">
                <motion.button
                    whileHover={{ x: -4 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => navigate('/topic-test')}
                    className="mb-2 group inline-flex items-center gap-2 border border-border bg-card/60 px-3.5 py-2 font-grotesk text-xs font-bold text-foreground shadow-sm backdrop-blur-md transition-colors hover:border-chart-1/30 hover:text-chart-1"
                >
                    <ArrowLeftIcon
                        size={16}
                        className="transition-transform group-hover:-translate-x-0.5"
                    />
                    <span>Back to Hub</span>
                </motion.button>

                <PageHeader
                    primaryTitle="Custom Test"
                    secondaryTitle="Performance Report"
                    caption={
                        session?.topics?.length
                            ? `${session.topics.slice(0, 10).join(', ')}${
                                  session.topics.length > 10 ? '...' : ''
                              }`
                            : 'Custom Test'
                    }
                />
            </div>

            <motion.main
                className="max-w-7xl mx-auto px-6 space-y-12"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div
                    variants={itemVariants}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
                >
                    <StatCard
                        label="Score"
                        value={`${session.score?.toFixed(1)}/${session.total_marks}`}
                        icon={Trophy}
                    />
                    <StatCard
                        label="Accuracy"
                        value={`${session.accuracy?.toFixed(1)}%`}
                        icon={Target}
                    />
                    <StatCard
                        label="Time Taken"
                        value={formatTime(
                            attempts.reduce(
                                (sum, a) => sum + (a.time_spent_seconds ?? 0),
                                0
                            )
                        )}
                        icon={Timer}
                    />
                    <StatCard
                        label="Attempted"
                        value={`${session.attempted_count}/${attempts.length}`}
                        icon={ListChecks}
                    />
                </motion.div>

                <motion.div variants={itemVariants}>
                    <TestAnalysisBody
                        attempts={attempts as FullAttempt[]}
                        testId={testId!}
                    />
                </motion.div>

                <motion.div
                    variants={itemVariants}
                    className="flex justify-center gap-4 pt-8"
                >
                    <Button
                        className="rounded-none"
                        variant="outline"
                        onClick={() => navigate('/topic-test')}
                    >
                        <House size={20} className="mr-2" /> Back to TestHub
                    </Button>
                    <Button
                        className="rounded-none"
                        onClick={() =>
                            navigate(`/topic-test-review/${testId}/0`)
                        }
                    >
                        Review Solutions{' '}
                        <ArrowRight size={20} className="ml-2" />
                    </Button>
                </motion.div>
            </motion.main>
        </div>
    );
}
