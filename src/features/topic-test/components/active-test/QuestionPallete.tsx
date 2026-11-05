import clsx from 'clsx';
import React from 'react';
import { Button } from '@/shared/components/ui/button';

interface QuestionPaletteProps {
    questions: { id: string }[];
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
                        {questions.map((q, idx) => {
                            const answered = isAnswered(q.id);
                            const review = markedForReview(q.id);
                            const active = idx === currentIndex;
                            const visited = isVisited(q.id);
                            return (
                                <button
                                    key={q.id}
                                    onClick={() => onJumpTo(idx)}
                                    className={clsx(
                                        'h-14 w-14 text-lg font-medium flex items-center justify-center transition duration-200',

                                        active && 'ring-2 ring-chart-1',

                                        review && 'bg-chart-6/15 text-chart-6',

                                        answered &&
                                            !review &&
                                            'bg-chart-2/15 text-chart-2',

                                        visited &&
                                            !answered &&
                                            !review &&
                                            'bg-chart-4/15 text-chart-4',

                                        !visited &&
                                            !answered &&
                                            !review &&
                                            'bg-muted text-muted-foreground',

                                        'hover:bg-accent'
                                    )}
                                >
                                    {idx + 1}
                                </button>
                            );
                        })}
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
                            {questions.map((q, idx) => {
                                const answered = isAnswered(q.id);
                                const review = markedForReview(q.id);
                                const active = idx === currentIndex;
                                const visited = isVisited(q.id);

                                return (
                                    <Button
                                        key={q.id}
                                        onClick={() => {
                                            onJumpTo(idx);
                                            onToggle();
                                        }}
                                        className={clsx(
                                            'h-14 w-14 rounded-none text-lg font-medium flex items-center justify-center transition duration-200',

                                            active && 'ring-2 ring-chart-1',

                                            review &&
                                                'bg-chart-6/15 text-chart-6',

                                            answered &&
                                                !review &&
                                                'bg-chart-2/15 text-chart-2',

                                            visited &&
                                                !answered &&
                                                !review &&
                                                'bg-chart-4/15 text-chart-4',

                                            !visited &&
                                                !answered &&
                                                !review &&
                                                'bg-muted text-muted-foreground',

                                            'hover:bg-accent'
                                        )}
                                    >
                                        {idx + 1}
                                    </Button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuestionPalette;
