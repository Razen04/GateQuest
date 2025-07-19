import { motion, AnimatePresence } from "framer-motion"
import MathRenderer from '../MathRenderer'

const ResultMessage = ({ showAnswer, result, getCorrectAnswerText, currentQuestion }) => {
    return (
        <AnimatePresence>
            {showAnswer && (
                <motion.div
                    className={`p-4 mb-6 rounded-lg ${result === 'correct'
                        ? 'bg-green-50 text-green-700'
                        : result === 'incorrect'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-yellow-50 text-yellow-700'
                        }`}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                >
                    {result === 'correct' ? (
                        <div className="flex items-center">
                            <span>Correct! Well done.</span>
                        </div>
                    ) : result === 'incorrect' ? (
                        <div className="flex items-center">
                            <div>Incorrect. The correct answer is: <span className="font-semibold"><MathRenderer text={getCorrectAnswerText(currentQuestion)} /></span></div>
                        </div>
                    ) : (
                        <div className="flex items-center">
                            <div>The correct answer is: <MathRenderer text={getCorrectAnswerText(currentQuestion)} /></div>
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    )
}

export default ResultMessage