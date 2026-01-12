import { AnimatePresence, motion } from 'framer-motion';
import { Check, StackIcon, CaretDown } from '@phosphor-icons/react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { Topic } from '@/hooks/topic-test/useTopicTestGenerator';

interface TopicsSelectionProps {
    selectedSubjectId: number | null;
    selectedTopics: Topic[];
    isTopicsLoading: boolean;
    availableTopics: Topic[];
    handleTopicToggle: (topic: Topic) => void;
}

const MOBILE_VISIBLE_LIMIT = 12;

const TopicsSelection = ({
    selectedSubjectId,
    selectedTopics,
    isTopicsLoading,
    availableTopics,
    handleTopicToggle,
}: TopicsSelectionProps) => {
    const [showAllPrimary, setShowAllPrimary] = useState(false);
    const [showMinorTopics, setShowMinorTopics] = useState(false);

    const { primaryTopics, minorTopics } = useMemo(() => {
        return {
            primaryTopics: availableTopics.filter((t) => t.questionCount >= 10),
            minorTopics: availableTopics.filter((t) => t.questionCount < 10),
        };
    }, [availableTopics]);

    const visiblePrimaryTopics = showAllPrimary
        ? primaryTopics
        : primaryTopics.slice(0, MOBILE_VISIBLE_LIMIT);

    return (
        <AnimatePresence mode="wait">
            {selectedSubjectId && (
                <motion.div
                    key="topics-section"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4"
                >
                    <div className="flex justify-between items-end">
                        <label className="text-sm font-semibold uppercase tracking-wide flex items-center gap-2 text-gray-700 dark:text-gray-300">
                            <StackIcon className="w-4 h-4 text-purple-500" />
                            Step 2: Select Topics
                        </label>

                        <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-gray-400">
                            {selectedTopics.length} selected
                        </span>
                    </div>

                    {isTopicsLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {[...Array(6)].map((_, i) => (
                                <div
                                    key={i}
                                    className="h-14 bg-gray-200 dark:bg-zinc-800 animate-pulse"
                                />
                            ))}
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {visiblePrimaryTopics.map((topic) => {
                                    const isSelected = selectedTopics.some(
                                        (t) =>
                                            t.name === topic.name &&
                                            t.subjectName === topic.subjectName,
                                    );

                                    return (
                                        <div
                                            key={`${topic.subjectName}-${topic.name}`}
                                            onClick={() => handleTopicToggle(topic)}
                                            className={`p-3 border cursor-pointer transition-all select-none flex items-center justify-between
                        ${
                            isSelected
                                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                                : 'bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 hover:border-blue-300'
                        }`}
                                        >
                                            <div>
                                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                                    {topic.name}
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    {topic.questionCount} questions
                                                </p>
                                            </div>

                                            <div
                                                className={`w-5 h-5 border flex items-center justify-center
                          ${
                              isSelected
                                  ? 'bg-blue-500 border-blue-500 text-white'
                                  : 'border-gray-300 dark:border-zinc-700'
                          }`}
                                            >
                                                <Check className="w-3 h-3" strokeWidth={3} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {primaryTopics.length > MOBILE_VISIBLE_LIMIT && (
                                <Button
                                    onClick={() => setShowAllPrimary((v) => !v)}
                                    variant="ghost"
                                    className="text-sm font-medium"
                                >
                                    {showAllPrimary
                                        ? 'Show fewer topics'
                                        : `Show all major topics (${primaryTopics.length})`}
                                </Button>
                            )}

                            {minorTopics.length > 0 && (
                                <div>
                                    <Button
                                        onClick={() => setShowMinorTopics((v) => !v)}
                                        variant="ghost"
                                        className="flex items-center gap-1 font-medium"
                                    >
                                        Other topics ({minorTopics.length})
                                        <CaretDown
                                            className={`transition-transform ${
                                                showMinorTopics ? 'rotate-180' : ''
                                            }`}
                                        />
                                    </Button>

                                    <AnimatePresence>
                                        {showMinorTopics && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2"
                                            >
                                                {minorTopics.map((topic) => {
                                                    const isSelected = selectedTopics.some(
                                                        (t) =>
                                                            t.name === topic.name &&
                                                            t.subjectName === topic.subjectName,
                                                    );

                                                    return (
                                                        <div
                                                            key={`${topic.subjectName}-${topic.name}`}
                                                            onClick={() => handleTopicToggle(topic)}
                                                            className={`p-2 border text-sm cursor-pointer flex justify-between items-center
                                ${
                                    isSelected
                                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                                        : 'border-gray-200 dark:border-zinc-800'
                                }`}
                                                        >
                                                            <div>
                                                                <span>{topic.name}: </span>
                                                                <span className="text-stone-400">
                                                                    {topic.questionCount} questions
                                                                </span>
                                                            </div>

                                                            <Check
                                                                className={`w-3 h-3 ${
                                                                    isSelected
                                                                        ? 'text-blue-600'
                                                                        : 'text-transparent'
                                                                }`}
                                                            />
                                                        </div>
                                                    );
                                                })}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}
                        </>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default TopicsSelection;
