import { Pause, Timer } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'framer-motion';

type QuestionTimerProps = {
    minutes: string;
    seconds: string;
    isActive: boolean;
    onToggle: () => void;
    isAnswered: boolean;
};

const QuestionTimer = ({
    minutes,
    seconds,
    isActive,
    onToggle,
    isAnswered,
}: QuestionTimerProps) => {
    const shouldShowTime = isActive || minutes !== '00' || seconds !== '00';

    return (
        <button
            type="button"
            onClick={isAnswered ? undefined : onToggle}
            disabled={isAnswered}
            className={`relative flex items-center justify-center gap-2 border px-3 py-1.5 text-base backdrop-blur-md transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${
                isActive
                    ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 dark:text-emerald-400'
                    : 'border-primary/20 bg-primary/10 text-primary hover:bg-primary/20'
            }`}
        >
            {/* Animated Icon */}
            <AnimatePresence mode="wait" initial={false}>
                {isActive ? (
                    <motion.span
                        key="pause"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Pause
                            size={18}
                            weight="fill"
                            className={!isAnswered ? 'animate-pulse' : ''}
                        />
                    </motion.span>
                ) : (
                    <motion.span
                        key="stopwatch"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Timer size={18} />
                    </motion.span>
                )}
            </AnimatePresence>

            {/* Timer Display */}
            <AnimatePresence initial={false}>
                {shouldShowTime && (
                    <motion.span
                        key="timer-label"
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`overflow-hidden font-mono text-sm font-semibold tabular-nums ${
                            isActive ? 'opacity-100' : 'opacity-70'
                        }`}
                    >
                        {minutes}:{seconds}
                    </motion.span>
                )}
            </AnimatePresence>
        </button>
    );
};

export default QuestionTimer;
