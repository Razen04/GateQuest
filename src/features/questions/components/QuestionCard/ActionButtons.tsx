import {
    ArrowLeft,
    ArrowRight,
    ChatCircle,
    Eye,
    Flag,
} from '@phosphor-icons/react';
import { Button } from '@/shared/components/ui/button.tsx';

type ActionButtonsProps = {
    isFirstQuestion: boolean;
    isLastQuestion: boolean;
    handleNext: () => void;
    handlePrevious: () => void;
    showAnswer: boolean;
    handleShowAnswer?: (() => void) | undefined;
    handleSubmit?: (() => void) | undefined;
    handleExplainationClick: () => void;
    isCompatible: boolean | undefined;
    hasSelection: boolean;
};

const ActionButtons = ({
    isFirstQuestion,
    isLastQuestion,
    handleNext,
    handlePrevious,
    showAnswer,
    handleShowAnswer,
    handleSubmit,
    handleExplainationClick,
    isCompatible,
    hasSelection,
}: ActionButtonsProps) => {
    return (
        <div className="flex fixed sm:static bottom-0 left-0 w-full z-30 p-2 gap-1 flex-row justify-between items-center bg-card border-t border-border">
            {/* Previous */}
            <Button
                className="rounded-none flex-1 text-base font-semibold flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-ring active:scale-95
                    bg-secondary text-secondary-foreground
                    enabled:hover:bg-secondary/80 enabled:active:bg-secondary/70
                    disabled:bg-muted disabled:text-muted-foreground disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={handlePrevious}
                disabled={isFirstQuestion}
                title="Previous"
            >
                <ArrowLeft className="inline text-lg" />
                <span className="hidden md:inline ml-2">
                    Previous <span className="font-mono">[Q/←]</span>
                </span>
            </Button>

            {/* Show/Submit or Show Explanation */}
            {!showAnswer && handleSubmit && handleShowAnswer ? (
                <>
                    <Button
                        className="flex-1 rounded-none px-2 py-3 text-base font-semibold flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-ring active:scale-95
                            bg-primary/10 text-primary
                            enabled:hover:bg-primary/20 enabled:active:bg-primary/25
                            disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => handleSubmit()}
                        title="Submit"
                        disabled={!isCompatible || !hasSelection}
                    >
                        <Eye className="inline text-lg" />
                        <span className="hidden md:inline ml-2">
                            Submit
                            {hasSelection && (
                                <span className="font-mono"> [⎵/↵]</span>
                            )}
                        </span>
                    </Button>
                    <Button
                        className="flex-1 px-2 py-3 rounded-none text-base font-semibold flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-ring active:scale-95
                            bg-chart-2/10 text-chart-2
                            enabled:hover:bg-chart-2/20 enabled:active:bg-chart-2/25
                            disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => handleShowAnswer()}
                        title="Show Answer"
                        disabled={!isCompatible}
                    >
                        <Flag className="inline text-lg" />
                        <span className="hidden md:inline ml-2">
                            Show Answer
                            {!hasSelection && (
                                <span className="font-mono"> [⎵/↵]</span>
                            )}
                        </span>
                    </Button>
                </>
            ) : (
                <Button
                    className="flex-1 px-2 py-3 rounded-none text-base font-semibold flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-ring active:scale-95
                        bg-chart-5/10 text-chart-5
                        enabled:hover:bg-chart-5/20 enabled:active:bg-chart-5/25"
                    onClick={() => handleExplainationClick()}
                    title="Show Explanation"
                >
                    <ChatCircle className="inline text-lg" />
                    <span className="hidden md:inline ml-2">
                        Show Explanation <span className="font-mono">[/]</span>
                    </span>
                </Button>
            )}
            {/* Next */}
            <Button
                className="flex-1 px-2 rounded-none py-3 text-base font-semibold flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-ring active:scale-95
                    bg-secondary text-secondary-foreground
                    enabled:hover:bg-secondary/80 enabled:active:bg-secondary/70
                    disabled:bg-muted disabled:text-muted-foreground disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={handleNext}
                disabled={isLastQuestion}
                title="Next"
            >
                <ArrowRight className="inline text-lg" />
                <span className="hidden md:inline ml-2">
                    Next <span className="font-mono">[W/→]</span>
                </span>
            </Button>
        </div>
    );
};

export default ActionButtons;
