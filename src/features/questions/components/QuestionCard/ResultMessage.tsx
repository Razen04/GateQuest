import { AnimatePresence, motion } from 'framer-motion';
import { lazy, Suspense } from 'react';

const MathRenderer = lazy(
    () => import('@/features/questions/components/Renderers/MathRenderer')
);

import ModernLoader from '@/shared/components/ModernLoader.tsx';
import type { Question } from '@/shared/types/storage.ts';
import {
    getCorrectAnswerText,
    isNumericalQuestion,
} from '../../utils/questionUtils.ts';

type ResultMessageProps = {
    showAnswer: boolean;
    result: string;
    currentQuestion: Question;
    numericalAnswer: number | null;
};

const ResultMessage = ({
    showAnswer,
    result,
    currentQuestion,
    numericalAnswer,
}: ResultMessageProps) => {
    const correctAnswer = getCorrectAnswerText(currentQuestion);
    const isNAT = isNumericalQuestion(currentQuestion);

    const resultStyles =
        result === 'correct'
            ? 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30'
            : result === 'incorrect'
              ? 'bg-destructive/10 text-destructive border-destructive/30'
              : 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/30';

    return (
        <AnimatePresence>
            {showAnswer && (
                <motion.div
                    className={`p-4 mb-6 border ${resultStyles}`}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                >
                    {result === 'correct' ? (
                        <div className="flex items-center gap-2">
                            <span className="font-semibold">
                                Correct! Well done.
                            </span>
                        </div>
                    ) : result === 'incorrect' ? (
                        <div className="flex flex-col gap-2">
                            <div>
                                Incorrect. The correct answer is:{' '}
                                <span className="font-semibold text-foreground">
                                    <Suspense fallback={<ModernLoader />}>
                                        <MathRenderer text={correctAnswer} />
                                    </Suspense>
                                </span>
                            </div>

                            {isNAT && (
                                <div className="text-sm text-muted-foreground">
                                    Your answer:{' '}
                                    <span className="font-semibold text-foreground">
                                        {numericalAnswer ?? 'Not provided'}
                                    </span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            <div>
                                Skipped. The correct answer is:{' '}
                                <span className="font-semibold text-foreground">
                                    <Suspense fallback={<ModernLoader />}>
                                        <MathRenderer text={correctAnswer} />
                                    </Suspense>
                                </span>
                            </div>
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ResultMessage;
