import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from '@phosphor-icons/react';

type Answer =
    | {
          type: 'text';
          content: string;
      }
    | {
          type: 'link';
          text: string;
          href: string;
      };

type AccordionItemProps = {
    question: string;
    answer: Answer[];
    renderAnswer: (answer: Answer[]) => React.ReactNode;
};

const AccordionItem = ({ question, answer, renderAnswer }: AccordionItemProps) => {
    const [isOpen, setIsOpen] = useState(false);

    const variants = {
        open: { opacity: 1, height: 'auto', marginTop: '16px' },
        collapsed: { opacity: 0, height: 0, marginTop: '0px' },
    };

    return (
        <motion.div
            initial={false}
            className="border-b border-gray-200 dark:border-zinc-700 last:border-b-0 py-4"
        >
            <button
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                aria-controls={`accordion-${question}`}
                className="w-full flex justify-between items-center text-left text-lg font-medium text-gray-800 dark:text-gray-100"
            >
                <span>{question}</span>
                <motion.div animate={{ rotate: isOpen ? 45 : 0 }} transition={{ duration: 0.3 }}>
                    <Plus className="text-gray-500" />
                </motion.div>
            </button>
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        key="content"
                        initial="collapsed"
                        animate="open"
                        exit="collapsed"
                        variants={variants}
                        transition={{
                            duration: 0.5,
                            ease: [0.04, 0.62, 0.23, 0.98],
                        }}
                        className="text-gray-600 dark:text-gray-400 leading-relaxed overflow-hidden"
                    >
                        {renderAnswer(answer)}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default AccordionItem;
