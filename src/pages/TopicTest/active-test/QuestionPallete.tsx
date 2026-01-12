import React from 'react';
import clsx from 'clsx';

interface QuestionPaletteProps {
    questions: { id: string }[];
    currentIndex: number;
    isAnswered: (id: string) => boolean;
    markedForReview: (id: string) => boolean;
    onJumpTo: (index: number) => void;
    isOpen: boolean;
    onToggle: () => void;
}

const QuestionPalette: React.FC<QuestionPaletteProps> = ({
    questions,
    currentIndex,
    markedForReview,
    isAnswered,
    onJumpTo,
    isOpen,
    onToggle,
}) => {
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
                    <div className="grid grid-cols-4 gap-2">
                        {' '}
                        {questions.map((q, idx) => {
                            const answered = isAnswered(q.id);
                            const review = markedForReview(q.id);
                            const active = idx === currentIndex;

                            return (
                                <button
                                    key={q.id}
                                    onClick={() => onJumpTo(idx)}
                                    className={clsx(
                                        'h-14 w-14 text-lg font-medium flex items-center justify-center transition duration-200',
                                        active && 'ring-2 ring-blue-500',
                                        review && 'bg-purple-100 text-purple-700',
                                        answered && !review && 'bg-green-100 text-green-700',
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
                        <h1 className="w-full text-center text-xl font-bold">Question Palette</h1>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 pb-20">
                        <div className="grid grid-cols-4 gap-3 place-items-center">
                            {questions.map((q, idx) => {
                                const answered = isAnswered(q.id);
                                const review = markedForReview(q.id);
                                const active = idx === currentIndex;

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
                                            !answered &&
                                                !review &&
                                                'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-100',
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
