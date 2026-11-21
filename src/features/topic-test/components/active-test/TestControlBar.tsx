import {
    ArrowLeftIcon,
    ArrowRightIcon,
    BookmarkSimpleIcon,
    CaretDownIcon,
    CaretUpIcon,
    SquaresFourIcon,
    TrashSimpleIcon,
} from '@phosphor-icons/react';
import React from 'react';
import { Button } from '@/shared/components/ui/button';

interface TestControlBarProps {
    isFirst: boolean;
    isLast: boolean;
    onNext: () => void;
    onPrev: () => void;
    onMarkForReview: () => void;
    onClearResponse: () => void;
    onTogglePalette: () => void;
    isReviewMarked: boolean;
    isPaletteOpen: boolean;
}

const TestControlBar: React.FC<TestControlBarProps> = ({
    isFirst,
    isLast,
    onNext,
    onPrev,
    onMarkForReview,
    onClearResponse,
    isReviewMarked,
    onTogglePalette,
    isPaletteOpen,
}) => {
    return (
        <div className="sticky bottom-0 z-50 bg-card/95 backdrop-blur-md border-t border-border p-2.5 md:p-3">
            <div className="w-full flex flex-col md:flex-row gap-2.5 md:items-center md:justify-between max-w-7xl mx-auto">
                {/* 
                  MOBILE ROW 1 / DESKTOP LEFT: 
                  Contextual Actions (Clear & Mark for Review)
                */}
                <div className="flex items-center justify-between md:justify-start gap-2 w-full md:w-auto">
                    <div className="flex items-center gap-2 flex-1 md:flex-initial">
                        {/* Clear Response */}
                        <Button
                            onClick={onClearResponse}
                            variant="outline"
                            size="sm"
                            aria-label="Clear response"
                            className="flex-1 md:flex-initial h-9 px-3 rounded-none text-xs font-semibold text-muted-foreground border-border hover:bg-accent hover:text-accent-foreground"
                        >
                            <TrashSimpleIcon
                                size={16}
                                className="mr-1.5 shrink-0"
                            />
                            <span>Clear</span>
                        </Button>

                        {/* Mark for Review */}
                        <Button
                            onClick={onMarkForReview}
                            size="sm"
                            aria-label="Mark for review"
                            className={`flex-1 md:flex-initial h-9 px-3 rounded-none text-xs font-semibold transition-colors border ${
                                isReviewMarked
                                    ? 'bg-chart-6 text-white border-chart-6 hover:bg-chart-6/90'
                                    : 'bg-chart-6/10 text-chart-6 border-chart-6/30 hover:bg-chart-6/20'
                            }`}
                        >
                            <BookmarkSimpleIcon
                                size={16}
                                weight={isReviewMarked ? 'fill' : 'regular'}
                                className="mr-1.5 shrink-0"
                            />
                            <span>
                                {isReviewMarked ? 'Marked' : 'Mark Review'}
                            </span>
                        </Button>
                    </div>

                    {/* Mobile Only Palette Drawer Toggle */}
                    <Button
                        onClick={onTogglePalette}
                        variant="outline"
                        size="sm"
                        aria-label="Toggle questions palette"
                        className="md:hidden h-9 px-3 rounded-none border-border text-foreground"
                    >
                        <SquaresFourIcon size={16} className="mr-1" />
                        {isPaletteOpen ? (
                            <CaretDownIcon size={14} />
                        ) : (
                            <CaretUpIcon size={14} />
                        )}
                    </Button>
                </div>

                {/* 
                  MOBILE ROW 2 / DESKTOP RIGHT: 
                  Primary Navigation (Previous & Next)
                */}
                <div className="grid grid-cols-2 md:flex items-center gap-2 w-full md:w-auto">
                    <Button
                        onClick={onPrev}
                        disabled={isFirst}
                        variant="outline"
                        size="sm"
                        aria-label="Previous question"
                        className="h-10 md:h-9 px-4 rounded-none text-xs font-semibold border-border text-foreground disabled:opacity-40"
                    >
                        <ArrowLeftIcon size={16} className="mr-1.5" />
                        Previous
                    </Button>

                    <Button
                        onClick={onNext}
                        disabled={isLast}
                        size="sm"
                        aria-label="Next question"
                        className="h-10 md:h-9 px-4 rounded-none text-xs font-semibold bg-chart-1 hover:bg-chart-1/90 text-white disabled:opacity-40"
                    >
                        Next
                        <ArrowRightIcon size={16} className="ml-1.5" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default TestControlBar;
