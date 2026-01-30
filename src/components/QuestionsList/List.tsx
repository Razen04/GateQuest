import React from 'react';
import { motion } from 'framer-motion';
import { getDifficultyClassNames, getQuestionDisplayText } from '../../utils/questionUtils.ts';
import Pagination from './Pagination.tsx';
import MathRenderer from '../Renderers/MathRenderer.tsx';
import { fadeInUp, stagger } from '../../utils/motionVariants.ts';
import type { Question } from '@/types/question.ts';

type ListProps = {
    listRef: React.RefObject<HTMLDivElement | null>;
    questions: Question[];
    handleQuestionClick: (id: string) => void;
    currentPage: number;
    totalPages: number;
    setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
};

const List = ({
    listRef,
    questions,
    handleQuestionClick,
    currentPage,
    totalPages,
    setCurrentPage,
}: ListProps) => {
    return (
        <motion.div
            initial="initial"
            animate="animate"
            variants={stagger}
            viewport={{ once: true, amount: 0.2 }}
            ref={listRef}
            className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:grid-cols-1 pb-20 box-border overscroll-none"
        >
            {questions.map((question: Question, index: number) => (
                <motion.div
                    key={index}
                    variants={fadeInUp}
                    onClick={() => handleQuestionClick(question.id)}
                    className="cursor-pointer border border-border-primary dark:border-border-primary-dark p-4 shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-zinc-800"
                >
                    <h3 className="font-medium mb-3 text-sm md:text-base">
                        <MathRenderer text={getQuestionDisplayText(question)} />
                    </h3>
                    <div className="flex justify-between items-center text-xs">
                        <span
                            className={`font-bold md:font-normal px-2 py-1 ${getDifficultyClassNames(
                                question.difficulty,
                            )}`}
                        >
                            {question.difficulty}
                        </span>
                        <span className="font-semibold">
                            {question.year ? `GATE ${question.year}` : 'Year Unknown'}
                        </span>
                    </div>
                </motion.div>
            ))}
            <Pagination
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                totalPages={totalPages}
            />
        </motion.div>
    );
};

export default List;
