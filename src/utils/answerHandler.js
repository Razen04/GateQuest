import { toast } from 'sonner';
import { isNumericalQuestion } from './questionUtils';
import { recordAttempt } from '../helper';

export const submitAndRecordAnswer = async ({
    currentQuestion,
    selectedOptionIndices,
    numericalAnswer,
    timeTaken,
    user,
    isLogin,
    updateStats
}) => {
    // 1. Determine Correctness
    let isCorrect = false;
    const correctAnswer = currentQuestion.correctAnswer || []
    if (isNumericalQuestion(currentQuestion)) {
        const answerToCheck = parseFloat(numericalAnswer?.toString().trim());
        const correctValue = parseFloat(currentQuestion?.correctAnswer);
        isCorrect = !isNaN(answerToCheck) && answerToCheck === correctValue;
    } else {
        // This logic now works for both MCQ and MSQ perfectly.
        // It checks if the user's selected indices match the correct answer indices exactly.
        const sortedUserSelection = [...selectedOptionIndices].sort();
        const sortedCorrectAnswer = [...correctAnswer].sort();

        isCorrect = sortedUserSelection.length === sortedCorrectAnswer.length &&
            sortedUserSelection.every((value, index) => value === sortedCorrectAnswer[index]);
    }


    // 2. Record the Attempt
    if (user?.id) {
        try {
            await recordAttempt({
                user_id: user.id,
                question_id: currentQuestion.id,
                subject: currentQuestion.subject,
                was_correct: isCorrect,
                time_taken: timeTaken,
                attempt_number: 1
            }, isLogin);
            await updateStats(isLogin);
        } catch (error) {
            console.error("Failed to record attempt:", error);
            toast.error("Could not save your attempt.");
        }
    }

    // 3. Return the result for the UI
    return isCorrect ? 'correct' : 'incorrect';
};