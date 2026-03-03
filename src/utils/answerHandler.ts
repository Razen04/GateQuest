import { toast } from 'sonner';
import { isNumericalQuestion } from './questionUtils.js';
import { recordAttemptLocally } from '../helper.js';
import type { Question } from '../types/question.js';
import type { AppUser } from '../types/AppUser.js';
import type { NumericalAnswerSpec } from '@/types/storage.js';

type submitAndRecordAnswerProp = {
    currentQuestion: Question;
    selectedOptionIndices: number[] | null;
    numericalAnswer: number | null;
    timeTaken: number;
    user: AppUser | null;
    isLogin: boolean;
    refresh: () => void;
    branchId?: string | undefined;
};

export const submitAndRecordAnswer = async ({
    currentQuestion,
    selectedOptionIndices,
    numericalAnswer,
    timeTaken,
    user,
    isLogin,
    refresh,
    branchId,
}: submitAndRecordAnswerProp) => {
    let isCorrect = null; // Default to null (unattempted)
    console.log('branchId: ', branchId);

    if (!branchId) return;

    let wasAttempted;
    if (selectedOptionIndices) {
        wasAttempted = selectedOptionIndices.length > 0 || isNumericalQuestion(currentQuestion);
    }

    const isNumericalAnswerCorrect = (userAnswer: number, spec: NumericalAnswerSpec): boolean => {
        switch (spec.type) {
            case 'exact':
                return userAnswer === spec.value;

            case 'multiple':
                return spec.values.includes(userAnswer);

            case 'range':
                return spec.inclusive !== false
                    ? userAnswer >= spec.min && userAnswer <= spec.max
                    : userAnswer > spec.min && userAnswer < spec.max;

            case 'tolerance':
                return Math.abs(userAnswer - spec.value) <= spec.tolerance;
        }
    };

    if (wasAttempted) {
        if (isNumericalQuestion(currentQuestion)) {
            const answerToCheck = numericalAnswer;
            if (answerToCheck !== null)
                isCorrect = isNumericalAnswerCorrect(answerToCheck, currentQuestion.correct_answer);
        } else {
            // This logic works for both MCQ and MSQ.
            function arraysMatch(a: number[], b: number[]) {
                if (a.length !== b.length) return false;

                const sortedA = [...a].sort((x, y) => x - y);
                const sortedB = [...b].sort((x, y) => x - y);

                return sortedA.every((val, index) => val === sortedB[index]);
            }

            isCorrect = arraysMatch(selectedOptionIndices!, currentQuestion.correct_answer);
        }
    }
    // If not attempted, `isCorrect` remains null.
    // 2. Record the Attempt
    (async () => {
        if (isLogin && user && user?.id !== '1') {
            try {
                await recordAttemptLocally({
                    params: {
                        user_id: user.id!,
                        question_id: currentQuestion.id,
                        subject: currentQuestion.subject,
                        subject_id: currentQuestion.subject_id,
                        branch_id: branchId,
                        was_correct: isCorrect, // This can now be true, false, or null
                        time_taken: timeTaken,
                        attempt_number: 1,
                        user_version_number: user.version_number,
                    },
                    user,
                    refresh,
                });

                // NEW: Broadcast an event telling the app the attempt is saved
                window.dispatchEvent(new Event('STATS_UPDATED'));
            } catch (error) {
                console.error('Failed to record attempt:', error);
                toast.error('Could not save your attempt.');
            }
        }
    })();

    if (isCorrect === true) return 'correct';
    if (isCorrect === false) return 'incorrect';
    return 'unattempted';
};
