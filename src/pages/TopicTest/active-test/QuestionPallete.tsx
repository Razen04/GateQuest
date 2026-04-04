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
        <div className="grid grid-cols-2 gap-2 md:text-sm font-bold">
            <div className="text-green-600">Answered: {answeredCount}</div>
            <div className="text-purple-600">Marked: {markedCount}</div>
            <div className="text-yellow-600">Visited Not Answered: {visitedNotAnswered}</div>
            <div className="text-gray-500">Unvisited: {unvisitedCount}</div>
        </div>
    );

    const Legend = () => (
        <div className="flex flex-wrap gap-3 text-xs md:text-sm mt-2">
            <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-green-500 rounded-sm" /> Answered
            </span>
            <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-purple-500 rounded-sm" /> Marked
            </span>
            <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-yellow-400 rounded-sm" /> Visited
            </span>
            <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-gray-400 rounded-sm" /> Unvisited
            </span>
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
                    <h1 className="w-full text-center text-xl font-bold">Question Pallete</h1>
                    <div className="font-bold text-center">Total: {questions.length}</div>
                    <Stats />
                    <Legend />
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
                                        'h-14 w-14 text-lg font-medium flex items-center justify-center transition duration-200',

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
                <div className="h-full flex flex-col">
                    <div className="p-4 border-b">
                        <h1 className="w-full text-center text-xl font-bold border-b pb-4">
                            Question Palette
                        </h1>
                        <div className="font-bold text-center mt-2">Total: {questions.length}</div>
                        <Stats />
                        <Legend />
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 pb-20">
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
                                            'h-14 w-14 text-lg font-medium flex items-center justify-center transition duration-200',

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
