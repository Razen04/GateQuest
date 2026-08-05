import { AnimatePresence, motion } from 'framer-motion';
import { Check, StackIcon, CaretDown, EraserIcon, ListChecksIcon } from '@phosphor-icons/react';
import { useMemo, useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import type { Topic } from '@/features/topic-test/hooks/useTopicTestGenerator';

interface TopicsSelectionProps {
    selectedSubjectId: string | null;
    selectedTopics: Topic[];
    isTopicsLoading: boolean;
    availableTopics: Topic[];
    handleTopicToggle: (topic: Topic) => void;
    includeAttempted: boolean;
}

const MOBILE_VISIBLE_LIMIT = 12;

const TopicsSelection = ({
    selectedSubjectId,
    selectedTopics,
    isTopicsLoading,
    availableTopics,
    handleTopicToggle,
    includeAttempted,
}: TopicsSelectionProps) => {
    const [showAllPrimary, setShowAllPrimary] = useState(false);
    const [showMinorTopics, setShowMinorTopics] = useState(false);

    // Checking if all topics are selected
    const isAllSelected = useMemo(() => {
        if (availableTopics.length === 0) return false;
        return availableTopics.every((at) =>
            selectedTopics.some((st) => st.name === at.name && st.subjectId === at.subjectId),
        );
    }, [availableTopics, selectedTopics]);

    // Bulk selection
    const handleSelectAll = () => {
        if (isAllSelected) {
            // Deselect All: Toggle only those that are currently selected
            availableTopics.forEach((topic) => {
                const isSelected = selectedTopics.some(
                    (st) => st.name === topic.name && st.subjectId === topic.subjectId,
                );
                if (isSelected) handleTopicToggle(topic);
            });
        } else {
            // Select All: Toggle only those that are NOT currently selected
            availableTopics.forEach((topic) => {
                const isSelected = selectedTopics.some(
                    (st) => st.name === topic.name && st.subjectId === topic.subjectId,
                );
                if (!isSelected) handleTopicToggle(topic);
            });
        }
    };

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
                    {!isTopicsLoading && availableTopics.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleSelectAll}
                            className="h-10 px-3 rounded-xl font-bold uppercase tracking-tighter bg-blue-500 text-white hover:bg-blue-600 dark:hover:bg-blue-500/80"
                        >
                            {isAllSelected ? (
                                <span className="flex items-center gap-1">
                                    <EraserIcon size={14} /> Deselect All
                                </span>
                            ) : (
                                <span className="flex items-center gap-1">
                                    <ListChecksIcon size={14} /> Select All
                                </span>
                            )}
                        </Button>
                    )}

                    <div className="flex justify-between items-end">
                        <label className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                            <StackIcon className="w-4 h-4 text-purple-500" />
                            Step 2: Select Topics
                        </label>

                        <span className="rounded-xl border border-white/20 dark:border-white/10 bg-black/5 dark:bg-white/5 backdrop-blur-xl px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                            {selectedTopics.length} selected
                        </span>
                    </div>

                    {isTopicsLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {[...Array(6)].map((_, i) => (
                                <div
                                    key={i}
                                    className="h-14 rounded-xl bg-gray-200 dark:bg-zinc-800 animate-pulse"
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
                                            t.subjectId === topic.subjectId,
                                    );

                                    return (
                                        <div
                                            key={`${topic.subjectName}-${topic.name}`}
                                            onClick={() => handleTopicToggle(topic)}
                                            className={`rounded-2xl border backdrop-blur-xl cursor-pointer transition-all select-none flex items-center justify-between p-3 ${isSelected ? 'bg-blue-500/10 border-blue-500 dark:bg-blue-500/20' : 'bg-white/40 dark:bg-zinc-900/40 border-white/30 dark:border-white/10 hover:border-blue-300'}`}
                                        >
                                            <div>
                                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                                    {topic.name}
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    {includeAttempted
                                                        ? `${topic.questionCount} total questions`
                                                        : `${topic.unattemptedCount} available questions`}
                                                </p>
                                            </div>

                                            <div
                                                className={`w-5 h-5 rounded-md border flex items-center justify-center ${isSelected ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-300 dark:border-zinc-700'}`}
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
                                            className={`transition-transform ${showMinorTopics ? 'rotate-180' : ''}`}
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
                                                            t.subjectId === topic.subjectId,
                                                    );

                                                    return (
                                                        <div
                                                            key={`${topic.subjectName}-${topic.name}`}
                                                            onClick={() => handleTopicToggle(topic)}
                                                            className={`rounded-xl border backdrop-blur-xl cursor-pointer flex justify-between items-center p-2 text-sm ${isSelected ? 'bg-blue-500/10 border-blue-500 dark:bg-blue-500/20' : 'bg-white/40 dark:bg-zinc-900/40 border-white/30 dark:border-white/10'}`}
                                                        >
                                                            <div>
                                                                <span>{topic.name}: </span>
                                                                <span className="text-stone-400">
                                                                    {topic.questionCount} questions
                                                                </span>
                                                            </div>

                                                            <Check
                                                                className={`w-3 h-3 ${isSelected ? 'text-blue-600' : 'text-transparent'}`}
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
