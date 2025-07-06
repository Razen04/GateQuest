import { motion, AnimatePresence } from "framer-motion"
import { FaEye, FaCheck, FaTimes } from 'react-icons/fa'
import MathRenderer from '../MathRenderer'

const ResultMessage = ({ showAnswer, result, getCorrectAnswerText }) => {
    console.log("Result: ", result)
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
                            <FaCheck className="mr-2 w-5 h-5" />
                            <span>Correct! Well done.</span>
                        </div>
                    ) : result === 'incorrect' ? (
                        <div className="flex items-center">
                            <FaTimes className="mr-2 w-5 h-5" />
                                <div><span className="font-semibold">Incorrect. The correct answer is:</span> <MathRenderer text={getCorrectAnswerText()} /></div>
                        </div>
                    ) : (
                        <div className="flex items-center">
                            <FaEye className="mr-2 w-5 h-5" />
                            <div>The correct answer is: <MathRenderer text={getCorrectAnswerText()} /></div>
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    )
}

export default ResultMessage