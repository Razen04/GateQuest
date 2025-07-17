import React, { useContext } from 'react'
import { getDifficultyClassNames, getQuestionTypeText, isMultipleSelection } from '../../../utils/questionUtils'
import QuestionTimer from './QuestionTimer'
import QuestionBookmark from './QuestionBookmark'

const QuestionHeader = ({ subject, questions, currentIndex, currentQuestion, questionId }) => {

    // Get difficulty display text
    const getDifficultyDisplayText = () => {
        if (!currentQuestion.difficulty) return 'Unknown';
        return normalizedDifficulty.charAt(0).toUpperCase() + normalizedDifficulty.slice(1);
    }

    // Normalize difficulty for display - handle null case
    let normalizedDifficulty = 'unknown';
    if (currentQuestion.difficulty) {
        normalizedDifficulty = currentQuestion.difficulty.toLowerCase() === 'normal'
            ? 'medium'
            : currentQuestion.difficulty.toLowerCase();
    }

    return (
        <div>
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border-primary dark:border-border-primary-dark bg-gradient-to-r from-gray-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-800">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <h3 className="font-bold text-base sm:text-lg">
                        Question {questions.findIndex(q => q.id === currentIndex) + 1} of {questions.length}
                    </h3>
                    <div className="flex flex-wrap gap-2 sm:space-x-3 items-center">
                        <QuestionBookmark questionId={questionId} subject={subject} />
                        <QuestionTimer currentQuestion={currentQuestion} />
                        <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyClassNames(currentQuestion.difficulty)}`}>
                            {getDifficultyDisplayText()}
                        </span>
                        {currentQuestion.year && (
                            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                                GATE {currentQuestion.year}
                            </span>
                        )}
                    </div>
                </div>

                {/* Question type and marks */}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                    {currentQuestion.questionType && (
                        <span className="text-xs px-2 py-1 bg-indigo-50 text-indigo-600 rounded-full">
                            {getQuestionTypeText(currentQuestion)}
                        </span>
                    )}

                    {currentQuestion.marks && (
                        <span className="text-xs px-2 py-1 bg-purple-50 text-purple-600 rounded-full">
                            {currentQuestion.marks} Mark{currentQuestion.marks !== 1 ? 's' : ''}
                        </span>
                    )}

                    {isMultipleSelection(currentQuestion) && (
                        <span className="text-xs px-2 py-1 bg-orange-50 text-orange-600 rounded-full">
                            Select all that apply
                        </span>
                    )}
                </div>
            </div>
        </div>
    )
}

export default QuestionHeader