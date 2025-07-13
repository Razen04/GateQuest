import { FaChevronLeft, FaChevronRight, FaEye, FaRedo, FaComment } from 'react-icons/fa'

const ActionButtons = ({ selectedOptions, isFirstQuestion, isLastQuestion, handleNext, handlePrevious, showAnswer, handleShowAnswer, handleSkip, handleExplainationClick, currentQuestion, currentIndex, questions }) => {
    return (
        <div className="flex flex-wrap justify-between items-center pt-4 border-t border-border-primary dark:border-border-primary-dark">
            <div className="flex space-x-3">

                <button
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${isFirstQuestion
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500: cursor-not-allowed'
                        : 'bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-800 cursor-pointer'
                        }`}
                    onClick={handlePrevious}
                    disabled={isFirstQuestion}
                >
                    <FaChevronLeft className="inline mr-1" /> Previous
                </button>

                <button
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${!isLastQuestion
                        ? 'bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-800 cursor-pointer'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500: cursor-not-allowed'
                        }`}
                    onClick={handleNext}
                    disabled={isLastQuestion}
                >
                    Next <FaChevronRight className="inline ml-1" />
                </button>
            </div>

            <div className="flex space-x-3 mt-3 sm:mt-0">
                {!showAnswer ? (
                    <>
                        <button
                            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 cursor-pointer flex items-center justify-around"
                            onClick={() => handleShowAnswer()}
                        >
                            <FaEye className="inline mr-1" /> {selectedOptions ? 'Submit' : 'Show Answer'}
                        </button>
                        <button
                            className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 cursor-pointer"
                            onClick={handleSkip}
                        >
                            Skip
                        </button>
                    </>
                ) : (
                    <div className='flex items-center'>
                        <button
                            className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium hover:bg-orange-200 mr-2 cursor-pointer"
                            onClick={() => handleExplainationClick(currentQuestion.explanation)}
                        >
                            Show Explaination <FaComment className="inline ml-1" />
                        </button>
                        <button
                            className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 cursor-pointer"
                            onClick={handleNext}
                            disabled={currentIndex === questions.length - 1}
                        >
                            <FaRedo className="inline mr-1" /> Next Question
                        </button>
                    </div>

                )}
            </div>
        </div>
    )
}

export default ActionButtons