import { motion } from 'framer-motion';
import { ShieldCheck, Fire } from '@phosphor-icons/react';
import useSmartRevision from '../hooks/useSmartRevision.ts';
import { containerVariants } from '../utils/motionVariants.ts';
import ModernLoader from '../components/ui/ModernLoader.tsx';
import { useState } from 'react';
import Header from '../components/SmartRevision/Header.tsx';
import InfoTab from '../components/SmartRevision/InfoTab.tsx';
import Buttons from '../components/ui/Buttons.tsx';

const SmartRevision = () => {
    const { loading, user, currentSet, questions, generateSet, startSet, criticalQuestionsCount } =
        useSmartRevision();
    const [isGenerating, setIsGenerating] = useState(false);
    const [pendingMistakes, setPendingMistakes] = useState(3);

    // Loading state
    if (loading) {
        return <ModernLoader />;
    }

    return (
        <div className="p-6 pb-40 bg-gray-50 dark:bg-zinc-900 max-h-dvh overflow-y-scroll">
            <Header />

            {/* Action Card */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="mb-10"
            >
                <div className="bg-white dark:bg-zinc-600/5 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-zinc-900 relative overflow-hidden">
                    <div className="relative z-10 flex flex-col items-center justify-center min-h-[140px] text-center">
                        {currentSet ? (
                            // STATE: Active Set Exists
                            <div className="w-full max-w-md">
                                <div className="flex justify-between items-end mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                                            Weekly Set Active
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Expires on Sunday
                                        </p>
                                    </div>
                                </div>

                                <Buttons active={true} onClick={startSet}>
                                    {currentSet ? 'Start Revision' : 'Resume Session'}
                                </Buttons>
                            </div>
                        ) : criticalQuestionsCount > 0 ? (
                            // STATE: Ready to Generate
                            <div className="max-w-md">
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-full text-sm font-medium mb-6">
                                    <Fire size={16} weight="fill" />
                                    {criticalQuestionsCount} critical mistakes pending review
                                </div>

                                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                                    Ready to recover marks?
                                </h2>
                                <p className="text-gray-500 dark:text-gray-400 mb-8">
                                    Generate your focused 30(ish)-question set for this week.
                                </p>

                                <Buttons
                                    disabled={isGenerating}
                                    active={true}
                                    onClick={generateSet}
                                >
                                    Generate Weekly Set
                                </Buttons>
                            </div>
                        ) : (
                            // STATE: Clean Slate
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full mb-4">
                                    <ShieldCheck size={32} weight="duotone" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                                    All Caught Up!
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-sm">
                                    Your revision queue is empty. Great job! Go take a mock test to
                                    find new weak areas.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Educational Section */}
            <InfoTab />
        </div>
    );
};

export default SmartRevision;
