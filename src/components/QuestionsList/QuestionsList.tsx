import React, { useMemo, useState } from 'react';
import useFilters from '@/hooks/useFilters';
import type { Question, RevisionQuestion } from '@/types/question';
import usePagination from '@/hooks/usePagination';
import { AnimatePresence, motion } from 'framer-motion';
import Header from './Header';
import SearchAndFilters from './SearchAndFilters';
import List from './List';
import useUrlFilters from '@/hooks/useUrlFilters';

type OnQuestionClick =
    | ((id: string, filteredList: Question[]) => void)
    | ((id: string, filteredList: RevisionQuestion[]) => void);

// Type of filter mode for smart-Revision
type FilterMode = 'practice' | 'revision';

interface QuestionsListProps {
    questions: RevisionQuestion[]; // The list of questions from any source
    title?: string; // Optional title (e.g., "Revision Questions")
    onQuestionClick?: OnQuestionClick; // Callback when a question is clicked
    onBack: () => void;
    subject?: string;
    mode: FilterMode;
}

const QuestionsList: React.FC<QuestionsListProps> = ({
    questions,
    title = 'Questions',
    onQuestionClick,
    onBack,
    subject,
    mode,
}) => {
    const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
    const [showFilters, setShowFilters] = useState(false);

    // Filters
    const {
        filteredQuestions,
        searchQuery,
        setSearchQuery,
        difficultyFilter,
        setDifficultyFilter,
        yearFilter,
        setYearFilter,
        topicFilter,
        setTopicFilter,
        attemptFilter,
        setAttemptFilter,
    } = useFilters(questions, subject ?? null, selectedQuestion, mode);

    // This ensures that when filters change, the URL updates
    useUrlFilters({
        searchQuery,
        setSearchQuery,
        difficultyFilter,
        setDifficultyFilter,
        yearFilter,
        setYearFilter,
        topicFilter,
        setTopicFilter,
        attemptFilter,
        setAttemptFilter,
    });

    // Pagination
    const { currentPage, setCurrentPage, totalPages, pageItems, listRef } = usePagination(
        filteredQuestions,
        20,
    );

    const handleQuestionClick = (id: string) => {
        setSelectedQuestion(id);

        if (onQuestionClick) {
            onQuestionClick(id, filteredQuestions);
        }
    };

    // Derived data for filter dropdowns
    const years = useMemo(() => {
        const allYears = filteredQuestions
            .map((q) => String(q.year))
            .filter((y) => !isNaN(Number(y)));
        return [...new Set(allYears)].sort((a, b) => Number(b) - Number(a));
    }, [filteredQuestions]);

    const topics = useMemo(() => {
        const allTopics = filteredQuestions
            .map((q) => q.topic || '')
            .filter((t) => t.trim() !== '');
        return [...new Set(allTopics)];
    }, [filteredQuestions]);

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key="questions-list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="p-6 dark:text-white max-w-4xl mx-auto"
            >
                <Header
                    questions={filteredQuestions}
                    attemptFilter={attemptFilter}
                    handleBack={onBack}
                />

                <SearchAndFilters
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    showFilters={showFilters}
                    setShowFilters={() => setShowFilters((prev) => !prev)}
                    difficultyFilter={difficultyFilter}
                    setDifficultyFilter={setDifficultyFilter}
                    yearFilter={yearFilter}
                    setYearFilter={setYearFilter}
                    topicFilter={topicFilter}
                    setTopicFilter={setTopicFilter}
                    attemptFilter={attemptFilter}
                    setAttemptFilter={setAttemptFilter}
                    years={years}
                    topics={topics}
                />

                <div>
                    <div className="overflow-hidden">
                        <div className="mb-2">
                            <h2 className="font-semibold text-blue-500 text-xl">{title}</h2>
                        </div>

                        {filteredQuestions.length > 0 ? (
                            <List
                                listRef={listRef}
                                questions={pageItems}
                                handleQuestionClick={handleQuestionClick}
                                currentPage={currentPage}
                                totalPages={totalPages}
                                setCurrentPage={setCurrentPage}
                            />
                        ) : (
                            <div className="p-4 sm:p-8 text-center text-xs sm:text-base">
                                No questions match your criteria.
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default QuestionsList;
