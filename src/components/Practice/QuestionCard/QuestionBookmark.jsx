import React, { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FaBookmark } from 'react-icons/fa'

const QuestionBookmark = ({ handleBookmark }) => {
    const [hovered, setHovered] = useState(false);
    return (
        <div>
            <button
                className='flex items-center justify-center bg-blue-400 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-text-primary-dark cursor-pointer transition-all duration-300 hover:bg-blue-500 relative text-xs sm:text-sm'
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                onClick={handleBookmark}
            >
                <FaBookmark className='h-3.5' />
                <AnimatePresence>
                    {hovered && (
                        <motion.span
                            key="label"
                            className="ml-2 text-xs whitespace-nowrap hidden sm:inline"
                            initial={{ opacity: 0, x: 16, scale: 0.8 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 16, scale: 0.8 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 20, duration: 300 }}
                        >
                            Bookmark
                        </motion.span>
                    )}
                </AnimatePresence>
            </button>
        </div>
    )
}

export default QuestionBookmark