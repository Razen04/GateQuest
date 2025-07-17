import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaArrowLeft, FaFilter, FaSearch, FaChevronDown } from 'react-icons/fa'
import QuestionCard from './QuestionCard/QuestionCard'
import useQuestions from '../../hooks/useQuestions'
import useFilters from '../../hooks/useFilters'
import { getDifficultyClassNames } from '../../utils/questionUtils'
import MathRenderer from './MathRenderer'

const QuestionsList = ({ subject, activeFilter, onBack }) => {
    const { questions, isLoading, error } = useQuestions(subject, activeFilter);

    const { filteredQuestions,
        searchQuery,
        setSearchQuery,
        difficultyFilter,
        setDifficultyFilter,
        yearFilter,
        setYearFilter,
        topicFilter,
        setTopicFilter
    } = useFilters(questions);

    const [selectedQuestion, setSelectedQuestion] = useState(null)
    const [showFilters, setShowFilters] = useState(false)

    const errorMessage = "No questions match your criteria. Try adjusting your filters.";
    // Dynamically generate years and topics for the dropdowns
    const years = useMemo(() => {
        const allYears = questions.map(q => parseInt(q.year)).filter(y => !isNaN(y));
        return [...new Set(allYears)].sort((a, b) => b - a);
    }, [questions]);

    const topics = useMemo(() => {
        const allTopics = questions.map(q => q.topic).filter(Boolean);
        return [...new Set(allTopics)];
    }, [questions]);

    // Handle question click
    const handleQuestionClick = (id) => {
        setSelectedQuestion(id)
    }

    const getQuestionDisplayText = (question) => {
        if (!question || !question.question) return "Question content unavailable";

        // For list view, we'll truncate long questions but preserve LaTeX
        const maxLength = 120;
        if (question.question.length <= maxLength) {
            return <MathRenderer text={question.question} />;
        }

        // Safely truncate, trying to keep LaTeX expressions intact
        let truncated = question.question.substring(0, maxLength);

        // Count open $ symbols to check if we've cut in the middle of a LaTeX expression
        const openCount = (truncated.match(/\$/g) || []).length;
        if (openCount % 2 !== 0) {
            // We cut in the middle of a LaTeX expression, find the previous $ and truncate there
            const lastDollarIndex = truncated.lastIndexOf('$');
            if (lastDollarIndex > 0) {
                truncated = truncated.substring(0, lastDollarIndex);
            }
        }

        return <MathRenderer text={truncated + "..."} />;
    }
    

    if (isLoading) {
        return (
            <div>Loading...</div>
        )
    }

    if (error) {
        return (
            <div>Failed to load questions, try again later.</div>
        )
    }

    return (
        <AnimatePresence mode="wait">
            {selectedQuestion !== null ? (
                // Show selected question
                <motion.div
                    key="question-view"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="px-2"
                >
                    <div className="flex items-center mb-4 sm:mb-6">
                        <button
                            onClick={() => setSelectedQuestion(null)}
                            className="flex items-center hover:text-blue-500 transition-colors cursor-pointer"
                        >
                            <FaArrowLeft className="mr-2" />
                            <span>Back to Questions</span>
                        </button>
                    </div>
                    <QuestionCard subject={subject} questions={filteredQuestions} questionId={selectedQuestion} />
                </motion.div>
            ) : (
                // Show questions list
                <motion.div
                    key="questions-list"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="px-2 sm:px-4"
                >
                    {/* Header with back button */}
                    <div className="flex justify-between items-center w-full  mb-4 sm:mb-6">
                        <button
                            onClick={onBack}
                            className="flex items-center hover:text-blue-500 transition-colors cursor-pointer text-base sm:w-auto"
                        >
                            <FaArrowLeft className="mr-2" />
                            <span>Back to Subjects</span>
                        </button>

                        <div className="flex">
                            <span className="bg-blue-100 text-blue-700 px-2 sm:px-3 py-1 rounded-lg text-sm">
                                {filteredQuestions.length} Questions
                            </span>
                        </div>
                    </div>

                    {/* Search and filters */}
                    <div className="rounded-xl p-2 sm:p-4 mb-4 sm:mb-6 border border-border-primary dark:border-border-primary-dark">
                        <div className="flex flex-col md:flex-row gap-2 sm:gap-4">
                            <div className="flex-1 relative">
                                <FaSearch className="absolute left-3 top-3 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search questions..."
                                    className="w-full pl-10 pr-2 sm:pr-4 py-2 border border-border-primary dark:border-border-primary-dark rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="flex items-center px-2 sm:px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer w-full md:w-auto"
                            >
                                <FaFilter className="mr-2" />
                                <span>Filter</span>
                                <FaChevronDown className={`ml-2 transition-transform ${showFilters ? 'transform rotate-180' : ''}`} />
                            </button>
                        </div>

                        <AnimatePresence>
                            {showFilters && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="mt-2 sm:mt-4 pt-2 sm:pt-4 border-t border-gray-100 dark:border-zinc-700 overflow-hidden"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4">
                                        <div>
                                            <label className="block font-medium mb-2">Difficulty</label>
                                            <select
                                                className="w-full p-2 border border-gray-200 dark:border-zinc-800 rounded-lg"
                                                value={difficultyFilter}
                                                onChange={(e) => setDifficultyFilter(e.target.value)}
                                            >
                                                <option value="all">All Difficulties</option>
                                                <option value="Easy">Easy</option>
                                                <option value="Medium">Medium</option>
                                                <option value="Hard">Hard</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block font-medium mb-2">Year</label>
                                            <select
                                                className="w-full p-2 border border-gray-200 dark:border-zinc-800 rounded-lg"
                                                value={yearFilter}
                                                onChange={(e) => setYearFilter(e.target.value)}
                                            >
                                                <option value="all">All Years</option>
                                                {years.map((year) => (
                                                    <option key={year} value={year}>{year}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block font-medium mb-2">Topic</label>
                                            <select
                                                className="w-full p-2 border border-gray-200 dark:border-zinc-800 rounded-lg"
                                                value={topicFilter}
                                                onChange={(e) => setTopicFilter(e.target.value)}
                                            >
                                                <option value="all">All Topics</option>
                                                {topics.map((topic) => (
                                                    <option key={topic} value={topic}>{topic}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Questions List */}
                    <div className="rounded-xl overflow-hidden border border-border-primary dark:border-border-primary-dark">
                        <div className="p-2 sm:p-4 border-b border-border-primary dark:border-border-primary-dark">
                            <h2 className="font-semibold text-blue-500 text-xl">
                                {subject} Questions
                            </h2>
                        </div>

                        {filteredQuestions.length > 0 ? (
                            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                {filteredQuestions.map((question, index) => (
                                    <motion.div
                                        key={index}
                                        whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.05)' }}
                                        className="p-2 sm:p-4 cursor-pointer transition-colors duration-50"
                                        onClick={() => handleQuestionClick(question.id)}
                                    >
                                        <div className="flex flex-col sm:flex-row justify-between">
                                            <h3 className="font-medium mb-2 pr-0 sm:pr-4 text-sm md:text-base">
                                                {getQuestionDisplayText(question)}
                                            </h3>
                                            <div className="flex space-x-2 mt-2 sm:mt-0">
                                                <span className={`h-min text-xs font-bold md:font-normal md:px-2 md:py-1 rounded-full whitespace-nowrap ${getDifficultyClassNames(question.difficulty)}`}>
                                                    {question.difficulty}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center text-xs mt-1">
                                            {question.year ? (
                                                <span>GATE {question.year}</span>
                                            ) : (
                                                <span>Year Unknown</span>
                                            )}
                                            <span className="mx-2">•</span>
                                            <span>ID: {question.id || 'Unknown'}</span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-4 sm:p-8 text-center text-xs sm:text-base">
                                {errorMessage}
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

export default QuestionsList