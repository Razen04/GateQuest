import { Bookmark } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'framer-motion';

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
        <button
            type="button"
            className={`relative flex items-center justify-center gap-2 border px-3 py-1.5 text-base backdrop-blur-md transition-all duration-300 focus:outline-none focus-visible:ring-2 active:scale-95 ${
                isBookmarked
                    ? 'border-amber-500/30 bg-amber-500/15 text-amber-600 hover:bg-amber-500/25 focus-visible:ring-amber-500 dark:text-amber-400'
                    : 'border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 focus-visible:ring-ring'
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
            <Bookmark weight={isBookmarked ? 'fill' : 'regular'} size={18} />

            <AnimatePresence mode="wait" initial={false}>
                <motion.span
                    key={
                        isBookmarked
                            ? hasNote
                                ? 'note-added'
                                : 'bookmarked'
                            : 'bookmark'
                    }
                    className="hidden whitespace-nowrap text-sm font-semibold sm:inline"
                    initial={{ opacity: 0, x: 12, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -12, scale: 0.9 }}
                    transition={{
                        type: 'spring',
                        stiffness: 500,
                        damping: 25,
                    }}
                >
                    {isBookmarked
                        ? hasNote
                            ? 'Note Added'
                            : 'Bookmarked'
                        : 'Bookmark'}
                </motion.span>
            </AnimatePresence>
        </button>
    );
};

export default QuestionBookmark;
