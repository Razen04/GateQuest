import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    FaLaptopCode
} from 'react-icons/fa'
import QuestionsList from './QuestionList'
import { FaComputer } from 'react-icons/fa6'

const FilterTabs = ({ label, type, activeFilter, setActiveFilter }) => {
    return (
        <button
            className={`px-4 py-2 cursor-pointer transition-all duration-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 active:scale-95
                ${activeFilter === type
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'border border-border-primary dark:border-border-primary-dark hover:bg-blue-500 hover:text-white'}
            `}
            onClick={() => setActiveFilter(type)}
        >
            {label}
        </button>
    )
}

const Practice = () => {
    const [activeFilter, setActiveFilter] = useState('all')
    const [selectedSubject, setSelectedSubject] = useState(null)
    const [viewMode, setViewMode] = useState('subjects') // 'subjects' or 'questions'

    // Subject data - simplified for first iteration
    const subjects = [
        {
            id: 1,
            name: "Algorithms",
            icon: <FaLaptopCode className="h-5 w-5" />,
            category: "core",
            color: "blue"
        },
        {
            id: 2,
            name: "Computer Organisation & Architecture",
            icon: <FaComputer className="h-5 w-5" />,
            category: "core",
            color: "red"
        },
        {
            id: 2.1,
            name: "Computer Organisation & Architecture",
            icon: <FaComputer className="h-5 w-5" />,
            category: "bookmarked",
            color: "yellow"
        },
    ]

    // Filter subjects based on active filter
    const filteredSubjects = activeFilter === 'all'
        ? subjects.filter(subject => subject.category !== "bookmarked")
        : subjects.filter(subject => subject.category === activeFilter)

    // Handle subject selection
    const handleSubjectSelect = (subjectId) => {
        const subject = subjects.find(s => s.id === subjectId);

        if (subject) {
            if (subject.id === 1) { // DSA
                setSelectedSubject('Algorithms')
                setViewMode('questions')
            } else if (subject.id === 2) {
                setSelectedSubject('CO & Architecture')
                setViewMode('questions')
            } else if (subject.id === 2.1) {
                setSelectedSubject('CO & Architecture')
                setViewMode('questions')
            }
        }
    }

    // Get background color based on subject
    const getBackgroundColor = (color) => {
        const colors = {
            blue: "bg-blue-100 text-blue-600",
            purple: "bg-purple-100 text-purple-600",
            green: "bg-green-100 text-green-600",
            indigo: "bg-indigo-100 text-indigo-600",
            red: "bg-red-100 text-red-600",
            orange: "bg-orange-100 text-orange-600"
        }
        return colors[color] || "bg-gray-100 text-gray-600"
    }

    return (
        <div className="min-h-[100dvh] bg-primary dark:bg-primary-dark text-text-primary dark:text-text-primary-dark p-8">
            {viewMode === 'questions' ? (
                // Show questions list
                <div className="max-w-4xl mx-auto">
                    <QuestionsList
                        subject={selectedSubject}
                        activeFilter={activeFilter}
                        onBack={() => {
                            setViewMode('subjects')
                            setSelectedSubject(null)
                        }}
                    />
                </div>
            ) : (
                // Subject selection interface
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mb-8"
                >
                    <div className="max-w-6xl">
                        {/* Header */}
                        <div className="mb-6">
                            <h1 className="text-3xl font-bold ">Practice by <span className='
                            bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>Subject</span></h1>
                            <p>Select a subject to start practicing</p>
                        </div>

                        {/* Filter Tabs */}
                        <div className="mb-6">
                            <div className="flex flex-wrap gap-2">
                                <FilterTabs label="All Subjects" type="all" activeFilter={activeFilter} setActiveFilter={setActiveFilter} />
                                <FilterTabs label="Core CS" type="core" activeFilter={activeFilter} setActiveFilter={setActiveFilter} />
                                <FilterTabs label="Mathematics" type="math" activeFilter={activeFilter} setActiveFilter={setActiveFilter} />
                                <FilterTabs label="General Aptitude" type="aptitude" activeFilter={activeFilter} setActiveFilter={setActiveFilter} />
                                <FilterTabs label="Bookmarked Questions" type="bookmarked" activeFilter={activeFilter} setActiveFilter={setActiveFilter} />
                            </div>
                        </div>

                        <motion.div
                                initial={{ opacity: 0, y: 40 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                                className="mb-8"
                        >
                                {/* Subject Grid - Simplified */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filteredSubjects.map((subject) => (
                                        <div
                                            key={subject.id}
                                            className="rounded-lg shadow-sm border border-border-primary dark:border-border-primary-dark overflow-hidden hover:shadow-md transition-shadow"
                                        >
                                            <div className="p-4">
                                                <div className="flex items-center mb-4">
                                                    <div className={`p-3 rounded-lg ${getBackgroundColor(subject.color)} mr-3`}>
                                                        {subject.icon}
                                                    </div>
                                                    <h3 className="font-medium">{subject.name}</h3>
                                                </div>

                                                <button
                                                    className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors cursor-pointer"
                                                    onClick={() => handleSubjectSelect(subject.id)}
                                                >
                                                    Practice
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                        </motion.div>
                        
                    </div>
                </motion.div>

            )}
        </div>
    )
}

export default Practice