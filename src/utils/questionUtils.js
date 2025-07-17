import { getUserProfile, updateUserProfile, syncUserToSupabase } from '../helper.js'
import { toast } from 'sonner'

// Get difficulty class names
export const getDifficultyClassNames = (difficulty) => {
    if (!difficulty) return 'bg-gray-100 text-gray-700' // Default for unknown

    const difficultyLower = difficulty.toLowerCase()

    if (difficultyLower === 'easy') return 'md:bg-green-100 text-green-700'
    if (difficultyLower === 'medium' || difficultyLower === 'normal') return 'md:bg-yellow-100 text-yellow-700'
    if (difficultyLower === 'hard') return 'md:bg-red-100 text-red-700'

    return 'bg-gray-100 text-gray-700' // Default fallback
}

// Handle bookmark
export const handleBookmark = (isLogin, questionId, subject) => {
    const profile = getUserProfile();

    if (profile) {
        const oldBookmark = profile.bookmark_questions || []

        const bookmark_questions = [
            ...oldBookmark,
            { id: questionId, subject: subject }
        ]

        const updatedProfile = { ...profile, bookmark_questions }
        console.log("User Profile: ", updatedProfile)
        updateUserProfile(updatedProfile)
        syncUserToSupabase(isLogin)
    } else {
        toast.error("Unable to bookmark, try again later.")
    }
}

// Determine if current question is a multiple selection question
export const isMultipleSelection = (currentQuestion) => {
    if (!currentQuestion) return false;
    if (currentQuestion.tags && Array.isArray(currentQuestion.tags)) {
        return currentQuestion.tags.some(tag =>
            tag.toLowerCase().includes('multiple-select') ||
            tag.toLowerCase().includes('multiple select')
        );
    }
    return currentQuestion.questionType === 'MSQ' ||
        currentQuestion.questionType === 'Multiple Select Question';
}

// Determine if current question is a numerical question
export const isNumericalQuestion = (currentQuestion) => {
    if (!currentQuestion) return false;

    if (currentQuestion.questionType) {
        return currentQuestion.questionType.toLowerCase().includes('numerical')
    }

    return currentQuestion.questionType === 'Numerical Answer' ||
        (currentQuestion.options &&
            Array.isArray(currentQuestion.options) &&
            currentQuestion.options.length === 0);
}

// Get question type text
export const getQuestionTypeText = (currentQuestion) => {
    const type = currentQuestion.questionType;
    if (!type) return 'Question';

    switch (type) {
        case 'MCQ':
        case 'multiple-choice':
            return isMultipleSelection(currentQuestion) ? 'Multiple Select Question' : 'Multiple Choice Question';
        case 'MSQ':
        case 'Multiple Select Question':
            return 'Multiple Select Question';
        case 'numerical':
            return 'Numerical Answer';
        case 'Descriptive':
            return 'Descriptive Question';
        case 'Match the following':
            return 'Match the Following';
        default:
            return type;
    }
}

// Get correct answer text
export const getCorrectAnswerText = (currentQuestion) => {
    if (!currentQuestion) return '';

    try {
        if (isNumericalQuestion(currentQuestion)) {
            return currentQuestion.correctAnswer?.toString()
        }

        if (isMultipleSelection(currentQuestion) && Array.isArray(currentQuestion.correctAnswer)) {
            // For multiple selection, show all correct options
            const correctIndices = currentQuestion.correctAnswer;
            if (Array.isArray(currentQuestion.options)) {
                const correctOptions = correctIndices.map(index =>
                    currentQuestion.options[index]
                ).filter(Boolean);
                return correctOptions.join(', ');
            }
        }

        if (Array.isArray(currentQuestion.correctAnswer) &&
            currentQuestion.options &&
            Array.isArray(currentQuestion.options)) {
            const index = currentQuestion.correctAnswer[0];
            if (index !== undefined && currentQuestion.options[index] !== undefined) {
                return currentQuestion.options[index];
            }
        }

        // For questions that might have answerText
        if (currentQuestion.answerText) {
            return currentQuestion.answerText;
        }

        return currentQuestion.correctAnswer || 'Answer not available';
    } catch (error) {
        console.error("Error getting correct answer text:", error);
        return 'Answer not available';
    }
}