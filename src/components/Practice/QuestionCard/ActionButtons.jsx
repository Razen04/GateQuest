import { FaChevronLeft, FaChevronRight, FaEye, FaRedo, FaComment } from 'react-icons/fa'

const ActionButtons = ({ selectedOptions, isFirstQuestion, isLastQuestion, handleNext, handlePrevious, showAnswer, handleShowAnswer, handleSkip, handleExplainationClick, currentQuestion, currentIndex, questions }) => {
    return (
        <div className="flex flex-row flex-wrap justify-center items-center gap-2 pt-4 border-t border-border-primary dark:border-border-primary-dark">
            {/* Previous */}
            <button
                className={`px-3 py-3 md:py-2 rounded-lg text-sm font-medium flex items-center justify-center
                    ${isFirstQuestion
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                        : 'bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-800 cursor-pointer'}
                `}
                onClick={handlePrevious}
                disabled={isFirstQuestion}
                title="Previous"
            >
                <FaChevronLeft className="inline" />
                <span className="hidden md:inline ml-1">Previous</span>
            </button>

            {/* Show/Submit or Show Explanation */}
            {!showAnswer ? (
                <>
                    <button
                        className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 cursor-pointer flex items-center justify-center"
                        onClick={() => handleShowAnswer()}
                        title="Show Answer"
                    >
                        <FaEye className="inline" />
                        <span className="md:inline ml-1">{selectedOptions ? 'Submit' : 'Show Answer'}</span>
                    </button>
                    <button
                        className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 cursor-pointer flex items-center justify-center"
                        onClick={handleSkip}
                        title="Skip"
                    >
                        <FaChevronRight className="inline" />
                        <span className="md:inline ml-1">Skip</span>
                    </button>
                </>
            ) : (
                <>
                    <button
                        className="px-3 py-2 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium hover:bg-orange-200 cursor-pointer flex items-center justify-center"
                        onClick={() => handleExplainationClick(currentQuestion.explanation)}
                        title="Show Explanation"
                    >
                        <FaComment className="inline" />
                        <span className="md:inline ml-1">Show Explanation</span>
                    </button>
                </>
            )}
            {/* Next */}
            <button
                className={`px-3 py-3 md:py-2 rounded-lg text-sm font-medium flex items-center justify-center
                    ${!isLastQuestion
                        ? 'bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-800 cursor-pointer'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'}
                `}
                onClick={handleNext}
                disabled={isLastQuestion}
                title="Next"
            >
                <FaChevronRight className="inline" />
                <span className="hidden md:inline ml-1">Next</span>
            </button>
        </div>
    )
}

export default ActionButtons