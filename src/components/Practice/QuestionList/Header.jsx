import React from 'react'
import { ArrowLeft } from 'phosphor-react'

const Header = ({handleBack, filteredQuestions, attemptFilter}) => {
    return (
        <div className="flex justify-between items-center w-full  mb-4 sm:mb-6">
            <button
                onClick={handleBack}
                className="flex items-center hover:text-blue-500 transition-colors cursor-pointer text-base sm:w-auto"
            >
                <ArrowLeft className="mr-2" />
                <span>Back to Subjects</span>
            </button>

            <div className="flex">
                <span className="bg-blue-100 text-blue-700 px-2 sm:px-3 py-1 rounded-lg text-sm">
                    {filteredQuestions.length}{' '}
                    {attemptFilter.charAt(0).toUpperCase() + attemptFilter.slice(1)} Questions
                </span>
            </div>
        </div>
    )
}

export default Header