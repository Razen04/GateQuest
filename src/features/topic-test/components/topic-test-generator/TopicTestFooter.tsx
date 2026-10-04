import { ClockIcon } from '@phosphor-icons/react';
import { Button } from '@/shared/components/ui/button';

interface TopicTestFooterProps {
    estimatedTime: number;
    finalQuestionCount: number;
    handleStartTest: () => void;
    canGenerate: boolean;
    isGenerating: boolean;

    // Optional — differ between custom and PYQ modes.
    buttonLabel?: string;
    subtitle?: string;
}

const TopicTestFooter = ({
    estimatedTime,
    finalQuestionCount,
    handleStartTest,
    canGenerate,
    isGenerating,
    buttonLabel = 'Generate Test',
    subtitle,
}: TopicTestFooterProps) => {
    return (
        <div className="fixed inset-x-0 bottom-0 max-w-7xl mx-auto h-18 backdrop-blur-lg border-t border-gray-200 dark:border-zinc-800 p-4 z-50">
            <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col min-w-0">
                    <span className="text-[10px] text-gray-500 uppercase tracking-wide font-bold">
                        Estimated Time of test
                    </span>
                    <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                        <ClockIcon className="w-5 h-5 text-blue-500 shrink-0" />
                        <span className="text-xl font-bold">
                            {estimatedTime}m
                        </span>
                        <span className="text-sm text-gray-400 font-medium">
                            ({finalQuestionCount} Qs)
                        </span>
                    </div>
                </div>

                {subtitle && (
                    <div className="hidden md:flex flex-col items-end min-w-0">
                        <span className="text-[10px] text-gray-500 uppercase tracking-wide font-bold">
                            Paper
                        </span>
                        <span className="text-sm font-semibold truncate max-w-xs">
                            {subtitle}
                        </span>
                    </div>
                )}

                <Button
                    className="rounded-none shrink-0"
                    disabled={isGenerating || !canGenerate}
                    onClick={handleStartTest}
                >
                    {isGenerating ? 'Creating...' : buttonLabel}
                </Button>
            </div>
        </div>
    );
};

export default TopicTestFooter;
