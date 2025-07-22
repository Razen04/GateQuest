import { toast } from 'sonner';
import { isNumericalQuestion } from './questionUtils';
import { recordAttempt } from '../helper';

export const submitAndRecordAnswer = async ({
    currentQuestion,
    selectedOptionIndices,
    numericalAnswer,
    timeTaken,
    user,
    updateStats
}) => {
    // 1. Determine Correctness
    let isCorrect = null; // Default to null (unattempted)
    const correctAnswer = currentQuestion.correctAnswer || [];

    const wasAttempted = selectedOptionIndices.length > 0 || (isNumericalQuestion(currentQuestion) && numericalAnswer?.trim() !== '');

    if (wasAttempted) {
        if (isNumericalQuestion(currentQuestion)) {
            const answerToCheck = parseFloat(numericalAnswer?.toString().trim());
            const correctValue = parseFloat(correctAnswer);
            isCorrect = !isNaN(answerToCheck) && answerToCheck === correctValue;
        } else {
            // This logic works for both MCQ and MSQ.
            function arraysMatch(a, b) {
                if (a.length !== b.length) return false;

                const sortedA = [...a].sort((x, y) => x - y);
                const sortedB = [...b].sort((x, y) => x - y);

                return sortedA.every((val, index) => val === sortedB[index]);
            }

            isCorrect = arraysMatch(selectedOptionIndices, correctAnswer);
        }
    }
    // If not attempted, `isCorrect` remains null.

    // 2. Record the Attempt
    (async () => {
        if (user?.id) {
            try {
                await recordAttempt({
                    user_id: user.id,
                    question_id: currentQuestion.id,
                    subject: currentQuestion.subject,
                    was_correct: isCorrect, // This can now be true, false, or null
                    time_taken: timeTaken,
                    attempt_number: 1
                }, user);
                await updateStats(user);
            } catch (error) {
                console.error("Failed to record attempt:", error);
                toast.error("Could not save your attempt.");
            }
        }
    })();


    if (isCorrect === true) return 'correct';
    if (isCorrect === false) return 'incorrect';
    return 'unattempted';
};