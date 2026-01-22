import { getTestSession, updateAttempts } from '@/storage/testSession';
import type { Attempt, Question } from '@/types/storage';
import { isMultipleSelection, isNumericalQuestion } from '@/utils/questionUtils';
import { useCallback, useState } from 'react';

const useTestGrading = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const submitTest = useCallback(async (testId: string) => {
        setIsSubmitting(true);

        try {
            const testSession = await getTestSession(testId);

            if (!testSession) {
                throw new Error('No test session present');
            }
            const attempts: Attempt[] = testSession?.attempts;

            // fetch full questions from Dexie(indexedDB)
            const questions: Question[] = testSession.questions;
            // variables to track all the things
            let totalScore = 0;
            let correctCount = 0;
            let incorrectCount = 0;
            let unattemptedCount = 0;

            const updatedAttempts: Attempt[] = attempts.map((a) => {
                const question = questions.find((q) => q.id === a.question_id);
                if (!question) return a; // no question found.

                let score = 0;
                let status: 'correct' | 'incorrect' | 'skipped' = 'skipped';

                const userAnswer = a.user_answer;

                if (userAnswer === null || userAnswer === undefined) {
                    // unattempted
                    status = 'skipped';
                    score = 0;
                    unattemptedCount++;
                } else {
                    if (isNumericalQuestion(question)) {
                        const correctAnswer = question.correct_answer.toString();
                        const answerToCheck = userAnswer?.toString();
                        const isCorrect = answerToCheck === correctAnswer;

                        if (isCorrect) {
                            status = 'correct';
                            score = question.marks || 1; // for questions with no marks in data
                            correctCount++;
                        } else {
                            status = 'incorrect';
                            incorrectCount++;
                        }
                    } else if (!isNumericalQuestion(question) && !isMultipleSelection(question)) {
                        const userArray = Array.isArray(userAnswer) ? userAnswer : [userAnswer]; // safety
                        const sortedUser = [...userArray].sort((a, b) => a - b);

                        const correctArray = Array.isArray(question.correct_answer)
                            ? question.correct_answer
                            : [question.correct_answer];
                        const sortedCorrect = [...correctArray].sort((a, b) => a - b);

                        const isCorrect =
                            JSON.stringify(sortedUser) === JSON.stringify(sortedCorrect);

                        if (isCorrect) {
                            status = 'correct';
                            score = question.marks || 2;
                            correctCount++;
                        } else {
                            status = 'incorrect';
                            score = -(question.marks || 1) / 3;
                            incorrectCount++;
                        }
                    } else {
                        const userArray = Array.isArray(userAnswer) ? userAnswer : [userAnswer]; // safety
                        const sortedUser = [...userArray].sort((a, b) => a - b);

                        const correctArray = Array.isArray(question.correct_answer)
                            ? question.correct_answer
                            : [question.correct_answer];
                        const sortedCorrect = [...correctArray].sort((a, b) => a - b);

                        const isCorrect =
                            JSON.stringify(sortedUser) === JSON.stringify(sortedCorrect);
                        if (isCorrect) {
                            status = 'correct';
                            score = question.marks || 2;
                            correctCount++;
                        } else {
                            status = 'incorrect';
                            incorrectCount++;
                        }
                    }
                }

                totalScore += score;

                return {
                    ...a,
                    score,
                    is_correct: status === 'correct' ? true : false,
                    is_synced: 0,
                };
            });

            // updating attempts to indexedDB
            const attempted = incorrectCount + correctCount;
            await updateAttempts(testId, updatedAttempts, attempted, totalScore, correctCount);

            return {
                totalScore,
                correctCount,
                incorrectCount,
                unattemptedCount,
            };
        } finally {
            setIsSubmitting(false);
        }
    }, []);

    return {
        isSubmitting,
        submitTest,
    };
};

export default useTestGrading;
