import { Button } from '@/components/ui/button';
import { CaretUpIcon } from '@phosphor-icons/react';
import { ArrowRightIcon } from '@phosphor-icons/react';
import { CaretDownIcon } from '@phosphor-icons/react';
import { ArrowLeftIcon } from '@phosphor-icons/react';
import { BookmarkSimpleIcon } from '@phosphor-icons/react';
import { TrashSimpleIcon } from '@phosphor-icons/react';
import React from 'react';

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
        <div className="backdrop-blur-lg border-t border-gray-200 dark:border-zinc-800 p-2 md:p-4 z-50">
            <div
                className="
            grid grid-cols-5 gap-2 w-full
            md:flex md:gap-3 md:items-center md:justify-between
        "
            >
                <Button
                    onClick={onClearResponse}
                    aria-label="Clear response"
                    className="
                flex items-center justify-center
                px-3 py-3 text-sm font-medium
                bg-gray-500 text-white
                focus:outline-none focus:ring-2 focus:ring-gray-300
                md:px-3 md:py-2 md:justify-start md:gap-2
            "
                >
                    <TrashSimpleIcon size={18} />
                    <span className="sr-only md:not-sr-only">Clear Response</span>
                </Button>

                <Button
                    onClick={onMarkForReview}
                    aria-label="Mark for review"
                    className={`
                flex items-center justify-center
                px-3 py-3 text-sm font-medium border
                focus:outline-none focus:ring-2 transition-colors
                md:justify-start md:gap-2 md:px-3 md:py-2
                ${
                    isReviewMarked
                        ? 'border-purple-600 bg-purple-50 text-purple-700 focus:ring-purple-400'
                        : 'border-gray-300 bg-purple-500 text-white hover:bg-purple-600 focus:ring-gray-300'
                }
            `}
                >
                    <BookmarkSimpleIcon size={18} weight={isReviewMarked ? 'fill' : 'regular'} />
                    <span className="sr-only md:not-sr-only">Mark for Review</span>
                </Button>

                <Button
                    onClick={onTogglePalette}
                    aria-label="Toggle questions palette"
                    className="
                md:hidden
                flex items-center justify-center
                px-3 py-3 text-sm font-medium
            "
                >
                    {isPaletteOpen ? <CaretDownIcon size={18} /> : <CaretUpIcon size={18} />}
                </Button>

                <Button
                    onClick={onPrev}
                    disabled={isFirst}
                    aria-label="Previous question"
                    className={`
                flex items-center justify-center
                px-3 py-3 text-sm font-semibold
                focus:outline-none focus:ring-2
                md:px-4 md:py-2 md:justify-start md:gap-2
                ${
                    isFirst
                        ? 'cursor-not-allowed bg-gray-200 text-gray-400'
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200 focus:ring-blue-400'
                }
            `}
                >
                    <ArrowLeftIcon size={18} />
                    <span className="sr-only md:not-sr-only">Previous</span>
                </Button>

                <Button
                    onClick={onNext}
                    disabled={isLast}
                    aria-label="Next question"
                    className={`
                flex items-center justify-center
                px-3 py-3 text-sm font-semibold text-white
                focus:outline-none focus:ring-2
                md:px-4 md:py-2 md:justify-start md:gap-2
                ${
                    isLast
                        ? 'cursor-not-allowed bg-gray-300'
                        : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                }
            `}
                >
                    <ArrowRightIcon size={18} />
                    <span className="sr-only md:not-sr-only">Next</span>
                </Button>
            </div>
        </div>
    );
};

export default TestControlBar;
