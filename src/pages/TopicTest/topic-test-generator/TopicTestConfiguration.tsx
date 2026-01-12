import type React from 'react';
import { Funnel, X } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'framer-motion';
import ToggleSwitch from '@/components/ui/ToggleSwitch';
import type { Topic } from '@/hooks/topic-test/useTopicTestGenerator';
import { Button } from '@/components/ui/button';

interface TopicTestConfigurationProps {
    selectedTopics: Topic[];
    setQuestionLimit: React.Dispatch<React.SetStateAction<number>>;
    questionLimit: number | 'all';
    setIncludeAttempted: React.Dispatch<React.SetStateAction<boolean>>;
    includeAttempted: boolean;
    onRemoveTopic: (topic: string) => void;
}

const MAX_VISIBLE_PILLS = 10;

const TopicTestConfiguration = ({
    selectedTopics,
    setQuestionLimit,
    questionLimit,
    setIncludeAttempted,
    includeAttempted,
    onRemoveTopic,
}: TopicTestConfigurationProps) => {
    const visibleTopics = selectedTopics.slice(0, MAX_VISIBLE_PILLS);
    const hiddenCount = selectedTopics.length - visibleTopics.length;

    return (
        <AnimatePresence>
            {selectedTopics.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 mt-4 p-6 shadow-sm space-y-6"
                >
                    <div>
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">
                            Selected Topics ({selectedTopics.length})
                        </h3>

                        <div className="flex flex-wrap gap-2">
                            {visibleTopics.map((topic) => (
                                <span
                                    key={`${topic.subjectName}-${topic.name}`}
                                    className="inline-flex items-center gap-2 px-3 py-1 text-xs font-medium
                    bg-blue-50 text-blue-700 border border-blue-200
                    dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800"
                                >
                                    <span className="opacity-70">{topic.subjectName}:</span>
                                    {topic.name}
                                    <button
                                        onClick={() => onRemoveTopic(topic.name)}
                                        className="hover:text-red-500 transition-colors"
                                    >
                                        <X weight="bold" />
                                    </button>
                                </span>
                            ))}

                            {hiddenCount > 0 && (
                                <span className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-gray-400">
                                    +{hiddenCount} more
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="border-t border-gray-100 dark:border-zinc-800" />

                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
                        <Funnel className="w-4 h-4 text-orange-500" />
                        Step 3: Configure
                    </h3>

                    <div>
                        <label className="text-sm text-gray-500 mb-3 block font-medium">
                            Number of Questions
                        </label>

                        <div className="flex flex-wrap gap-2">
                            {[10, 20, 30, 65].map((opt) => (
                                <Button
                                    key={opt}
                                    onClick={() => setQuestionLimit(opt)}
                                    className={`
                    px-4 py-2 text-sm font-medium transition-all
                    ${
                        questionLimit === opt
                            ? 'bg-blue-700 dark:bg-blue text-white dark:text-white shadow'
                            : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
                    }
                  `}
                                >
                                    {opt === 65 ? 'Max Available' : opt}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium">Include Attempted Questions</p>
                            <span className="text-xs text-gray-400">
                                Allow recycling previously seen questions.
                            </span>
                        </div>

                        <ToggleSwitch
                            isOn={includeAttempted}
                            onToggle={() => setIncludeAttempted((v) => !v)}
                        />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default TopicTestConfiguration;
