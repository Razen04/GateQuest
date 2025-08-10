import React, { useState } from 'react'
import { motion } from 'framer-motion'
import subjects from '../../data/subjects'
import { getBackgroundColor } from '../../helper'
import { useNavigate } from 'react-router-dom'

const FilterTabs = ({ label, type, activeFilter, setActiveFilter }) => {
    return (
        <button
            className={`px-4 py-2 whitespace-nowrap cursor-pointer transition-all duration-300 rounded-lg text-sm font-medium focus:outline-none active:scale-95
                ${activeFilter === type
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'border border-border-primary dark:border-border-primary-dark hover:bg-blue-500 hover:text-white'}
            `}
            onClick={() => setActiveFilter(type)}
        >
            {label}
        </button>
    )
}

const Practice = () => {
    const navigate = useNavigate();
    const [activeFilter, setActiveFilter] = useState('all')

    // Filter subjects based on active filter
    const filteredSubjects = activeFilter === 'all'
        ? subjects.filter(subject => subject.category !== "bookmarked")
        : subjects.filter(subject => subject.category === activeFilter)

    // Handle subject selection
    const handleSubjectSelect = (subjectId) => {
        const subject = subjects.find(s => s.id === subjectId);

        if (subject) {
            const isBookmarked = activeFilter === 'bookmarked';
            navigate(`${subject.apiName}?bookmarked=${isBookmarked}`)
        }
    }



    return (
        <div className="bg-primary dark:bg-primary-dark text-text-primary dark:text-text-primary-dark p-6 pb-20">
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
                        <div className="flex overflow-x-scroll gap-2">
                            <FilterTabs label="All Subjects" type="all" activeFilter={activeFilter} setActiveFilter={setActiveFilter} />
                            <FilterTabs label="Core CS" type="core" activeFilter={activeFilter} setActiveFilter={setActiveFilter} />
                            <FilterTabs label="Mathematics" type="math" activeFilter={activeFilter} setActiveFilter={setActiveFilter} />
                            <FilterTabs label="Aptitude" type="aptitude" activeFilter={activeFilter} setActiveFilter={setActiveFilter} />
                            <FilterTabs label="Bookmarked Questions" type="bookmarked" activeFilter={activeFilter} setActiveFilter={setActiveFilter} />
                        </div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="max-h-[calc(100vh-35vh)] overflow-y-scroll mb-8"
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
                                                {<subject.icon className='h-6 w-6' />}
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
        </div>
    )
}

export default Practice