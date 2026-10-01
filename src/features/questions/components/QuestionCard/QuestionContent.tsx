import { CheckCircle } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { lazy, Suspense, useEffect } from 'react';
import ModernLoader from '@/shared/components/ModernLoader.js';
import type { Question } from '@/shared/types/storage.js';
import { isMultipleSelection } from '../../utils/questionUtils.js';

const MathRenderer = lazy(() => import('../Renderers/MathRenderer.js'));

type QuestionContentProps = {
    env: 'Test' | 'Practice';
    currentQuestion: Question;
    hasOptions: boolean;
    showAnswer: boolean;
    selectedOptionIndices: number[] | null;
    userAnswerIndex: number | number[] | null;
    onOptionSelect?: ((index: number) => void) | undefined;
    optionPercentages?: number[] | null;
};

// This component now only receives props. It has NO hooks.
const QuestionContent = ({
    env,
    currentQuestion,
    hasOptions,
    showAnswer,
    selectedOptionIndices,
    userAnswerIndex,
    onOptionSelect,
    optionPercentages,
}: QuestionContentProps) => {
    useEffect(() => {
        const handler = (e: Event) => {
            const customEvent = e as CustomEvent<number>;
            const idx = customEvent.detail;

            if (
                !showAnswer &&
                typeof idx === 'number' &&
                currentQuestion?.options &&
                idx < currentQuestion.options.length &&
                onOptionSelect
            ) {
                onOptionSelect(idx);
            }
        };

        window.addEventListener('selectOptionByIndex', handler);

        return () => window.removeEventListener('selectOptionByIndex', handler);
    }, [currentQuestion, showAnswer, onOptionSelect]);

    return (
        <div>
            <div className="mb-4 sm:mb-6 overflow-x-scroll">
                <div className="text-sm md:text-lg">
                    {currentQuestion.question ? (
                        <Suspense fallback={<ModernLoader />}>
                            <MathRenderer text={currentQuestion.question} />
                        </Suspense>
                    ) : (
                        <span>Question content unavailable</span>
                    )}
                </div>
            </div>

            {hasOptions && onOptionSelect && (
                <div className="flex flex-col gap-2 sm:gap-3 mb-4 sm:mb-6">
                    {currentQuestion.options?.map((option, index) => {
                        // Determine selection state (MCQ vs MSQ)
                        let isSelected;
                        if (isMultipleSelection(currentQuestion)) {
                            isSelected =
                                selectedOptionIndices?.includes(index) ?? false;
                        } else {
                            isSelected = userAnswerIndex === index;
                        }

                        // Determine correctness
                        let isCorrect;
                        const correctAnswer = currentQuestion.correct_answer;
                        if (isMultipleSelection(currentQuestion)) {
                            isCorrect = correctAnswer.includes(index);
                        } else {
                            isCorrect = correctAnswer[0] === index;
                        }

                        // Determine the row's border style
                        let optionStyle =
                            'border-gray-200 dark:border-zinc-700 hover:border-blue-200';
                        if (showAnswer) {
                            if (isCorrect) optionStyle = 'border-green-500';
                            else if (isSelected) optionStyle = 'border-red-500';
                        } else if (isSelected) {
                            optionStyle =
                                'border-blue-500 ring ring-blue-500 ring-offset-0';
                        }

                        const percentage =
                            showAnswer &&
                            optionPercentages?.[index] !== undefined
                                ? optionPercentages[index]
                                : null;

                        return (
                            <motion.div
                                key={index}
                                whileHover={{ scale: showAnswer ? 1 : 1.01 }}
                                whileTap={{ scale: showAnswer ? 1 : 0.99 }}
                                style={{ position: 'relative' }}
                                className={`p-4 border transition-all min-w-0 ${
                                    showAnswer
                                        ? 'cursor-default'
                                        : 'cursor-pointer'
                                } ${optionStyle}`}
                                onClick={() =>
                                    !showAnswer && onOptionSelect(index)
                                }
                            >
                                {/* Fill layer — clipped to the option box */}
                                {percentage !== null && (
                                    <div
                                        aria-hidden="true"
                                        className="absolute inset-0 overflow-hidden pointer-events-none"
                                    >
                                        <div
                                            className={`absolute inset-y-0 left-0 transition-[width] duration-500 ${
                                                isCorrect
                                                    ? 'bg-green-500/15 dark:bg-green-500/20'
                                                    : 'bg-red-500/15 dark:bg-red-500/20'
                                            }`}
                                            style={{ width: `${percentage}%` }}
                                        >
                                            <div
                                                className={`absolute inset-y-0 right-0 w-[2px] ${
                                                    isCorrect
                                                        ? 'bg-green-500/80'
                                                        : 'bg-red-500/80'
                                                }`}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Percentage badge on the top border */}
                                {percentage !== null && (
                                    <span
                                        className={`absolute -top-2 right-3 px-1.5 text-xs font-semibold tabular-nums bg-white dark:bg-zinc-900 ${
                                            isCorrect
                                                ? 'text-green-700 dark:text-green-400'
                                                : 'text-red-700 dark:text-red-400'
                                        }`}
                                    >
                                        {percentage}% chose this
                                    </span>
                                )}

                                {/* Content layer */}
                                <div className="relative flex items-center min-w-0">
                                    {env === 'Practice' && (
                                        <span className="hidden lg:inline font-mono mr-2 text-gray-300 dark:text-gray-500 shrink-0">
                                            [{String.fromCharCode(index + 65)}/
                                            {index + 1}]
                                        </span>
                                    )}

                                    {isMultipleSelection(currentQuestion) ? (
                                        <div
                                            className={`w-5 h-5 border rounded flex items-center justify-center mr-3 shrink-0 ${
                                                isSelected
                                                    ? 'border-blue-500 bg-blue-500'
                                                    : 'border-gray-300 dark:border-gray-700'
                                            }`}
                                        >
                                            {isSelected && (
                                                <CheckCircle className="text-white text-xs" />
                                            )}
                                        </div>
                                    ) : (
                                        <div
                                            className={`w-5 h-5 border flex items-center justify-center mr-3 shrink-0 ${
                                                userAnswerIndex === index
                                                    ? 'border-blue-500'
                                                    : 'border-gray-300 dark:border-gray-700'
                                            }`}
                                        >
                                            {userAnswerIndex === index && (
                                                <div className="w-2.5 h-2.5 bg-blue-500"></div>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex-1 min-w-0 overflow-x-auto">
                                        {option ? (
                                            <Suspense
                                                fallback={<ModernLoader />}
                                            >
                                                <MathRenderer text={option} />
                                            </Suspense>
                                        ) : (
                                            'Option unavailable'
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default QuestionContent;
