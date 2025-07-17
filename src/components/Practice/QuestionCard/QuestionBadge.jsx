import React from 'react'

const QuestionBadge = ({ currentQuestion, subject }) => {
    return (
        <div>
            {/* Question ID Badge and Tags */}
            <div className="px-4 sm:px-6 py-2 mb-10 md:mb-0 sm:py-3 border-t border-border-primary dark:border-border-primary-dark">
                <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center text-xs mb-2 sm:mb-0 gap-4">
                        <span>ID: {currentQuestion.id || 'Unknown'}</span>
                        <span>Subject: {subject.toUpperCase()}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default QuestionBadge