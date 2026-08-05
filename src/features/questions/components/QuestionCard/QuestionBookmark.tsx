import { AnimatePresence, motion } from 'framer-motion';
import { Bookmark } from '@phosphor-icons/react';

type QuestionBookmarkProps = {
    onClick: () => void;
    isBookmarked?: boolean;
    hasNote?: boolean;
};

const QuestionBookmark = ({
    onClick,
    isBookmarked = false,
    hasNote = false,
}: QuestionBookmarkProps) => {
    return (
        <div>
            <button
                type="button"
                className={`flex items-center justify-center px-3 py-1 cursor-pointer transition-all duration-300 focus:outline-none focus:ring-2 relative text-base ${
                    isBookmarked
                        ? 'bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-400'
                        : 'bg-blue-400 text-white hover:bg-blue-500 active:scale-95 active:bg-blue-600 focus:ring-blue-400'
                }`}
                onClick={onClick}
                title={
                    hasNote
                        ? 'Edit Bookmark Note'
                        : isBookmarked
                          ? 'Remove Bookmark'
                          : 'Add Bookmark'
                }
            >
                <Bookmark weight={isBookmarked ? 'fill' : 'regular'} />
                <AnimatePresence>
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
                            duration: 0.3,
                        }}
                    >
                        {isBookmarked ? (hasNote ? 'Note Added' : 'Bookmarked') : 'Bookmark'}
                    </motion.span>
                </AnimatePresence>
            </button>
        </div>
    );
};

export default QuestionBookmark;
