import { motion, AnimatePresence } from 'framer-motion';
import MathRenderer from '../MathRenderer.js';
import { useEffect, useRef } from 'react';
import useSettings from '../../../hooks/useSettings.ts';
import type { Question } from '../../../types/question.ts';
import { getCorrectAnswerText } from '../../../utils/questionUtils.ts';

type ResultMessageProps = {
    showAnswer: boolean;
    result: string;
    currentQuestion: Question;
};

const ResultMessage = ({ showAnswer, result, currentQuestion }: ResultMessageProps) => {
    const { settings } = useSettings();
    // Use settings.sound value

    const correctSoundRef = useRef<HTMLAudioElement | null>(null);
    const wrongSoundRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (settings.sound) {
            correctSoundRef.current = new Audio('/correct.wav');
            correctSoundRef.current.preload = 'auto';

            wrongSoundRef.current = new Audio('/wrong.wav');
            wrongSoundRef.current.preload = 'auto';
        }
    }, [settings.sound]);

    useEffect(() => {
        if (!showAnswer || !settings.sound) return;

        let soundToPlay = null;

        if (result === 'correct') {
            soundToPlay = correctSoundRef.current?.cloneNode() as HTMLAudioElement;
        } else if (result === 'incorrect') {
            soundToPlay = wrongSoundRef.current?.cloneNode() as HTMLAudioElement;
        }

        soundToPlay?.play().catch((e) => {
            console.warn('Sound failed to play: ', e);
        });
    }, [showAnswer, result, settings.sound]);

    const correctAnswer = getCorrectAnswerText(currentQuestion);

    return (
        <AnimatePresence>
            {showAnswer && (
                <motion.div
                    className={`p-4 mb-6 rounded-lg ${
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
                                    <MathRenderer text={correctAnswer} />
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center">
                            <div>
                                The correct answer is: <MathRenderer text={correctAnswer} />
                            </div>
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ResultMessage;
