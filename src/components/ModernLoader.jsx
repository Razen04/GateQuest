import { motion } from "framer-motion";

export default function ModernLoader() {
    return (
        <div className="w-full h-[70vh] flex items-center justify-center bg-transparent">
            <div className="relative w-24 h-24 flex items-center justify-center">
                {/* Glowing Pulse Dot */}
                <motion.div
                    className="absolute w-4 h-4 rounded-full bg-purple-500 shadow-xl"
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
                <motion.div
                    className="absolute w-full h-full border-[5px] border-purple-300/10 border-t-purple-600 rounded-full blur-[0.6px]"
                    animate={{ rotate: 360 }}
                    transition={{
                        repeat: Infinity,
                        duration: 1.4,
                        ease: "linear",
                    }}
                />

                {/* Inner Glow Ring */}
                <div className="w-16 h-16 rounded-full bg-purple-600/10 backdrop-blur-md shadow-inner shadow-purple-600/40"></div>
            </div>
        </div>
    );
}