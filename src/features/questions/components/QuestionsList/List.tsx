import { motion } from 'framer-motion';
import React, { lazy, Suspense } from 'react';
import ModernLoader from '@/shared/components/ModernLoader.tsx';
import type { Question } from '@/shared/types/storage.ts';
import { fadeInUp, stagger } from '@/shared/utils/motionVariants.ts';
import {
    getDifficultyClassNames,
    getQuestionDisplayText,
} from '../../utils/questionUtils.ts';

const MathRenderer = lazy(() => import('../Renderers/MathRenderer.tsx'));

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
            className="grid grid-cols-1 gap-2 box-border overscroll-none pb-20 sm:grid-cols-2 md:grid-cols-1"
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
                    className="cursor-pointer border border-border bg-card/70 p-4 text-card-foreground shadow-sm backdrop-blur-xl backdrop-saturate-150 transition-all hover:border-primary/30 hover:bg-card hover:shadow-md"
                >
                    <h3 className="mb-3 font-['Manrope'] text-sm font-semibold text-card-foreground md:text-base">
                        <Suspense fallback={<ModernLoader />}>
                            <MathRenderer
                                text={getQuestionDisplayText(question)}
                            />
                        </Suspense>
                    </h3>

                    <div className="flex items-center justify-between gap-2 text-xs font-['Manrope']">
                        <span
                            className={`border border-border px-2 py-1 font-bold backdrop-blur-md md:font-medium ${getDifficultyClassNames(question.difficulty)}`}
                        >
                            {question.difficulty}
                        </span>

                        <span className="text-right font-semibold text-muted-foreground">
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
