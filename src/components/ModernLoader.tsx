import { motion } from 'framer-motion';

export default function ModernLoader() {
    const quotes: string[] = [
        'Patience is the key.',
        'Small progress each day adds up.',
        'Focus on the process.',
        'Great things take time.',
        'Every minute(irony) counts.',
        'Slow is smooth.',
    ];

    // Pick one random quote for this loader session
    const idx: number = Math.floor(Math.random() * quotes.length);

    return (
        <div
            className="w-full h-lvh flex flex-col items-center justify-center bg-white dark:bg-zinc-900"
            role="status"
            aria-busy="true"
        >
            <div className="relative w-24 h-24 flex items-center justify-center">
                {/* Glowing Pulse Dot */}
                <motion.div
                    className="absolute w-4 h-4 rounded-full bg-blue-400 shadow-xl"
                    animate={{
                        scale: [1, 1.5, 1],
                        opacity: [1, 0.6, 1],
                    }}
                    transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />

                {/* Ring Spinner */}
                <motion.div
                    className="absolute w-full h-full border-[5px] border-blue-200/10 border-t-blue-500 rounded-full blur-[0.6px]"
                    animate={{ rotate: 360 }}
                    transition={{
                        repeat: Infinity,
                        duration: 1.4,
                        ease: 'linear',
                    }}
                />

                {/* Inner Glow Ring */}
                <div className="w-16 h-16 rounded-full bg-blue-500/10 backdrop-blur-md shadow-inner shadow-blue-500/40"></div>
            </div>

            <motion.div
                key={idx}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                aria-live="polite"
                className="mt-5 max-w-xl text-center text-sm sm:text-base text-black dark:text-gray-300 px-6"
            >
                {quotes[idx]}
            </motion.div>
        </div>
    );
}
