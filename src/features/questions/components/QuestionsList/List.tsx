import { motion } from 'framer-motion';
import React from 'react';
import ModernLoader from '@/shared/components/ModernLoader.tsx';
import type { Question } from '@/shared/types/storage.ts';
import { fadeInUp, stagger } from '@/shared/utils/motionVariants.ts';
import {
    getDifficultyClassNames,
    getQuestionDisplayText,
} from '../../utils/questionUtils.ts';
import MathRenderer from '../Renderers/MathRenderer.tsx';
import Pagination from './Pagination.tsx';

type ListProps = {
    loading: boolean;
    listRef: React.RefObject<HTMLDivElement | null>;
    questions: Question[];
    handleQuestionClick: (id: string) => void;
    currentPage: number;
    totalPages: number;
    setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
};

const List = ({
    loading,
    listRef,
    questions,
    handleQuestionClick,
    currentPage,
    totalPages,
    setCurrentPage,
}: ListProps) => {
    if (loading) return <ModernLoader />;
    return (
        <motion.div
            initial="initial"
            animate="animate"
            variants={stagger}
            viewport={{ once: true, amount: 0.2 }}
            ref={listRef}
            className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:grid-cols-1 pb-20 box-border overscroll-none"
        >
            <Pagination
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                totalPages={totalPages}
            />

            {questions.map((question: Question, index: number) => (
                <motion.div
                    key={index}
                    variants={fadeInUp}
                    onClick={() => handleQuestionClick(question.id)}
                    className="cursor-pointer border border-white/20 bg-white/20 backdrop-blur-xl backdrop-saturate-150 p-4 shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:shadow-xl hover:bg-white/30 dark:border-white/10 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] transition-all"
                >
                    <h3 className="font-medium mb-3 text-sm md:text-base text-gray-800 dark:text-gray-200">
                        <MathRenderer text={getQuestionDisplayText(question)} />
                    </h3>

                    <div className="flex justify-between items-center text-xs">
                        <span
                            className={`font-bold md:font-normal px-2 py-1 backdrop-blur-md border border-white/20 ${getDifficultyClassNames(
                                question.difficulty
                            )}`}
                        >
                            {question.difficulty}
                        </span>

                        <span className="font-semibold text-gray-600 dark:text-gray-300">
                            {question.year
                                ? `${(Array.isArray(question.metadata.exam)
                                      ? question.metadata.exam
                                      : [question.metadata.exam || 'GATE']
                                  )
                                      .join(' / ')
                                      .toUpperCase()} ${question.metadata.set} ${question.year}`
                                : 'Year Unknown'}
                        </span>
                    </div>
                </motion.div>
            ))}
        </motion.div>
    );
};

export default List;
