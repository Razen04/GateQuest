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
                    className="mt-4 space-y-6 border border-border bg-card/40 backdrop-blur-3xl backdrop-saturate-150 shadow-2xl p-6"
                >
                    <div>
                        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3">
                            Selected Topics ({selectedTopics.length})
                        </h3>

                        <div className="flex flex-wrap gap-2">
                            {visibleTopics.map((topic) => (
                                <span
                                    key={`${topic.subjectName}-${topic.name}`}
                                    className="inline-flex items-center gap-2 border border-chart-1/30 bg-chart-1/10 backdrop-blur-xl px-3 py-1 text-xs font-medium text-chart-1"
                                >
                                    <span className="opacity-70">
                                        {topic.subjectName}:
                                    </span>
                                    {topic.name}
                                    <button
                                        onClick={() =>
                                            onRemoveTopic(topic.name)
                                        }
                                        className="transition-colors hover:text-destructive"
                                    >
                                        <X weight="bold" />
                                    </button>
                                </span>
                            ))}

                            {hiddenCount > 0 && (
                                <span className="border border-border bg-foreground/[0.05] backdrop-blur-xl px-3 py-1 text-xs font-medium text-muted-foreground">
                                    +{hiddenCount} more
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="border-t border-border" />

                    <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground uppercase tracking-wide">
                        <Funnel className="w-4 h-4 text-chart-5" />
                        Step 3: Configure
                    </h3>

                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-3">
                            Number of Questions
                        </label>

                        <div className="flex flex-wrap gap-2">
                            {[10, 20, 30, 65].map((opt) => (
                                <Button
                                    key={opt}
                                    onClick={() => setQuestionLimit(opt)}
                                    className={`rounded-none px-4 py-2 text-sm font-medium transition-all ${
                                        questionLimit === opt
                                            ? 'bg-chart-1 text-white shadow-lg backdrop-blur-xl hover:bg-chart-1/90'
                                            : 'bg-muted/50 text-muted-foreground border border-border hover:bg-muted'
                                    }`}
                                >
                                    {opt === 65 ? 'Max Available' : opt}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-border pt-4">
                        <div>
                            <p className="text-sm font-medium">
                                Include Attempted Questions
                            </p>
                            <span className="text-xs text-muted-foreground">
                                Include previously attempted questions,
                                including incorrect questions due for Smart
                                Revision.
                            </span>
                        </div>

                        <ToggleSwitch
                            isOn={includeAttempted}
                            onToggle={() => setIncludeAttempted((v) => !v)}
                        />
                    </div>

                    <div className="flex items-center justify-between border-t border-border pt-4">
                        <div>
                            <p className="text-sm font-medium">
                                Record Test Activity
                            </p>
                            <span className="text-xs text-muted-foreground">
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
