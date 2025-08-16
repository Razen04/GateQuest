import React from 'react'
import { motion } from 'framer-motion'
import { getDifficultyClassNames, getQuestionDisplayText } from '../../../utils/questionUtils'
import Pagination from './Pagination'
import MathRenderer from '../MathRenderer'
import { fadeInUp, stagger } from '../../../utils/motionVariants'

const List = ({ listRef, pageItems, handleQuestionClick, currentPage, totalPages, setCurrentPage }) => {
    return (
        <motion.div
            initial="initial"
            animate="animate"
            variants={stagger}
            viewport={{ once: true, amount: 0.2 }}
            ref={listRef}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:grid-cols-1 overflow-x-hidden overflow-y-scroll rounded-lg pb-32 max-h-[59vh]"
        >
            {pageItems.map((question, index) => (
                <motion.div
                    key={index}
                    variants={fadeInUp}
                    onClick={() => handleQuestionClick(question.id)}
                    className="cursor-pointer border border-border-primary dark:border-border-primary-dark rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-zinc-800"
                >
                    <h3 className="font-medium mb-3 text-sm md:text-base">
                        <MathRenderer text={getQuestionDisplayText(question)} />
                    </h3>
                    <div className="flex justify-between items-center text-xs">
                        <span
                            className={`font-bold md:font-normal px-2 py-1 md:rounded-xl rounded-full ${getDifficultyClassNames(
                                question.difficulty
                            )}`}
                        >
                            {question.difficulty}
                        </span>
                        <span>{question.year ? `GATE ${question.year}` : 'Year Unknown'}</span>
                    </div>
                </motion.div>
            ))}
            <Pagination currentPage={currentPage} setCurrentPage={setCurrentPage} totalPages={totalPages} />
        </motion.div>
    )
}

export default List