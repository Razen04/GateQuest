import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    FaLaptopCode, FaServer, FaNetworkWired, FaDatabase,
    FaCogs, FaCode, FaMicrochip, FaBookOpen, FaChartBar,
    FaCalculator, FaSitemap, FaFileAlt, FaArrowLeft, FaSquareRootAlt
} from 'react-icons/fa'
import QuestionsList from './QuestionList'

const Practice = () => {
    const [activeFilter, setActiveFilter] = useState('all')
    const [selectedSubject, setSelectedSubject] = useState(null) // Track selected subject
    const [selectedChapter, setSelectedChapter] = useState(null) // Track selected chapter
    const [viewMode, setViewMode] = useState('subjects') // 'subjects', 'chapters', 'questions', or 'question'

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    }

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { duration: 0.5 }
        }
    }

    // Subject data
    const subjects = [
        {
            id: 1,
            name: "Data Structures & Algorithms",
            icon: <FaLaptopCode className="h-6 w-6" />,
            progress: 65,
            questions: 240,
            difficulty: "Medium",
            category: "core",
            color: "blue"
        },
        {
            id: 2,
            name: "Computer Organization",
            icon: <FaMicrochip className="h-6 w-6" />,
            progress: 42,
            questions: 180,
            difficulty: "Hard",
            category: "core",
            color: "purple"
        },
        {
            id: 3,
            name: "Engineering Mathematics",
            icon: <FaSquareRootAlt className="h-6 w-6" />,
            progress: 28,
            questions: 320,
            difficulty: "Medium",
            category: "math",
            color: "green",
            chapters: [
                {
                    id: "combinatory",
                    name: "Combinatorics",
                    questions: 38,
                    difficulty: "Medium"
                },
                {
                    id: "calculus",
                    name: "Calculus",
                    questions: 45,
                    difficulty: "Hard"
                },
                {
                    id: "linear-algebra",
                    name: "Linear Algebra",
                    questions: 42,
                    difficulty: "Medium"
                },
                {
                    id: "probability",
                    name: "Probability",
                    questions: 50,
                    difficulty: "Medium"
                },
                {
                    id: "statistics",
                    name: "Statistics",
                    questions: 35,
                    difficulty: "Easy"
                },
                {
                    id: "discrete-math",
                    name: "Discrete Mathematics",
                    questions: 60,
                    difficulty: "Hard"
                },
                {
                    id: "numerical-methods",
                    name: "Numerical Methods",
                    questions: 40,
                    difficulty: "Medium"
                }
            ]
        },
        // Other subjects remain the same...
    ]

    // Filter subjects based on active filter
    const filteredSubjects = activeFilter === 'all'
        ? subjects
        : subjects.filter(subject => subject.category === activeFilter)

    // Get background gradient based on color
    const getGradient = (color) => {
        const gradients = {
            blue: "from-blue-500 to-blue-600",
            purple: "from-purple-500 to-purple-600",
            indigo: "from-indigo-500 to-indigo-600",
            green: "from-green-500 to-green-600",
            red: "from-red-500 to-red-600",
            yellow: "from-yellow-500 to-yellow-600",
            orange: "from-orange-500 to-orange-600",
            teal: "from-teal-500 to-teal-600",
            cyan: "from-cyan-500 to-cyan-600",
            pink: "from-pink-500 to-pink-600",
            violet: "from-violet-500 to-violet-600"
        }
        return gradients[color] || "from-blue-500 to-blue-600"
    }

    // Get progress bar color
    const getProgressColor = (progress) => {
        if (progress < 30) return "bg-red-500"
        if (progress < 60) return "bg-yellow-500"
        return "bg-green-500"
    }

    // Get difficulty badge color
    const getDifficultyColor = (difficulty) => {
        if (difficulty === "Easy") return "bg-green-100 text-green-700"
        if (difficulty === "Medium") return "bg-yellow-100 text-yellow-700"
        return "bg-red-100 text-red-700"
    }

    // Handle subject selection
    const handleSubjectSelect = (subjectId) => {
        const subject = subjects.find(s => s.id === subjectId);

        if (subject) {
            if (subject.id === 1) { // DSA
                setSelectedSubject('dsa')
                setViewMode('questions')
                setSelectedChapter(null)
            } else if (subject.id === 2) { // Computer Organization
                setSelectedSubject('coa')
                setViewMode('questions')
                setSelectedChapter(null)
            } else if (subject.id === 3 && subject.chapters) { // Engineering Mathematics has chapters
                setSelectedSubject('em')
                setViewMode('chapters') // Show chapters instead of questions directly
                setSelectedChapter(null)
            } else {
                // For other subjects, you can add more cases later
                setSelectedSubject(null)
                setSelectedChapter(null)
            }
        }
    }

    // Handle chapter selection
    const handleChapterSelect = (chapterId) => {
        setSelectedChapter(chapterId)
        setViewMode('questions')
    }

    // Get the current subject object
    const getCurrentSubject = () => {
        return subjects.find(s =>
            (s.id === 1 && selectedSubject === 'dsa') ||
            (s.id === 2 && selectedSubject === 'coa') ||
            (s.id === 3 && selectedSubject === 'em')
        );
    }

    return (
        <AnimatePresence mode="wait">
            {viewMode === 'questions' ? (
                // Show questions list
                <motion.div
                    className="p-8 bg-gray-50 min-h-screen"
                    key="questions-view"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <div className="max-w-4xl mx-auto">
                        <QuestionsList
                            subject={selectedSubject}
                            chapter={selectedChapter}
                            onBack={() => {
                                if (selectedChapter && selectedSubject === 'em') {
                                    // If we're in a chapter, go back to chapters list
                                    setViewMode('chapters')
                                    setSelectedChapter(null)
                                } else {
                                    // Otherwise go back to subjects
                                    setViewMode('subjects')
                                    setSelectedSubject(null)
                                }
                            }}
                        />
                    </div>
                </motion.div>
            ) : viewMode === 'chapters' ? (
                // Show chapters for a subject
                <motion.div
                    className="p-8 bg-gray-50 min-h-screen"
                    key="chapters-view"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <div className="max-w-4xl mx-auto">
                        {/* Header with back button */}
                        <div className="flex flex-wrap items-center justify-between mb-6">
                            <button
                                onClick={() => {
                                    setViewMode('subjects')
                                    setSelectedSubject(null)
                                }}
                                className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
                            >
                                <FaArrowLeft className="mr-2" />
                                <span>Back to Subjects</span>
                            </button>
                        </div>

                        <h2 className="text-2xl font-bold text-gray-800 mb-6">
                            {getCurrentSubject()?.name} Chapters
                        </h2>

                        {/* Chapters Grid */}
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="grid grid-cols-1 md:grid-cols-2 gap-6"
                        >
                            {getCurrentSubject()?.chapters.map((chapter) => (
                                <motion.div
                                    key={chapter.id}
                                    variants={itemVariants}
                                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                                    className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                                    onClick={() => handleChapterSelect(chapter.id)}
                                >
                                    <div className="p-6">
                                        <h3 className="font-medium text-gray-800 text-lg mb-2">{chapter.name}</h3>

                                        <div className="flex items-center mb-4">
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${getDifficultyColor(chapter.difficulty)}`}>
                                                {chapter.difficulty}
                                            </span>
                                            <span className="mx-2 text-gray-300">•</span>
                                            <span className="text-xs text-gray-500">{chapter.questions} questions</span>
                                        </div>

                                        <button
                                            className="w-full py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-purple-700 transition-colors"
                                        >
                                            Start Practice
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </motion.div>
            ) : (
                // Full subject selection interface
                <motion.div
                    className="p-8 bg-gray-50 min-h-screen"
                    key="subject-selection"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {/* Header Section */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="mb-8"
                    >
                        <h1 className="text-3xl font-bold text-gray-800">Practice <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">By Subject</span></h1>
                        <p className="text-gray-600 mt-2">Master the GATE CS syllabus one topic at a time</p>
                    </motion.div>

                    {/* Filter Tabs */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="mb-8"
                    >
                        <div className="flex flex-wrap gap-3">
                            <button
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeFilter === 'all'
                                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-sm'
                                    : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                                    }`}
                                onClick={() => setActiveFilter('all')}
                            >
                                All Subjects
                            </button>
                            <button
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeFilter === 'core'
                                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-sm'
                                    : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                                    }`}
                                onClick={() => setActiveFilter('core')}
                            >
                                Core CS
                            </button>
                            <button
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeFilter === 'advanced'
                                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-sm'
                                    : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                                    }`}
                                onClick={() => setActiveFilter('advanced')}
                            >
                                Advanced Topics
                            </button>
                            <button
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeFilter === 'math'
                                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-sm'
                                    : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                                    }`}
                                onClick={() => setActiveFilter('math')}
                            >
                                Mathematics
                            </button>
                            <button
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeFilter === 'aptitude'
                                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-sm'
                                    : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                                    }`}
                                onClick={() => setActiveFilter('aptitude')}
                            >
                                General Aptitude
                            </button>
                        </div>
                    </motion.div>

                    {/* Statistics Cards - Keep existing code */}
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
                    >
                        <motion.div
                            variants={itemVariants}
                            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center"
                        >
                            <div className="p-4 rounded-full bg-blue-50 mr-4">
                                <FaFileAlt className="h-6 w-6 text-blue-500" />
                            </div>
                            <div>
                                <h3 className="text-gray-500 text-sm">Total Questions</h3>
                                <div className="flex items-center mt-1">
                                    <span className="text-2xl font-bold text-gray-800">2,000+</span>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            variants={itemVariants}
                            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center"
                        >
                            <div className="p-4 rounded-full bg-purple-50 mr-4">
                                <FaChartBar className="h-6 w-6 text-purple-500" />
                            </div>
                            <div>
                                <h3 className="text-gray-500 text-sm">Average Score</h3>
                                <div className="flex items-center mt-1">
                                    <span className="text-2xl font-bold text-gray-800">72/100</span>
                                    <span className="ml-2 text-xs text-green-500 bg-green-50 px-2 py-0.5 rounded-full">+4.2%</span>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            variants={itemVariants}
                            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center"
                        >
                            <div className="p-4 rounded-full bg-indigo-50 mr-4">
                                <FaBookOpen className="h-6 w-6 text-indigo-500" />
                            </div>
                            <div>
                                <h3 className="text-gray-500 text-sm">Subject Coverage</h3>
                                <div className="flex items-center mt-1">
                                    <span className="text-2xl font-bold text-gray-800">54%</span>
                                    <span className="ml-2 text-xs text-green-500 bg-green-50 px-2 py-0.5 rounded-full">+1.5%</span>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* Subject Grid */}
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {filteredSubjects.map((subject) => (
                            <motion.div
                                key={subject.id}
                                variants={itemVariants}
                                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                            >
                                <div className="p-6">
                                    <div className="flex items-center mb-4">
                                        <div className={`p-3 rounded-lg bg-gradient-to-r ${getGradient(subject.color)} text-white mr-4`}>
                                            {subject.icon}
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-gray-800">{subject.name}</h3>
                                            <div className="flex items-center mt-1">
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${getDifficultyColor(subject.difficulty)}`}>
                                                    {subject.difficulty}
                                                </span>
                                                <span className="mx-2 text-gray-300">•</span>
                                                <span className="text-xs text-gray-500">{subject.questions} questions</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-sm text-gray-600">Progress</span>
                                            <span className="text-sm font-medium text-gray-800">{subject.progress}%</span>
                                        </div>
                                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${getProgressColor(subject.progress)} rounded-full`}
                                                style={{ width: `${subject.progress}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    <div className="flex space-x-3">
                                        <button
                                            className="flex-1 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-purple-700 transition-colors"
                                            onClick={() => handleSubjectSelect(subject.id)}
                                        >
                                            Practice
                                        </button>
                                        <button className="flex-1 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                                            Review Notes
                                        </button>
                                    </div>
                                </div>

                                <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                                    <span className="text-xs text-gray-500">Last practiced 2 days ago</span>
                                    <button className="text-blue-500 text-xs hover:underline">View Details</button>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* Quick Access */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8, duration: 0.6 }}
                        className="mt-10"
                    >
                        <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-xl p-8 text-white">
                            <div className="max-w-3xl mx-auto text-center">
                                <h2 className="text-2xl font-bold mb-3">Ready for a Complete Test?</h2>
                                <p className="mb-6 opacity-90">Challenge yourself with a full mock test based on previous years' GATE papers</p>
                                <div className="flex flex-wrap justify-center gap-4">
                                    <button className="px-6 py-3 bg-white text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors">
                                        Take Full Mock Test
                                    </button>
                                    <button className="px-6 py-3 bg-white/20 text-white backdrop-blur-sm rounded-lg text-sm font-medium hover:bg-white/30 transition-colors">
                                        Topic-wise Test
                                    </button>
                                    <button className="px-6 py-3 bg-white/20 text-white backdrop-blur-sm rounded-lg text-sm font-medium hover:bg-white/30 transition-colors">
                                        Previous Year Papers
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

export default Practice