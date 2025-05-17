import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaArrowLeft, FaFilter, FaSearch, FaChevronDown } from 'react-icons/fa'
import MathRenderer from './MathRenderer'
import QuestionCard from './QuestionCard'
import dsaQuestions from '../data/dsa.json'
import coaQuestions from '../data/coa.json'
import emCombinatory from '../data/em_combinatory.json'

const QuestionsList = ({ subject, chapter = null, onBack }) => {
    const [questions, setQuestions] = useState([])
    const [filteredQuestions, setFilteredQuestions] = useState([])
    const [selectedQuestion, setSelectedQuestion] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [difficultyFilter, setDifficultyFilter] = useState('all')
    const [yearFilter, setYearFilter] = useState('all')
    const [showFilters, setShowFilters] = useState(false)

    // Load questions based on subject and chapter
    useEffect(() => {
        let loadedQuestions = []

        if (subject === 'dsa') {
            loadedQuestions = dsaQuestions
        } else if (subject === 'coa') {
            loadedQuestions = coaQuestions
        } else if (subject === 'em') {
            if (chapter === 'combinatory') {
                loadedQuestions = emCombinatory
            }
            // Add other chapters as they become available
        }

        setQuestions(loadedQuestions)
        setFilteredQuestions(loadedQuestions)
    }, [subject, chapter])

    // Apply filters when filter state changes
    useEffect(() => {
        let results = [...questions]

        // Apply search query filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase()
            results = results.filter(q =>
                (q.question && q.question.toLowerCase().includes(query)) ||
                (q.id && q.id.toLowerCase().includes(query))
            )
        }

        // Apply difficulty filter - handle null difficulty values
        if (difficultyFilter !== 'all') {
            // Only filter questions that have a difficulty value
            results = results.filter(q => {
                // Skip questions with no difficulty
                if (!q.difficulty) return false;

                // Normalize difficulty for questions where 'normal' means 'medium'
                const normalizedDifficulty = q.difficulty.toLowerCase() === 'normal' ? 'medium' : q.difficulty.toLowerCase()
                return normalizedDifficulty === difficultyFilter
            })
        }

        // Apply year filter - handle null year values
        if (yearFilter !== 'all') {
            results = results.filter(q => q.year && q.year.toString() === yearFilter)
        }

        setFilteredQuestions(results)
    }, [questions, searchQuery, difficultyFilter, yearFilter])

    // Get unique years for filter (safely handling missing year properties)
    const years = questions
        .filter(q => q.year != null) // Filter out questions with no year
        .map(q => q.year.toString())
        .filter((value, index, self) => self.indexOf(value) === index) // Get unique values
        .sort((a, b) => b - a) // Sort descending

    // Get subject name
    const getSubjectName = (subjectCode) => {
        if (subjectCode === 'dsa') return "Data Structures & Algorithms"
        if (subjectCode === 'coa') return "Computer Organization"
        if (subjectCode === 'em') return "Engineering Mathematics"
        return ""
    }

    // Get difficulty display text
    const getDifficultyDisplayText = (difficulty) => {
        if (!difficulty) return "Unknown"

        if (difficulty.toLowerCase() === 'normal') return 'Medium'

        // Capitalize first letter
        return difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase()
    }

    // Get difficulty class names
    const getDifficultyClassNames = (difficulty) => {
        if (!difficulty) return 'bg-gray-100 text-gray-700' // Default for unknown

        const difficultyLower = difficulty.toLowerCase()

        if (difficultyLower === 'easy') return 'bg-green-100 text-green-700'
        if (difficultyLower === 'medium' || difficultyLower === 'normal') return 'bg-yellow-100 text-yellow-700'
        if (difficultyLower === 'hard') return 'bg-red-100 text-red-700'

        return 'bg-gray-100 text-gray-700' // Default fallback
    }

    // Handle question click
    const handleQuestionClick = (index) => {
        setSelectedQuestion(index)
    }

    // Helper to safely display question text
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
                >
                    <div className="flex items-center mb-6">
                        <button
                            onClick={() => setSelectedQuestion(null)}
                            className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
                        >
                            <FaArrowLeft className="mr-2" />
                            <span>Back to Questions</span>
                        </button>
                    </div>
                    <QuestionCard subject={subject} chapter={chapter} initialIndex={selectedQuestion} />
                </motion.div>
            ) : (
                // Show questions list
                <motion.div
                    key="questions-list"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {/* Header with back button */}
                    <div className="flex flex-wrap items-center justify-between mb-6">
                        <button
                            onClick={onBack}
                            className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
                        >
                            <FaArrowLeft className="mr-2" />
                            <span>Back to {chapter ? 'Chapters' : 'Subjects'}</span>
                        </button>

                        <div className="flex mt-4 sm:mt-0">
                            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-sm">
                                {filteredQuestions.length} Questions
                            </span>
                        </div>
                    </div>

                    {/* Search and filters */}
                    <div className="bg-white rounded-xl p-4 mb-6 border border-gray-100">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative">
                                <FaSearch className="absolute left-3 top-3 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search questions..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="flex items-center px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
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
                                    className="mt-4 pt-4 border-t border-gray-100 overflow-hidden"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                                            <select
                                                className="w-full p-2 border border-gray-200 rounded-lg"
                                                value={difficultyFilter}
                                                onChange={(e) => setDifficultyFilter(e.target.value)}
                                            >
                                                <option value="all">All Difficulties</option>
                                                <option value="easy">Easy</option>
                                                <option value="medium">Medium</option>
                                                <option value="hard">Hard</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                                            <select
                                                className="w-full p-2 border border-gray-200 rounded-lg"
                                                value={yearFilter}
                                                onChange={(e) => setYearFilter(e.target.value)}
                                            >
                                                <option value="all">All Years</option>
                                                {years.map((year) => (
                                                    <option key={year} value={year}>{year}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Questions List */}
                        <div className="bg-white rounded-xl overflow-hidden border border-gray-100">
                            <div className="p-4 bg-gray-50 border-b border-gray-100">
                                <h2 className="font-semibold text-gray-800">
                                    {getSubjectName(subject)} {chapter && `- ${chapter.charAt(0).toUpperCase() + chapter.slice(1)}`} Questions
                                </h2>
                            </div>

                            {filteredQuestions.length > 0 ? (
                                <div className="divide-y divide-gray-100">
                                    {filteredQuestions.map((question, index) => (
                                        <motion.div
                                            key={index}
                                            whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.05)' }}
                                            className="p-4 cursor-pointer transition-colors"
                                            onClick={() => handleQuestionClick(index)}
                                        >
                                            <div className="flex justify-between">
                                                <h3 className="font-medium text-gray-800 mb-2 pr-4">
                                                    {getQuestionDisplayText(question)}
                                                </h3>
                                                <div className="flex space-x-2">
                                                    <span className={`h-min text-xs px-2 py-1 rounded-full whitespace-nowrap ${getDifficultyClassNames(question.difficulty)}`}>
                                                        {getDifficultyDisplayText(question.difficulty)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center text-xs text-gray-500">
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
                                <div className="p-8 text-center text-gray-500">
                                    No questions match your criteria. Try adjusting your filters.
                                </div>
                            )}
                        </div>
                    </motion.div>
            )}
        </AnimatePresence>
    )
}

export default QuestionsList