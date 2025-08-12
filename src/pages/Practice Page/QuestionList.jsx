// 1. Core and external library imports
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

// 2. Custom hook imports - This is where we abstract all the heavy lifting.
import useQuestions from '../../hooks/useQuestions'; // Fetches the raw question data.
import useFilters from '../../hooks/useFilters'; // Applies all the search/filter logic.
import useUrlFilters from '../../hooks/useUrlFilters'; // Syncs filter state with the URL. Super important for shareable links.
import usePagination from '../../hooks/usePagination'; // Handles the pagination logic.

// 3. Component imports - Breaking the UI into smaller, manageable pieces.
import ModernLoader from '../../components/ModernLoader';
import SearchAndFilters from '../../components/Practice/QuestionList/SearchAndFilters';
import Header from '../../components/Practice/QuestionList/Header';
import List from '../../components/Practice/QuestionList/List';

// This component is the main hub for showing list of questions. It's responsible for:
// - Fetching all questions for a subject.
// - Providing UI for searching, filtering, and sorting.
// - Displaying the filtered list of questions, with pagination.
// - Navigating to the detailed QuestionCard view.
const QuestionsList = () => {
    // --- Initial Setup & Data Sourcing ---

    // Standard React Router hooks to get our bearings.
    const navigate = useNavigate();
    const { subject } = useParams(); // e.g., 'Aptitude', 'Data Structures' from the URL /practice/:subject

    // We need to read URL params to initialize our state.
    const [searchParams] = useSearchParams();
    // Specifically pulling 'bookmarked' here because the initial data fetch depends on it.
    // The other params are handled by the useUrlFilters hook.
    const bookmarked = searchParams.get('bookmarked') === 'true';

    // Fetch the questions. This hook handles the loading and error states for us.
    // It takes the subject and the bookmarked flag to get the base dataset.
    const { questions, isLoading, error } = useQuestions(subject, bookmarked);

    // This state is just to keep track of which question was clicked.
    const [selectedQuestion, setSelectedQuestion] = useState(null);

    // --- Filtering and State Management ---

    // This is the brain of the filtering. It takes the raw questions and returns
    // the filtered list, along with all the state variables and setters for the filters.
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
    } = useFilters(questions, subject, selectedQuestion);

    // This hook keeps the URL in sync with our filter state.
    // It reads the URL on load to set the initial filter state,
    // and updates the URL whenever a filter changes.
    // It returns the generated query string to be used in navigation links.
    const { queryString } = useUrlFilters({
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

    // Simple state to toggle the visibility of the filter panel.
    const [showFilters, setShowFilters] = useState(false);

    // --- Pagination ---

    // The pagination hook takes the (potentially large) filtered list and breaks it into pages.
    // It returns the items for the current page and all the state needed to render pagination controls.
    const { currentPage, setCurrentPage, totalPages, pageItems, listRef } = usePagination(filteredQuestions, 20);

    // --- Derived State (for dropdowns) ---

    // I'm using useMemo here to prevent recalculating the years and topics on every single render.
    // This will only rerun if the `filteredQuestions` array actually changes. It's a good performance optimization.
    const years = useMemo(() => {
        // Grab all years, convert to numbers, filter out any bad data (NaN),
        // then create a unique set and sort them in descending order.
        const allYears = filteredQuestions.map((q) => parseInt(q.year)).filter((y) => !isNaN(y));
        return [...new Set(allYears)].sort((a, b) => b - a);
    }, [filteredQuestions]);

    const topics = useMemo(() => {
        // Same idea for topics: get all topics, filter out any empty ones, then get the unique set.
        const allTopics = filteredQuestions.map((q) => q.topic).filter(Boolean);
        return [...new Set(allTopics)];
    }, [filteredQuestions]);

    // --- Event Handlers ---

    // Simple navigation handler for the "Back" button which takes us to the Practice page where all subjects are visible.
    const handleBack = () => {
        navigate('/practice');
    };

    // This is the crucial navigation step to the QuestionCard.
    const handleQuestionClick = (id) => {
        setSelectedQuestion(id);
        // Navigate to the specific question URL, making sure to include the current filter query string.
        navigate(`/practice/${subject}/${id}?${queryString}`, {
            // This is the most important part: we pass the entire filtered list in the route's state.
            // This allows the QuestionCard to render instantly without re-fetching or re-filtering.
            state: { questions: filteredQuestions },
        });
    };

    // --- Render Logic ---

    // Handle the loading state while we're fetching questions.
    if (isLoading) {
        return (
            <div className="w-full pb-20 flex justify-center items-center text-gray-600">
                <ModernLoader />
            </div>
        );
    }

    // Handle any errors during the fetch.
    if (error) {
        return <div>Failed to load questions, try again later.</div>;
    }

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
                className="p-6 mt-4 dark:text-white max-w-4xl mx-auto"
            >
                {/* The header component gets the back handler and some data to display stats. */}
                <Header handleBack={handleBack} filteredQuestions={filteredQuestions} attemptFilter={attemptFilter} />

                {/* The search and filter UI component. We pass down all the filter states and setters. */}
                <SearchAndFilters
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    showFilters={showFilters}
                    setShowFilters={setShowFilters}
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

                {/* Container for the actual list of questions */}
                <div className="pb-32 lg:pb-0 overflow-y-auto">
                    <div className="rounded-xl overflow-hidden">
                        <div className="mb-2">
                            <h2 className="font-semibold text-blue-500 text-xl">{subject} Questions</h2>
                        </div>

                        {/* Conditionally render the list or a "not found" message. */}
                        {filteredQuestions.length > 0 ? (
                            // The List component handles rendering the actual rows and pagination controls.
                            <List listRef={listRef} pageItems={pageItems} handleQuestionClick={handleQuestionClick} currentPage={currentPage} totalPages={totalPages} setCurrentPage={setCurrentPage} />
                        ) : (
                            <div className="p-4 sm:p-8 text-center text-xs sm:text-base">No questions match your criteria. Try adjusting your filters.</div>
                        )}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default QuestionsList;