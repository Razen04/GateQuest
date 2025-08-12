import { useState } from 'react'
import * as Framer from 'framer-motion'

export default function ModernLoader({ quotes: customQuotes }) {
    const quotes = (customQuotes && customQuotes.length ? customQuotes : [
        'Patience is the key.',
        'Small progress each day adds up.',
        'Focus on the process.',
        'Great things take time.',
        'Every minute(irony) counts.',
        'Slow is smooth.',
    ])

    // Pick one random quote for this loader session
    const [idx] = useState(() => Math.floor(Math.random() * quotes.length))

    return (
        <div className="w-full h-[70vh] flex flex-col items-center justify-center bg-transparent" role="status" aria-busy="true">
            <div className="relative w-24 h-24 flex items-center justify-center">
                {/* Glowing Pulse Dot */}
                <Framer.motion.div
                    className="absolute w-4 h-4 rounded-full bg-blue-400 shadow-xl"
                    animate={{
                        scale: [1, 1.5, 1],
                        opacity: [1, 0.6, 1],
                    }}
                    transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />

                {/* Ring Spinner */}
                <Framer.motion.div
                    className="absolute w-full h-full border-[5px] border-blue-200/10 border-t-blue-500 rounded-full blur-[0.6px]"
                    animate={{ rotate: 360 }}
                    transition={{
                        repeat: Infinity,
                        duration: 1.4,
                        ease: "linear",
                    }}
                />

                {/* Inner Glow Ring */}
                <div className="w-16 h-16 rounded-full bg-blue-500/10 backdrop-blur-md shadow-inner shadow-blue-500/40"></div>
            </div>

            <Framer.motion.div
                key={idx}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                aria-live="polite"
                className="mt-5 max-w-xl text-center text-sm sm:text-base text-black dark:text-gray-300 px-6"
            >
                {quotes[idx]}
            </Framer.motion.div>
        </div>
    );
}