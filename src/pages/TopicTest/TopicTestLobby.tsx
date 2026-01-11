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
import { supabase } from '@/utils/supabaseClient';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/ui/PageHeader';
import { toast } from 'sonner';
import type { TestSession } from '@/types/storage';
import ModernLoader from '@/components/ui/ModernLoader';
import { syncTestFromSupabaseToDexie } from '@/hooks/topic-test/service/testSyncService';

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

    const [testData, setTestData] = useState<TestSession | null>(null);
    const [loading, setLoading] = useState(true);
    const [starting, setStarting] = useState(false);

    useEffect(() => {
        const fetchTest = async () => {
            if (!testId) return;

            const { data, error } = await supabase
                .from('topic_tests')
                .select('*')
                .eq('id', testId)
                .single();

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
            const user = (await supabase.auth.getUser()).data.user;
            if (!user) throw new Error('No user');

            if (testData.status === 'created') {
                const { error } = await supabase
                    .from('topic_tests')
                    .update({
                        status: 'ongoing',
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', testId);

                if (error) throw error;
            }

            await syncTestFromSupabaseToDexie(user.id);
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
                    className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 shadow-sm"
                >
                    <h2 className="text-xl font-bold mb-1">Custom Topic Test</h2>
                    <p className="text-sm truncate text-slate-500 dark:text-slate-400 mb-6 max-w-md">
                        {testData.topics.join(', ')}
                    </p>

                    <div className="flex flex-wrap gap-3">
                        <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-4 py-2 text-sm font-medium">
                            <Question size={20} weight="bold" />
                            {testData.total_questions} Questions
                        </div>

                        <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 px-4 py-2 text-sm font-medium">
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

                    <div className="bg-white dark:bg-zinc-900 p-5 border border-slate-200 dark:border-zinc-800 space-y-3 text-sm">
                        {INSTRUCTION_RULES.map((rule) => (
                            <InstructionItem key={rule.id} rule={rule} />
                        ))}
                    </div>
                </motion.div>
            </main>

            <div className="mt-4 p-6">
                <div className="w-full mx-auto">
                    <Button onClick={handleStartTest} disabled={starting} className="w-full">
                        <Play className="mr-2" weight="fill" />
                        Start Test
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default TopicTestLobby;
