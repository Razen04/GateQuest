import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Timer,
    Question,
    Play,
    WarningCircle,
    CheckCircle,
    ArrowLeft,
} from '@phosphor-icons/react';
import { Button } from '@/shared/components/ui/button';
import PageHeader from '@/shared/components/PageHeader';
import { toast } from 'sonner';
import type { TestSession } from '@/shared/types/storage';
import ModernLoader from '@/shared/components/ModernLoader';
import { syncTestFromSupabaseToDexie } from '@/features/topic-test/services/testSyncService';
import { useGoals } from '@/shared/hooks/useGoals';
import { fetchTestById, updateTestStatus } from '../api/topicTest';
import { getCurrentUser } from '@/shared/api/auth';

type InstructionRule = {
    id: string;
    text: React.ReactNode;
    type: 'info' | 'warning';
};

const INSTRUCTION_RULES: InstructionRule[] = [
    {
        id: 'navigate',
        text: 'You can navigate between questions freely.',
        type: 'info',
    },
    {
        id: 'mark-review',
        text: 'Use "Mark for Review" if you are unsure about an answer.',
        type: 'info',
    },
    {
        id: 'timer-start',
        text: 'The timer will start immediately when you click the button below.',
        type: 'warning',
    },
    {
        id: 'pause',
        text: (
            <>
                Closing the app will <strong>Pause</strong> the timer, but try to finish in one
                sitting.
            </>
        ),
        type: 'warning',
    },
];

const InstructionItem = ({ rule }: { rule: InstructionRule }) => {
    const isWarning = rule.type === 'warning';
    const Icon = isWarning ? WarningCircle : CheckCircle;
    const iconColor = isWarning ? 'text-orange-500' : 'text-green-500';

    return (
        <div className="flex gap-3">
            <Icon size={18} weight="fill" className={`${iconColor} shrink-0 mt-0.5`} />
            <p>{rule.text}</p>
        </div>
    );
};

const TopicTestLobby = () => {
    const { testId } = useParams();
    const navigate = useNavigate();
    const { userGoal } = useGoals();

    const [testData, setTestData] = useState<TestSession | null>(null);
    const [loading, setLoading] = useState(true);
    const [starting, setStarting] = useState(false);

    useEffect(() => {
        const fetchTest = async () => {
            if (!testId) return;

            const { data, error } = await fetchTestById(testId);

            if (error) {
                console.error('Error fetching test:', error);
                toast.error('Test not found');
                navigate('/topic-test');
                return;
            }

            if (data.status === 'completed') {
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
            if (!user) throw new Error('No user');

            if (testData.status === 'created') {
                const { error } = await updateTestStatus(testId, 'ongoing');

                if (error) throw error;
            }

            await syncTestFromSupabaseToDexie(user.id, userGoal?.branch_id);
            navigate(`/topic-test/${testId}/attempt`);
        } catch (err) {
            console.error(err);
            toast.error('Failed to start test. Please check your connection.');
            setStarting(false);
        }
    };

    if (loading) return <ModernLoader />;
    if (!testData) return null;

    const timeInMinutes = Math.floor(testData.remaining_time_seconds / 60);

    return (
        <div className="max-h-screen overflow-y-auto flex flex-col text-slate-900 dark:text-slate-100 pb-40">
            <div className="p-6">
                <button
                    onClick={() => navigate('/topic-test')}
                    className="flex items-center text-sm text-slate-500 hover:text-blue-500 mb-4 transition-colors"
                >
                    <ArrowLeft className="mr-2" />
                    Cancel & Exit
                </button>

                <PageHeader
                    primaryTitle="Topic Test:"
                    secondaryTitle="Ready to Start?"
                    caption="Review the test parameters below."
                />
            </div>

            <main className="px-6 flex-1 flex flex-col gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-3xl border border-white/30 dark:border-white/10 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-3xl backdrop-saturate-150 shadow-2xl p-6"
                >
                    <h2 className="text-xl font-bold mb-1">Custom Topic Test</h2>

                    <p className="text-sm truncate text-slate-500 dark:text-slate-400 mb-6 max-w-md">
                        {testData.topics.join(', ')}
                    </p>

                    <div className="flex flex-wrap gap-3">
                        <div className="flex items-center gap-2 rounded-xl border border-blue-200/40 dark:border-blue-400/20 bg-blue-500/10 backdrop-blur-xl px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-300">
                            <Question size={20} weight="bold" />
                            {testData.total_questions} Questions
                        </div>

                        <div className="flex items-center gap-2 rounded-xl border border-orange-200/40 dark:border-orange-400/20 bg-orange-500/10 backdrop-blur-xl px-4 py-2 text-sm font-medium text-orange-700 dark:text-orange-300">
                            <Timer size={20} weight="bold" />
                            {timeInMinutes} Mins
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-2"
                >
                    <h3 className="font-semibold uppercase text-xs tracking-wider text-slate-500">
                        Instructions
                    </h3>

                    <div className="rounded-3xl border border-white/30 dark:border-white/10 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-3xl backdrop-saturate-150 shadow-xl p-5 space-y-3 text-sm">
                        {INSTRUCTION_RULES.map((rule) => (
                            <InstructionItem key={rule.id} rule={rule} />
                        ))}
                    </div>
                </motion.div>
            </main>

            <div className="mt-4 p-6">
                <div className="w-full mx-auto">
                    <Button
                        onClick={handleStartTest}
                        disabled={starting}
                        className="w-full rounded-2xl shadow-lg"
                    >
                        <Play className="mr-2" weight="fill" />
                        Start Test
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default TopicTestLobby;
