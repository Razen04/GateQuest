import { Button } from '@/components/ui/button';
import type { Topic } from '@/hooks/topic-test/useTopicTestGenerator';
import { ClockIcon } from '@phosphor-icons/react';

interface TopicTestFooterProps {
    estimatedTime: number;
    finalQuestionCount: number;
    selectedTopics: Topic[];
    handleStartTest: () => void;
    canGenerate: boolean;
    isGenerating: boolean;
}

const TopicTestFooter = ({
    estimatedTime,
    finalQuestionCount,
    handleStartTest,
    canGenerate,
    isGenerating,
}: TopicTestFooterProps) => {
    return (
        <div className="fixed bottom-0 w-full h-18 backdrop-blur-lg border-t border-gray-200 dark:border-zinc-800 p-4 z-50">
            <div className="max-w-6xl flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 uppercase tracking-wide font-bold">
                        Estimated Time of test
                    </span>
                    <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                        <ClockIcon className="w-5 h-5 text-blue-500" />
                        <span className="text-xl font-bold">{estimatedTime}m</span>
                        <span className="text-sm text-gray-400 font-medium">
                            ({finalQuestionCount} Qs)
                        </span>
                    </div>
                </div>
                <Button disabled={isGenerating || !canGenerate} onClick={handleStartTest}>
                    Generate Test
                </Button>
            </div>
        </div>
    );
};

export default TopicTestFooter;
