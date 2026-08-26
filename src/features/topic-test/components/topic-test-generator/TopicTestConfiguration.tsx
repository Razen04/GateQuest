import { Funnel, X } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'framer-motion';
import type React from 'react';
import type { Topic } from '@/features/topic-test/hooks/useTopicTestGenerator';
import ToggleSwitch from '@/shared/components/ToggleSwitch';
import { Button } from '@/shared/components/ui/button';

interface TopicTestConfigurationProps {
    selectedTopics: Topic[];
    setQuestionLimit: React.Dispatch<React.SetStateAction<number>>;
    questionLimit: number | 'all';
    setIncludeAttempted: React.Dispatch<React.SetStateAction<boolean>>;
    includeAttempted: boolean;
    onRemoveTopic: (topic: string) => void;
    setRecordActivity: React.Dispatch<React.SetStateAction<boolean>>;
    recordActivity: boolean;
}

const MAX_VISIBLE_PILLS = 10;

const TopicTestConfiguration = ({
    selectedTopics,
    setQuestionLimit,
    questionLimit,
    setIncludeAttempted,
    includeAttempted,
    onRemoveTopic,
    setRecordActivity,
    recordActivity,
}: TopicTestConfigurationProps) => {
    const visibleTopics = selectedTopics.slice(0, MAX_VISIBLE_PILLS);
    const hiddenCount = selectedTopics.length - visibleTopics.length;

    return (
        <AnimatePresence>
            {selectedTopics.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 space-y-6 border border-white/30 dark:border-white/10 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-3xl backdrop-saturate-150 shadow-2xl p-6"
                >
                    <div>
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">
                            Selected Topics ({selectedTopics.length})
                        </h3>

                        <div className="flex flex-wrap gap-2">
                            {visibleTopics.map((topic) => (
                                <span
                                    key={`${topic.subjectName}-${topic.name}`}
                                    className="inline-flex items-center gap-2 border border-blue-200/40 dark:border-blue-400/20 bg-blue-500/10 backdrop-blur-xl px-3 py-1 text-xs font-medium text-blue-700 dark:text-blue-300"
                                >
                                    <span className="opacity-70">
                                        {topic.subjectName}:
                                    </span>
                                    {topic.name}
                                    <button
                                        onClick={() =>
                                            onRemoveTopic(topic.name)
                                        }
                                        className="transition-colors hover:text-red-500"
                                    >
                                        <X weight="bold" />
                                    </button>
                                </span>
                            ))}

                            {hiddenCount > 0 && (
                                <span className="border border-white/20 dark:border-white/10 bg-black/5 dark:bg-white/5 backdrop-blur-xl px-3 py-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                                    +{hiddenCount} more
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="border-t border-white/20 dark:border-white/10" />

                    <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                        <Funnel className="w-4 h-4 text-orange-500" />
                        Step 3: Configure
                    </h3>

                    <div>
                        <label className="block text-sm font-medium text-gray-500 mb-3">
                            Number of Questions
                        </label>

                        <div className="flex flex-wrap gap-2">
                            {[10, 20, 30, 65].map((opt) => (
                                <Button
                                    key={opt}
                                    onClick={() => setQuestionLimit(opt)}
                                    className={`rounded-none px-4 py-2 text-sm font-medium transition-all ${questionLimit === opt ? 'bg-blue-600/90 text-white shadow-lg backdrop-blur-xl' : 'bg-white/30 dark:bg-white/10 text-gray-600 dark:text-gray-400 border border-white/20 hover:bg-white/50 dark:hover:bg-white/20'}`}
                                >
                                    {opt === 65 ? 'Max Available' : opt}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-white/20 dark:border-white/10 pt-4">
                        <div>
                            <p className="text-sm font-medium">
                                Include Attempted Questions
                            </p>
                            <span className="text-xs text-gray-400">
                                Allow recycling previously seen questions.
                            </span>
                        </div>

                        <ToggleSwitch
                            isOn={includeAttempted}
                            onToggle={() => setIncludeAttempted((v) => !v)}
                        />
                    </div>

                    <div className="flex items-center justify-between border-t border-white/20 dark:border-white/10 pt-4">
                        <div>
                            <p className="text-sm font-medium">
                                Record Test Activity
                            </p>
                            <span className="text-xs text-gray-400">
                                Include this test in your dashboard stats.
                            </span>
                        </div>

                        <ToggleSwitch
                            isOn={recordActivity}
                            onToggle={() => setRecordActivity((v) => !v)}
                        />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default TopicTestConfiguration;
