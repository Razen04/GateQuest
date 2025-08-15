import { ArrowLeft, ArrowRight, ChatCircle, Eye, Flag } from 'phosphor-react'

const ActionButtons = ({ isFirstQuestion, isLastQuestion, handleNext, handlePrevious, showAnswer, handleShowAnswer, handleSubmit, handleExplainationClick, currentQuestion, }) => {
    return (
        <div className="flex fixed sm:static bottom-0 left-0 w-full z-30 flex-row justify-between items-center gap-2 p-3 sm:pt-4 bg-white dark:bg-zinc-900 border-t border-border-primary dark:border-border-primary-dark">
            {/* Previous */}
            <button
                className={`flex-1 px-2 py-3 rounded-lg text-base font-semibold flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-400 active:scale-95 active:bg-blue-100
                    ${isFirstQuestion
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                        : 'bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-800 cursor-pointer'}
                `}
                onClick={handlePrevious}
                disabled={isFirstQuestion}
                title="Previous"
            >
                <ArrowLeft className="inline text-lg" />
                <span className="hidden md:inline ml-2">Previous</span>
            </button>

            {/* Show/Submit or Show Explanation */}
            {!showAnswer ? (
                <>
                    <button
                        className="flex-1 px-2 py-3 bg-blue-100 text-blue-700 rounded-lg text-base font-semibold hover:bg-blue-200 cursor-pointer flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-400 active:scale-95 active:bg-blue-200"
                        onClick={() => handleSubmit()}
                        title="Submit"
                    >
                        <Eye className="inline text-lg" />
                        <span className="hidden md:inline ml-2">Submit</span>
                    </button>
                    <button
                        className="flex-1 px-2 py-3 bg-purple-100 text-purple-700 rounded-lg text-base font-semibold hover:bg-purple-200 cursor-pointer flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-purple-400 active:scale-95 active:bg-purple-200"
                        onClick={() => handleShowAnswer()}
                        title="Show Answer"
                    >
                        <Flag className="inline text-lg" />
                        <span className="hidden md:inline ml-2">Show Answer</span>
                    </button>
                </>
            ) : (
                <>
                    <button
                        className="flex-1 px-2 py-3 bg-orange-100 text-orange-700 rounded-lg text-base font-semibold hover:bg-orange-200 cursor-pointer flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-orange-400 active:scale-95 active:bg-orange-200"
                        onClick={() => handleExplainationClick(currentQuestion.explanation)}
                        title="Show Explanation"
                    >
                        <ChatCircle className="inline text-lg" />
                        <span className="hidden md:inline ml-2">Show Explanation</span>
                    </button>
                </>
            )}
            {/* Next */}
            <button
                className={`flex-1 px-2 py-3 rounded-lg text-base font-semibold flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-400 active:scale-95 active:bg-blue-100
                    ${!isLastQuestion
                        ? 'bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-800 cursor-pointer'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'}
                `}
                onClick={handleNext}
                disabled={isLastQuestion}
                title="Next"
            >
                <ArrowRight className="inline text-lg" />
                <span className="hidden md:inline ml-2">Next</span>
            </button>
        </div>
    )
}

export default ActionButtons