import { AnimatePresence, motion } from 'framer-motion'
import React, { useContext } from 'react'
import { useQuestionTimer } from '../../../hooks/useQuestionTimer'
import AppSettingContext from '../../../context/AppSettingContext'
import { Pause, Timer } from 'phosphor-react'

const QuestionTimer = ({ currentQuestion, isTimerActive }) => {

    const { settings } = useContext(AppSettingContext);
    const { minutes, seconds, toggle: toggleTimer } = useQuestionTimer(settings?.autoTimer, currentQuestion)

    return (
        <div>
            <button
                className='flex text-xs w-18 items-center justify-center space-x-2 bg-blue-400 px-1.5 py-1 rounded-full text-text-primary-dark cursor-pointer transition-all duration-300 hover:bg-blue-500 active:scale-95 active:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400'
                onClick={toggleTimer}
            >
                <AnimatePresence mode="wait" initial={false}>
                    {isTimerActive ? (
                        <motion.div
                            key="pause"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Pause className={`${isTimerActive ? 'animate-pulse' : ''}`} />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="stopwatch"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Timer className='h-4' />
                        </motion.div>
                    )}
                </AnimatePresence>
                <AnimatePresence>
                    {isTimerActive && (
                        <motion.label
                            key="timer-label"
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "auto" }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            {minutes}:{seconds}
                        </motion.label>
                    )}
                </AnimatePresence>
            </button>
        </div>
    )
}

export default QuestionTimer