import {
    ArrowLeft,
    CheckCircle,
    Info,
    Play,
    Question,
    Timer,
    WarningCircle,
} from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { useGoalStore } from '@/app/stores/useGoalStore';
import { syncTestFromSupabaseToDexie } from '@/features/topic-test/services/testSyncService';
import { getCurrentUser } from '@/shared/api/auth';
import ModernLoader from '@/shared/components/ModernLoader';
import PageHeader from '@/shared/components/PageHeader';
import { Button } from '@/shared/components/ui/button';
import type { TestSession } from '@/shared/types/storage';
import { fetchTestById, updateTestStatus } from '../api/topicTest';

type InstructionRule = {
    id: string;
    text: React.ReactNode;
    type: 'info' | 'warning';
};

const INSTRUCTION_RULES: InstructionRule[] = [
    {
        id: 'navigate',
        text: 'You can navigate between questions freely using the question palette or control bar.',
        type: 'info',
    },
    {
        id: 'mark-review',
        text: 'Use "Mark for Review" if you are unsure about an answer and want to revisit it later.',
        type: 'info',
    },
    {
        id: 'timer-start',
        text: 'The timer will start immediately as soon as you click the button below.',
        type: 'warning',
    },
    {
        id: 'fullscreen',
        text: 'Use the fullscreen option to be immersed in the test on Desktop.',
        type: 'info',
    },
    {
        id: 'pause',
        text: (
            <>
                Closing or refreshing the app will <strong>Pause</strong> the
                timer, but completing the test in one sitting is strongly
                recommended.
            </>
        ),
        type: 'warning',
    },
];

const InstructionItem = ({ rule }: { rule: InstructionRule }) => {
    const isWarning = rule.type === 'warning';
    const Icon = isWarning ? WarningCircle : CheckCircle;
    const iconColor = isWarning
        ? 'text-amber-500 dark:text-amber-400'
        : 'text-emerald-500 dark:text-emerald-400';

    return (
        <div className="flex items-start gap-3 p-3 bg-white/40 dark:bg-zinc-900/40 border border-slate-200/50 dark:border-zinc-800/60">
            <Icon
                size={18}
                weight="fill"
                className={`${iconColor} shrink-0 mt-0.5`}
            />
            <p className="text-sm text-slate-700 dark:text-zinc-300 leading-relaxed">
                {rule.text}
            </p>
        </div>
    );
};

const TopicTestLobby = () => {
    const { testId } = useParams();
    const navigate = useNavigate();
    const userGoal = useGoalStore((s) => s.userGoal);

    const [testData, setTestData] = useState<TestSession | null>(null);
    const [loading, setLoading] = useState(true);
    const [starting, setStarting] = useState(false);

    useEffect(() => {
        const fetchTest = async () => {
            if (!testId) return;

            const { data, error } = await fetchTestById(testId);

            if (error) {
                console.error('Error fetching test:', error);
                toast.error('Test session not found');
                navigate('/topic-test');
                return;
            }

            if (data?.status === 'completed') {
                navigate(`/topic-test-result/${testId}`);
                return;
            }

            setTestData(data);
            setLoading(false);
        };

        fetchTest();
    }, [testId, navigate]);

    const handleStartTest = async () => {
        if (!testId || !testData) return;
        setStarting(true);

        try {
            const user = await getCurrentUser();
            if (!user) throw new Error('User authentication required');

            if (testData.status === 'created') {
                const { error } = await updateTestStatus(testId, 'ongoing');
                if (error) throw error;
            }

            await syncTestFromSupabaseToDexie(user.id, userGoal?.branch_id);
            navigate(`/topic-test/${testId}/attempt`);
        } catch (err) {
            console.error(err);
            toast.error(
                'Failed to start test. Please check your network connection.'
            );
            setStarting(false);
        }
    };

    if (loading) return <ModernLoader />;
    if (!testData) return null;

    const timeInMinutes = Math.floor(testData.remaining_time_seconds / 60);
    const isResume = testData.status === 'ongoing';

    return (
        <div className="max-w-7xl mx-auto flex flex-col text-slate-900 dark:text-slate-100 pb-36 min-h-screen">
            {/* Top Navigation & Header */}
            <div className="p-6 pb-2">
                <button
                    onClick={() => navigate('/topic-test')}
                    className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-blue-500 dark:text-slate-400 dark:hover:text-blue-400 mb-4 transition-colors"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Topic Tests
                </button>

                <PageHeader
                    primaryTitle="Topic Test"
                    secondaryTitle={
                        isResume ? 'Resume Session' : 'Ready to Start?'
                    }
                    caption="Verify test configuration and instructions before beginning."
                />
            </div>

            {/* Main Content Details */}
            <main className="px-6 flex-1 flex flex-col gap-6 mt-4">
                {/* Test Overview Card */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-slate-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-2xl shadow-xl p-6"
                >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200/80 dark:border-zinc-800/80">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                    {testData.title || 'Custom Test'}
                                </span>
                                {isResume && (
                                    <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                        In Progress
                                    </span>
                                )}
                            </div>
                            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                                {testData.title || 'Practice Assessment'}
                            </h2>
                        </div>

                        {/* Metric Badges */}
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2 border border-blue-200/60 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/30 px-3.5 py-1.5 text-sm font-semibold text-blue-700 dark:text-blue-300">
                                <Question size={18} weight="bold" />
                                <span>
                                    {testData.total_questions} Questions
                                </span>
                            </div>

                            <div className="flex items-center gap-2 border border-amber-200/60 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/30 px-3.5 py-1.5 text-sm font-semibold text-amber-700 dark:text-amber-300">
                                <Timer size={18} weight="bold" />
                                <span>{timeInMinutes} Mins</span>
                            </div>
                        </div>
                    </div>

                    {/* Included Topics */}
                    <div className="pt-4">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 block mb-2">
                            Included Topics ({testData.topics.length})
                        </label>
                        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                            {testData.topics.map((topic, i) => (
                                <span
                                    key={i}
                                    className="text-xs px-2.5 py-1 bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800"
                                >
                                    {topic}
                                </span>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Instructions Section */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 }}
                    className="space-y-3"
                >
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                        <Info size={16} />
                        <span>Instructions & Guidelines</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {INSTRUCTION_RULES.map((rule) => (
                            <InstructionItem key={rule.id} rule={rule} />
                        ))}
                    </div>
                </motion.div>
            </main>

            {/* Bottom Fixed Action Toolbar */}
            <div className="fixed bottom-0 inset-x-0 z-30 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl border-t border-slate-200 dark:border-zinc-800 p-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                    <div className="hidden sm:flex items-center gap-3 text-xs text-slate-500 dark:text-zinc-400">
                        <span>
                            Ensure quiet surroundings before starting. Good
                            Luck.
                        </span>
                    </div>

                    <Button
                        onClick={handleStartTest}
                        disabled={starting}
                        size="lg"
                        className="w-full sm:w-auto min-w-[220px] bg-blue-600 hover:bg-blue-700 text-white rounded-none shadow-lg h-11 text-sm font-semibold tracking-wide"
                    >
                        {starting ? (
                            <span>Preparing Test Environment...</span>
                        ) : (
                            <>
                                <Play className="mr-2 h-4 w-4" weight="fill" />
                                {isResume
                                    ? 'Resume Test Attempt'
                                    : 'Start Test Now'}
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default TopicTestLobby;
