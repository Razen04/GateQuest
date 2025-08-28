import { getUserProfile, updateUserProfile, syncUserToSupabase } from '../helper.js';
import { toast } from 'sonner';
import type { NumericalQuestion, Question } from '../types/question.js';

// Get difficulty class names
export const getDifficultyClassNames = (difficulty: string) => {
    if (!difficulty) return 'bg-gray-100 text-gray-700'; // Default for unknown

    const difficultyLower = difficulty.toLowerCase();

    if (difficultyLower === 'easy') return 'bg-green-100 text-green-700';
    if (difficultyLower === 'medium' || difficultyLower === 'normal')
        return 'bg-yellow-100 text-yellow-700';
    if (difficultyLower === 'hard') return 'bg-red-100 text-red-700';

    return 'bg-gray-100 text-gray-700'; // Default fallback
};

// Handle bookmark
type Bookmark = { id: string | number; subject: string | undefined };
export const handleBookmark = (
    isLogin: boolean,
    questionId: string | number,
    subject: string | undefined,
) => {
    const profile = getUserProfile();

    if (profile && 'bookmark_questions' in profile) {
        const oldBookmark: Bookmark[] = Array.isArray(profile.bookmark_questions)
            ? (profile.bookmark_questions as Bookmark[])
            : [];

        const bookmark_questions: Bookmark[] = [
            ...oldBookmark,
            { id: questionId, subject: subject },
        ];

        const updatedProfile = { ...profile, bookmark_questions };
        updateUserProfile(updatedProfile);
        syncUserToSupabase(isLogin);
        toast.success('Question successfully bookmarked.');
    } else {
        toast.error('Unable to bookmark, try again later.');
    }
};

// Determine if current question is a multiple selection question
export const isMultipleSelection = (currentQuestion: Question) => {
    if (!currentQuestion) return false;
    if (currentQuestion.tags && Array.isArray(currentQuestion.tags)) {
        return currentQuestion.tags.some(
            (tag) =>
                tag.toLowerCase().includes('multiple-select') ||
                tag.toLowerCase().includes('multiple select'),
        );
    }
    return currentQuestion.question_type === 'Multiple Select Question';
};

export function isNumericalQuestion(q: Question): q is NumericalQuestion {
    return q.question_type.toLowerCase().includes('numerical');
}

export const getQuestionTypeText = (q: Question) => {
    const type = q.question_type?.toLowerCase().trim();
    if (!type) return 'Question';

    if (type.includes('numerical')) return 'Numerical Answer';
    if (type.includes('multiple-select') || isMultipleSelection(q))
        return 'Multiple Select Question';
    if (type.includes('multiple-choice')) return 'Multiple Choice Question';

    // Fallback: preserve original text as-is
    return q.question_type!;
};

// Get correct answer text
export const getCorrectAnswerText = (currentQuestion: Question): number | number[] | string => {
    if (!currentQuestion) return '';

    try {
        if (isNumericalQuestion(currentQuestion)) {
            return currentQuestion.correct_answer?.toString();
        }

        if (isMultipleSelection(currentQuestion) && Array.isArray(currentQuestion.correct_answer)) {
            // For multiple selection, show all correct options
            const correctIndices = currentQuestion.correct_answer;
            if (Array.isArray(currentQuestion.options)) {
                const correctOptions = correctIndices
                    .map((index) => currentQuestion.options![index])
                    .filter(Boolean);
                return correctOptions.join(', ');
            }
        }

        if (
            Array.isArray(currentQuestion.correct_answer) &&
            currentQuestion.options &&
            Array.isArray(currentQuestion.options)
        ) {
            const index = currentQuestion.correct_answer[0];
            if (index !== undefined && currentQuestion.options[index] !== undefined) {
                return currentQuestion.options[index];
            }
        }

        return currentQuestion.correct_answer || 'Answer not available';
    } catch (error) {
        console.error('Error getting correct answer text:', error);
        return 'Answer not available';
    }
};

export const getQuestionDisplayText = (question: Question) => {
    if (!question || !question.question) return 'Question content unavailable';

    const maxLength = 120;
    if (question.question.length <= maxLength) {
        // Just return the raw string
        return question.question;
    }

    let truncated = question.question.substring(0, maxLength);

    // ... (the rest of the truncation logic remains the same)
    const openCount = (truncated.match(/\$/g) || []).length;
    if (openCount % 2 !== 0) {
        const lastDollarIndex = truncated.lastIndexOf('$');
        if (lastDollarIndex > 0) {
            truncated = truncated.substring(0, lastDollarIndex);
        }
    }

    // Return the final processed string
    return truncated + '...';
};
