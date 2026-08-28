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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6">
                    {currentQuestion.options?.map((option, index) => {
                        // For MSQ: selectedOptionIndices, for MCQ: userAnswerIndex
                        let isSelected;
                        if (isMultipleSelection(currentQuestion)) {
                            isSelected =
                                selectedOptionIndices?.includes(index) ?? false;
                        } else {
                            isSelected = userAnswerIndex === index;
                        }

                        let isCorrect;
                        const correctAnswer = currentQuestion.correct_answer;
                        if (isMultipleSelection(currentQuestion)) {
                            // MSQ
                            isCorrect = correctAnswer.includes(index);
                        } else {
                            // MCQ
                            isCorrect = correctAnswer[0] === index;
                        }

                        // Determine the final styles based on state
                        let optionStyle =
                            'border-gray-200 dark:border-zinc-700 hover:border-blue-200';
                        if (showAnswer) {
                            if (isCorrect)
                                optionStyle =
                                    'border-green-500 bg-green-50 dark:bg-green-600';
                            else if (isSelected)
                                optionStyle =
                                    'border-red-500 bg-red-50 dark:bg-red-600';
                        } else if (isSelected) {
                            optionStyle =
                                'border-blue-500 ring ring-blue-500 ring-offset-0';
                        }

                        return (
                            <motion.div
                                key={index}
                                whileHover={{
                                    scale: showAnswer ? 1 : 1.01,
                                }}
                                whileTap={{ scale: showAnswer ? 1 : 0.99 }}
                                className={`p-4 border transition-all ${showAnswer ? 'cursor-default' : 'cursor-pointer'} ${optionStyle}`}
                                onClick={() =>
                                    !showAnswer && onOptionSelect(index)
                                }
                            >
                                <div className="flex items-center">
                                    {env === 'Practice' && (
                                        <span className="hidden lg:inline font-mono mr-2 text-gray-300 dark:text-gray-500">
                                            [{String.fromCharCode(index + 65)}/
                                            {index + 1}]
                                        </span>
                                    )}
                                    {isMultipleSelection(currentQuestion) ? (
                                        // Checkbox for multiple selection
                                        <div
                                            className={`w-5 h-5 border rounded flex items-center justify-center mr-3 ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300 dark:border-gray-700'}`}
                                        >
                                            {isSelected && (
                                                <CheckCircle className="text-white text-xs" />
                                            )}
                                        </div>
                                    ) : (
                                        // Radio button for single selection
                                        <div
                                            className={`w-5 h-5 border flex items-center justify-center mr-3 ${userAnswerIndex === index ? 'border-blue-500' : 'border-gray-300 dark:border-gray-700'}`}
                                        >
                                            {userAnswerIndex === index && (
                                                <div className="w-2.5 h-2.5 bg-blue-500"></div>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex-1">
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
