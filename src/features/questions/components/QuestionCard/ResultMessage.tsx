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
    return (
        <AnimatePresence>
            {showAnswer && (
                <motion.div
                    className={`p-4 mb-6 ${
                        result === 'correct'
                            ? 'bg-green-50 text-green-700'
                            : result === 'incorrect'
                              ? 'bg-red-50 text-red-700'
                              : 'bg-yellow-50 text-yellow-700'
                    }`}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                >
                    {result === 'correct' ? (
                        <div className="flex items-center">
                            <span>Correct! Well done.</span>
                        </div>
                    ) : result === 'incorrect' ? (
                        <div className="flex items-center">
                            <div>
                                Incorrect. The correct answer is:{' '}
                                <span className="font-semibold">
                                    <Suspense fallback={<ModernLoader />}>
                                        <MathRenderer text={correctAnswer} />
                                    </Suspense>
                                </span>
                                <br />
                                {isNAT && `Your answer: ${numericalAnswer}`}
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center">
                            <div>
                                Skipped. The correct answer is:{' '}
                                <Suspense fallback={<ModernLoader />}>
                                    <MathRenderer text={correctAnswer} />
                                </Suspense>
                            </div>
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ResultMessage;
