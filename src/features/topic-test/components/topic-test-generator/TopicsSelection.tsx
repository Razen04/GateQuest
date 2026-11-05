import {
    CaretDown,
    Check,
    EraserIcon,
    ListChecksIcon,
    StackIcon,
} from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import type { Topic } from '@/features/topic-test/hooks/useTopicTestGenerator';
import { Button } from '@/shared/components/ui/button';

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
            selectedTopics.some(
                (st) => st.name === at.name && st.subjectId === at.subjectId
            )
        );
    }, [availableTopics, selectedTopics]);

    // Bulk selection
    const handleSelectAll = () => {
        if (isAllSelected) {
            // Deselect All: Toggle only those that are currently selected
            availableTopics.forEach((topic) => {
                const isSelected = selectedTopics.some(
                    (st) =>
                        st.name === topic.name &&
                        st.subjectId === topic.subjectId
                );
                if (isSelected) handleTopicToggle(topic);
            });
        } else {
            // Select All: Toggle only those that are NOT currently selected
            availableTopics.forEach((topic) => {
                const isSelected = selectedTopics.some(
                    (st) =>
                        st.name === topic.name &&
                        st.subjectId === topic.subjectId
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
                            className="h-10 px-3 rounded-none font-bold uppercase tracking-tighter bg-chart-1 text-white hover:bg-chart-1/90"
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
                        <label className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-foreground">
                            <StackIcon className="w-4 h-4 text-chart-6" />
                            Step 2: Select Topics
                        </label>

                        <span className="border border-border bg-foreground/[0.05] backdrop-blur-xl px-2 py-1 text-xs font-medium text-muted-foreground">
                            {selectedTopics.length} selected
                        </span>
                    </div>

                    {isTopicsLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {[...Array(6)].map((_, i) => (
                                <div
                                    key={i}
                                    className="h-14 bg-muted animate-pulse"
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
                                            t.subjectId === topic.subjectId
                                    );

                                    return (
                                        <div
                                            key={`${topic.subjectName}-${topic.name}`}
                                            onClick={() =>
                                                handleTopicToggle(topic)
                                            }
                                            className={`border backdrop-blur-xl cursor-pointer transition-all select-none flex items-center justify-between p-3 ${
                                                isSelected
                                                    ? 'bg-chart-1/10 border-chart-1 dark:bg-chart-1/20'
                                                    : 'bg-card/40 border-border hover:border-chart-1/40'
                                            }`}
                                        >
                                            <div>
                                                <p className="text-sm font-medium text-foreground">
                                                    {topic.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {includeAttempted
                                                        ? `${topic.questionCount} total questions`
                                                        : `${topic.unattemptedCount} available questions`}
                                                </p>
                                            </div>

                                            <div
                                                className={`w-5 h-5 border flex items-center justify-center ${
                                                    isSelected
                                                        ? 'bg-chart-1 border-chart-1 text-white'
                                                        : 'border-border'
                                                }`}
                                            >
                                                <Check
                                                    className="w-3 h-3"
                                                    strokeWidth={3}
                                                />
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
                                        onClick={() =>
                                            setShowMinorTopics((v) => !v)
                                        }
                                        variant="ghost"
                                        className="rounded-none flex items-center gap-1 font-medium"
                                    >
                                        Other topics ({minorTopics.length})
                                        <CaretDown
                                            className={`transition-transform ${showMinorTopics ? 'rotate-180' : ''}`}
                                        />
                                    </Button>

                                    <AnimatePresence>
                                        {showMinorTopics && (
                                            <motion.div
                                                initial={{
                                                    opacity: 0,
                                                    height: 0,
                                                }}
                                                animate={{
                                                    opacity: 1,
                                                    height: 'auto',
                                                }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2"
                                            >
                                                {minorTopics.map((topic) => {
                                                    const isSelected =
                                                        selectedTopics.some(
                                                            (t) =>
                                                                t.name ===
                                                                    topic.name &&
                                                                t.subjectId ===
                                                                    topic.subjectId
                                                        );

                                                    return (
                                                        <div
                                                            key={`${topic.subjectName}-${topic.name}`}
                                                            onClick={() =>
                                                                handleTopicToggle(
                                                                    topic
                                                                )
                                                            }
                                                            className={`border backdrop-blur-xl cursor-pointer flex justify-between items-center p-2 text-sm ${
                                                                isSelected
                                                                    ? 'bg-chart-1/10 border-chart-1 dark:bg-chart-1/20'
                                                                    : 'bg-card/40 border-border'
                                                            }`}
                                                        >
                                                            <div>
                                                                <span className="text-foreground">
                                                                    {topic.name}
                                                                    :{' '}
                                                                </span>
                                                                <span className="text-muted-foreground">
                                                                    {
                                                                        topic.questionCount
                                                                    }{' '}
                                                                    questions
                                                                </span>
                                                            </div>

                                                            <Check
                                                                className={`w-3 h-3 ${isSelected ? 'text-chart-1' : 'text-transparent'}`}
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
