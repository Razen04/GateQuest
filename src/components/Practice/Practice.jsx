import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    FaLaptopCode
} from 'react-icons/fa'
import QuestionsList from './QuestionList'
import { FaComputer } from 'react-icons/fa6'

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
            name: "Computer Organisation & Archtecture",
            icon: <FaComputer className="h-5 w-5" />,
            category: "core",
            color: "red"
        },
    ]

    // Filter subjects based on active filter
    const filteredSubjects = activeFilter === 'all'
        ? subjects
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
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            {viewMode === 'questions' ? (
                // Show questions list
                <div className="max-w-4xl mx-auto">
                    <QuestionsList
                        subject={selectedSubject}
                        onBack={() => {
                            setViewMode('subjects')
                            setSelectedSubject(null)
                        }}
                    />
                </div>
            ) : (
                // Subject selection interface
                <div className="max-w-6xl">
                    {/* Header */}
                    <div className="mb-6">
                            <h1 className="text-3xl font-bold text-gray-800">Practice by <span className='
                            bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>Subject</span></h1>
                        <p className="text-gray-600">Select a subject to start practicing</p>
                    </div>

                    {/* Filter Tabs */}
                    <div className="mb-6">
                        <div className="flex flex-wrap gap-2">
                            <button
                                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                                    activeFilter === 'all' 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-white text-gray-600 border border-gray-200'
                                }`}
                                onClick={() => setActiveFilter('all')}
                            >
                                All Subjects
                            </button>
                            <button
                                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                                    activeFilter === 'core' 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-white text-gray-600 border border-gray-200'
                                }`}
                                onClick={() => setActiveFilter('core')}
                            >
                                Core CS
                            </button>
                            <button
                                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                                    activeFilter === 'math' 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-white text-gray-600 border border-gray-200'
                                }`}
                                onClick={() => setActiveFilter('math')}
                            >
                                Mathematics
                            </button>
                            <button
                                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                                    activeFilter === 'aptitude' 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-white text-gray-600 border border-gray-200'
                                }`}
                                onClick={() => setActiveFilter('aptitude')}
                            >
                                General Aptitude
                            </button>
                        </div>
                    </div>

                    {/* Subject Grid - Simplified */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredSubjects.map((subject) => (
                            <div
                                key={subject.id}
                                className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                            >
                                <div className="p-4">
                                    <div className="flex items-center mb-4">
                                        <div className={`p-3 rounded-lg ${getBackgroundColor(subject.color)} mr-3`}>
                                            {subject.icon}
                                        </div>
                                        <h3 className="font-medium text-gray-800">{subject.name}</h3>
                                    </div>

                                    <button
                                        className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                                        onClick={() => handleSubjectSelect(subject.id)}
                                    >
                                        Practice
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export default Practice