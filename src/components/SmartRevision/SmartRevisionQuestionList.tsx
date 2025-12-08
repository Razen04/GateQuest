import { AnimatePresence, motion } from 'framer-motion';
import * as React from 'react';
import Header from '../Practice/QuestionList/Header.tsx';
import List from '../Practice/QuestionList/List.tsx';
import { useNavigate } from 'react-router-dom';
import usePagination from '../../hooks/usePagination.ts';
import { decompress } from 'lz-string';

const SmartRevisionQuestionList = () => {
    console.log('Entered');
    const stored = localStorage.getItem('revision_set_questions');

    const questions = stored ? JSON.parse(decompress(stored)) : null;

    const navigate = useNavigate();

    const handleBack = () => {
        navigate('/revision');
    };
    const handleQuestionClick = () => {
        console.log('hi');
    };

    const { currentPage, setCurrentPage, totalPages, pageItems, listRef } = usePagination(
        questions,
        20,
    );

    return (
        // AnimatePresence allows for smooth transitions when components enter or exit the DOM.
        <AnimatePresence mode="wait">
            {/* The main container for the list view */}
            <motion.div
                key="questions-list" // A unique key for AnimatePresence to track this component
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="p-6  dark:text-white max-w-4xl mx-auto"
            >
                {/* The header component gets the back handler and some data to display stats. */}
                <Header
                    handleBack={handleBack}
                    filteredQuestions={questions}
                    attemptFilter="unattempted"
                />

                {/* Container for the actual list of questions */}
                <div>
                    <div className="rounded-xl overflow-hidden">
                        <div className="mb-2">
                            <h2 className="font-semibold text-blue-500 text-xl">
                                Revision Questions
                            </h2>
                        </div>

                        {/* Conditionally render the list or a "not found" message. */}
                        {questions.length > 0 ? (
                            // The List component handles rendering the actual rows and pagination controls.
                            <List
                                listRef={listRef}
                                pageItems={pageItems}
                                handleQuestionClick={handleQuestionClick}
                                currentPage={currentPage}
                                totalPages={totalPages}
                                setCurrentPage={setCurrentPage}
                            />
                        ) : (
                            <div className="p-4 sm:p-8 text-center text-xs sm:text-base">
                                No questions match your criteria. Try adjusting your filters.
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default SmartRevisionQuestionList;
