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
        <div className="text-foreground">
            <div className="mb-4 sm:mb-6 overflow-x-auto">
                <div className="text-sm md:text-lg leading-relaxed">
                    {currentQuestion.question ? (
                        <Suspense fallback={<ModernLoader />}>
                            <MathRenderer text={currentQuestion.question} />
                        </Suspense>
                    ) : (
                        <span className="text-muted-foreground">
                            Question content unavailable
                        </span>
                    )}
                </div>
            </div>

            {hasOptions && onOptionSelect && (
                <div className="flex flex-col gap-2 sm:gap-3 mb-4 sm:mb-6">
                    {currentQuestion.options?.map((option, index) => {
                        const isSelected = isMultipleSelection(currentQuestion)
                            ? (selectedOptionIndices?.includes(index) ?? false)
                            : userAnswerIndex === index;

                        const correctAnswer = currentQuestion.correct_answer;

                        const isCorrect = isMultipleSelection(currentQuestion)
                            ? correctAnswer.includes(index)
                            : correctAnswer[0] === index;

                        let optionStyle =
                            'border-border hover:border-primary/50 hover:bg-accent/50';

                        if (showAnswer) {
                            if (isCorrect) {
                                optionStyle = 'border-green-500 bg-green-500/5';
                            } else if (isSelected) {
                                optionStyle =
                                    'border-destructive bg-destructive/5';
                            }
                        } else if (isSelected) {
                            optionStyle =
                                'border-primary ring-1 ring-primary bg-primary/5';
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
                                className={`relative overflow-hidden p-4 border bg-card text-card-foreground transition-all min-w-0 ${
                                    showAnswer
                                        ? 'cursor-default'
                                        : 'cursor-pointer'
                                } ${optionStyle}`}
                                onClick={() =>
                                    !showAnswer && onOptionSelect(index)
                                }
                            >
                                {percentage !== null && (
                                    <div
                                        aria-hidden="true"
                                        className="absolute inset-0 overflow-hidden pointer-events-none"
                                    >
                                        <div
                                            className={`absolute inset-y-0 left-0 transition-[width] duration-500 ${
                                                isCorrect
                                                    ? 'bg-green-500/15 dark:bg-green-500/20'
                                                    : 'bg-destructive/15'
                                            }`}
                                            style={{ width: `${percentage}%` }}
                                        >
                                            <div
                                                className={`absolute inset-y-0 right-0 w-[2px] ${
                                                    isCorrect
                                                        ? 'bg-green-500/80'
                                                        : 'bg-destructive/80'
                                                }`}
                                            />
                                        </div>
                                    </div>
                                )}

                                {percentage !== null && (
                                    <span
                                        className={`absolute -top-2 right-3 px-1.5 text-xs font-semibold tabular-nums bg-card ${
                                            isCorrect
                                                ? 'text-green-700 dark:text-green-400'
                                                : 'text-destructive'
                                        }`}
                                    >
                                        {percentage}% chose this
                                    </span>
                                )}

                                <div className="relative flex items-center min-w-0">
                                    {env === 'Practice' && (
                                        <span className="hidden lg:inline font-mono mr-2 text-muted-foreground shrink-0">
                                            [{String.fromCharCode(index + 65)}/
                                            {index + 1}]
                                        </span>
                                    )}

                                    {isMultipleSelection(currentQuestion) ? (
                                        <div
                                            className={`w-5 h-5 border flex items-center justify-center mr-3 shrink-0 ${
                                                isSelected
                                                    ? 'border-primary bg-primary'
                                                    : 'border-input'
                                            }`}
                                        >
                                            {isSelected && (
                                                <CheckCircle className="text-primary-foreground text-xs" />
                                            )}
                                        </div>
                                    ) : (
                                        <div
                                            className={`w-5 h-5 border flex items-center justify-center mr-3 shrink-0 ${
                                                userAnswerIndex === index
                                                    ? 'border-primary'
                                                    : 'border-input'
                                            }`}
                                        >
                                            {userAnswerIndex === index && (
                                                <div className="w-2.5 h-2.5 bg-primary" />
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
                                            <span className="text-muted-foreground">
                                                Option unavailable
                                            </span>
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
