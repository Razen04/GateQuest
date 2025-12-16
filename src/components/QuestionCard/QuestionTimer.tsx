import { AnimatePresence, motion } from 'framer-motion';
import { Pause, Timer } from '@phosphor-icons/react';

type QuestionTimerProps = {
    minutes: string;
    seconds: string;
    isActive: boolean;
    onToggle: () => void;
};

const QuestionTimer = ({ minutes, seconds, isActive, onToggle }: QuestionTimerProps) => {
    return (
        <div>
            <button
                className="flex text-base items-center justify-center space-x-2 bg-blue-400 px-3 py-0.5 text-white cursor-pointer transition-all duration-300 hover:bg-blue-500 active:scale-95 active:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
                onClick={onToggle}
            >
                <AnimatePresence mode="wait" initial={false}>
                    {isActive ? (
                        <motion.div
                            key="pause"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Pause className={`${isActive ? 'animate-pulse' : ''}`} />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="stopwatch"
                            className="py-0.5"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Timer />
                        </motion.div>
                    )}
                </AnimatePresence>
                <AnimatePresence>
                    {isActive && (
                        <motion.label
                            key="timer-label"
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            {minutes}:{seconds}
                        </motion.label>
                    )}
                </AnimatePresence>
            </button>
        </div>
    );
};

export default QuestionTimer;
