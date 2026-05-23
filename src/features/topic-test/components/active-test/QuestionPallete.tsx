import React from 'react';
import clsx from 'clsx';

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
    const Stats = () => (
        <div className="grid grid-cols-2 gap-2 text-sm font-medium">
            <div className="rounded-xl bg-green-100 text-green-800 p-4 shadow-sm">
                <p className="text-xs uppercase tracking-wide">Answered</p>
                <p className="text-xl font-semibold">{answeredCount}</p>
            </div>

            <div className="rounded-xl bg-purple-100 text-purple-800 p-4 shadow-sm">
                <p className="text-xs uppercase tracking-wide">Marked</p>
                <p className="text-xl font-semibold">{markedCount}</p>
            </div>

            <div className="rounded-xl bg-yellow-100 text-yellow-800 p-4 shadow-sm">
                <p className="text-xs uppercase tracking-wide">Visited</p>
                <p className="text-xl font-semibold">{visitedNotAnswered}</p>
                <p className="text-xs text-yellow-700">Not Answered</p>
            </div>

            <div className="rounded-xl bg-gray-100 text-gray-800 p-4 shadow-sm">
                <p className="text-xs uppercase tracking-wide">Unvisited</p>
                <p className="text-xl font-semibold">{unvisitedCount}</p>
            </div>
        </div>
    );

    return (
        <div>
            {/* DESKTOP */}
            <aside
                className={clsx(
                    'hidden md:flex flex-col border-l overflow-y-auto transition-all duration-300 h-full',
                )}
            >
                <div className="p-6 space-y-4">
                    {' '}
                    <div className="text-center space-y-1">
                        <h1 className="text-lg font-semibold">Question Palette</h1>
                        <p className="text-sm">{questions.length} questions</p>
                    </div>
                    <Stats />
                    <div className="grid grid-cols-4 gap-2">
                        {' '}
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
                                        'h-14 w-14 text-lg font-medium flex items-center justify-center transition duration-200 rounded-md',

                                        active && 'ring-2 ring-blue-500',

                                        review && 'bg-purple-100 text-purple-700',

                                        answered && !review && 'bg-green-100 text-green-700',

                                        visited &&
                                            !answered &&
                                            !review &&
                                            'bg-yellow-100 text-yellow-700',

                                        !visited &&
                                            !answered &&
                                            !review &&
                                            'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-100',

                                        'hover:bg-gray-200 dark:hover:bg-gray-800',
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
                    'fixed inset-x-0 bottom-0 z-40 bg-white dark:bg-zinc-900 border-t transition-transform duration-300 md:hidden',
                    isOpen ? 'translate-y-0' : 'translate-y-full',
                )}
                style={{ height: '70vh' }}
            >
                <div className="h-full flex flex-col overflow-y-auto">
                    <div className="p-4 border-b">
                        <h1 className="w-full text-center text-xl font-bold border-b pb-4">
                            Question Palette
                        </h1>
                        <div className="font-bold text-center m-2">Total: {questions.length}</div>
                        <Stats />
                    </div>

                    <div className="flex-1 p-4 pb-20">
                        <div className="grid grid-cols-4 gap-3 place-items-center">
                            {questions.map((q, idx) => {
                                const answered = isAnswered(q.id);
                                const review = markedForReview(q.id);
                                const active = idx === currentIndex;
                                const visited = isVisited(q.id);

                                return (
                                    <button
                                        key={q.id}
                                        onClick={() => {
                                            onJumpTo(idx);
                                            onToggle();
                                        }}
                                        className={clsx(
                                            'h-14 w-14 text-lg font-medium flex items-center justify-center transition duration-200 rounded',

                                            active && 'ring-2 ring-blue-500',

                                            review && 'bg-purple-100 text-purple-700',

                                            answered && !review && 'bg-green-100 text-green-700',

                                            visited &&
                                                !answered &&
                                                !review &&
                                                'bg-yellow-100 text-yellow-700',

                                            !visited &&
                                                !answered &&
                                                !review &&
                                                'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-100',

                                            'hover:bg-gray-200 dark:hover:bg-gray-800',
                                        )}
                                    >
                                        {idx + 1}
                                    </button>
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
