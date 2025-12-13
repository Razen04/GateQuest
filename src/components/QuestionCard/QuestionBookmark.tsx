import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bookmark } from '@phosphor-icons/react';

type QuestionBookmarkProps = {
    onClick: () => void;
    isBookmarked?: boolean; // Optional: If you want to style it differently when active later
};

const QuestionBookmark = ({ onClick }: QuestionBookmarkProps) => {
    const [hovered, setHovered] = useState(false);

    return (
        <div>
            <button
                className="flex items-center justify-center bg-blue-400 px-2 py-1.5 text-white cursor-pointer transition-all duration-300 hover:bg-blue-500 active:scale-95 active:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 relative text-base"
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                onClick={onClick}
            >
                <Bookmark />
                <AnimatePresence>
                    {hovered && (
                        <motion.span
                            key="label"
                            className="ml-2 text-sm whitespace-nowrap hidden sm:inline"
                            initial={{ opacity: 0, x: 16, scale: 0.8 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 16, scale: 0.8 }}
                            transition={{
                                type: 'spring',
                                stiffness: 500,
                                damping: 20,
                                duration: 30,
                            }}
                        >
                            Bookmark
                        </motion.span>
                    )}
                </AnimatePresence>
            </button>
        </div>
    );
};

export default QuestionBookmark;
