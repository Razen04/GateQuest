import clsx from 'clsx';
import React from 'react';
import { Button } from '@/shared/components/ui/button';
import type { Question } from '@/shared/types/storage';
import {
    getDisplayNumber,
    getPaletteSections,
    type PaletteSection,
} from '../../utils/questionPalette';

interface QuestionPaletteProps {
    questions: Question[];
    currentIndex: number;
    isAnswered: (id: string) => boolean;
    markedForReview: (id: string) => boolean;
    isVisited: (id: string) => boolean;
    onJumpTo: (index: number) => void;
    isOpen: boolean;
    onToggle: () => void;
    answeredCount: number;
    markedCount: number;
    visitedNotAnswered: number;
    unvisitedCount: number;
}

interface StatsTypes {
    answeredCount: number;
    markedCount: number;
    visitedNotAnswered: number;
    unvisitedCount: number;
}

const Stats = ({
    answeredCount,
    markedCount,
    visitedNotAnswered,
    unvisitedCount,
}: StatsTypes) => (
    <div className="grid grid-cols-2 gap-2 text-sm font-medium">
        <div className="bg-chart-2/10 text-chart-2 p-2 shadow-sm flex justify-between items-center">
            <p className="text-xs uppercase tracking-wide">Answered</p>
            <p className="text-xl font-semibold">{answeredCount}</p>
        </div>

        <div className="bg-chart-6/10 text-chart-6 p-2 shadow-sm flex justify-between items-center">
            <p className="text-xs uppercase tracking-wide">Marked</p>
            <p className="text-xl font-semibold">{markedCount}</p>
        </div>

        <div className="bg-chart-4/10 text-chart-4 p-2 shadow-sm">
            <div className="flex justify-between items-center">
                <p className="text-xs uppercase tracking-wide">Visited</p>
                <p className="text-xl font-semibold">{visitedNotAnswered}</p>
            </div>
            <p className="text-xs text-chart-4/70">Not Answered</p>
        </div>

        <div className="bg-muted text-muted-foreground p-2 shadow-sm flex justify-between items-center">
            <p className="text-xs uppercase tracking-wide">Unvisited</p>
            <p className="text-xl font-semibold">{unvisitedCount}</p>
        </div>
    </div>
);

interface PaletteGridProps {
    sections: PaletteSection[];
    questions: Question[];
    currentIndex: number;
    isAnswered: (id: string) => boolean;
    markedForReview: (id: string) => boolean;
    isVisited: (id: string) => boolean;
    onJumpTo: (index: number) => void;
    mobile?: boolean;
    onSelect?: () => void;
}

const PaletteGrid = ({
    sections,
    questions,
    currentIndex,
    isAnswered,
    markedForReview,
    isVisited,
    onJumpTo,
    mobile = false,
    onSelect,
}: PaletteGridProps) => (
    <>
        {sections.map((section) => (
            <React.Fragment key={section.label ?? 'all'}>
                {section.label && (
                    <h2 className="col-span-4 w-full border-b border-border pb-1 pt-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {section.label}
                    </h2>
                )}

                {section.indices.map((index) => {
                    const displayNumber = getDisplayNumber(questions, index);
                    const question = questions[index];
                    if (!question) return null;

                    const answered = isAnswered(question.id);
                    const review = markedForReview(question.id);
                    const active = index === currentIndex;
                    const visited = isVisited(question.id);

                    const stateClasses = clsx(
                        active && 'ring-2 ring-chart-1',
                        review && 'bg-chart-6/15 text-chart-6',
                        answered && !review && 'bg-chart-2/15 text-chart-2',
                        visited &&
                            !answered &&
                            !review &&
                            'bg-chart-4/15 text-chart-4',
                        !visited &&
                            !answered &&
                            !review &&
                            'bg-muted text-muted-foreground',
                        'hover:bg-accent'
                    );

                    if (mobile) {
                        return (
                            <Button
                                key={question.id}
                                onClick={() => {
                                    onJumpTo(index);
                                    onSelect?.();
                                }}
                                className={clsx(
                                    'h-14 w-14 rounded-none text-lg font-medium flex items-center justify-center transition duration-200',
                                    stateClasses
                                )}
                            >
                                {displayNumber}
                            </Button>
                        );
                    }

                    return (
                        <button
                            key={question.id}
                            onClick={() => onJumpTo(index)}
                            className={clsx(
                                'h-14 w-14 text-lg font-medium flex items-center justify-center transition duration-200',
                                stateClasses
                            )}
                        >
                            {displayNumber}
                        </button>
                    );
                })}
            </React.Fragment>
        ))}
    </>
);

const QuestionPalette: React.FC<QuestionPaletteProps> = ({
    questions,
    currentIndex,
    markedForReview,
    isAnswered,
    isVisited,
    onJumpTo,
    isOpen,
    onToggle,
    answeredCount,
    markedCount,
    visitedNotAnswered,
    unvisitedCount,
}) => {
    const sections = getPaletteSections(questions);

    return (
        <div>
            {/* DESKTOP */}
            <aside
                className={clsx(
                    'hidden md:flex flex-col bg-card transition-all duration-300 h-full'
                )}
            >
                <div className="p-6 space-y-4">
                    <div className="text-center space-y-1">
                        <h1 className="text-lg font-semibold text-foreground">
                            Question Palette
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {questions.length} questions
                        </p>
                    </div>
                    <Stats
                        answeredCount={answeredCount}
                        markedCount={markedCount}
                        visitedNotAnswered={visitedNotAnswered}
                        unvisitedCount={unvisitedCount}
                    />
                    <div className="grid grid-cols-4 gap-2">
                        <PaletteGrid
                            sections={sections}
                            questions={questions}
                            currentIndex={currentIndex}
                            isAnswered={isAnswered}
                            markedForReview={markedForReview}
                            isVisited={isVisited}
                            onJumpTo={onJumpTo}
                        />
                    </div>
                </div>
            </aside>

            {/* Mobile View */}
            <div
                className={clsx(
                    'fixed inset-x-0 bottom-0 z-40 bg-card border-t border-border transition-transform duration-300 md:hidden',
                    isOpen ? 'translate-y-0' : 'translate-y-full'
                )}
                style={{ height: '70vh' }}
            >
                <div className="h-full flex flex-col overflow-y-auto">
                    <div className="p-4 border-b border-border">
                        <h1 className="w-full text-center text-xl font-bold border-b border-border pb-4 text-foreground">
                            Question Palette
                        </h1>
                        <div className="font-bold text-center m-2 text-foreground">
                            Total: {questions.length}
                        </div>
                        <Stats
                            answeredCount={answeredCount}
                            markedCount={markedCount}
                            visitedNotAnswered={visitedNotAnswered}
                            unvisitedCount={unvisitedCount}
                        />
                    </div>

                    <div className="flex-1 p-4 pb-20">
                        <div className="grid grid-cols-4 gap-3 place-items-center">
                            <PaletteGrid
                                sections={sections}
                                questions={questions}
                                currentIndex={currentIndex}
                                isAnswered={isAnswered}
                                markedForReview={markedForReview}
                                isVisited={isVisited}
                                onJumpTo={onJumpTo}
                                mobile
                                onSelect={onToggle}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuestionPalette;
