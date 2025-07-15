import React, { useState, useEffect, useRef, useContext, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaCheck, FaTimes, FaTag } from 'react-icons/fa'
import MathRenderer from '../MathRenderer'
import ActionButtons from './ActionButtons'
import ResultMessage from './ResultMessage'
import QuestionTimer from './QuestionTimer'
import AppSettingContext from '../../../context/AppSettingContext'
import { toast } from 'sonner'
import QuestionBookmark from './QuestionBookmark'
import { getUserProfile, syncUserToSupabase, updateUserProfile } from '../../../helper'

const QuestionCard = ({ subject, questions, questionId = 0 }) => {
    const [currentIndex, setCurrentIndex] = useState(questionId)
    const [userAnswer, setUserAnswer] = useState(null)
    const [selectedOptions, setSelectedOptions] = useState([]) // For multiple selections
    const [numericalAnswer, setNumericalAnswer] = useState(null)
    const [questionLink, setQuestionLink] = useState("");
    const numInputRef = useRef(null);
    const [showAnswer, setShowAnswer] = useState(false)
    const [result, setResult] = useState(null) // correct, incorrect, or null
    const [timer, setTimer] = useState(false)
    const [timerVal, setTimerVal] = useState(0)
    const intervalRef = useRef(null);

    const { settings } = useContext(AppSettingContext)



    // Load questions based on subject and chapter
    useEffect(() => {
        // Reset state when subject changes
        setCurrentIndex(questionId)
        resetQuestion()
    }, [subject, questionId])

    const currentQuestion = questions.find(q => q.id === currentIndex) || questions[0]

    // Set question link after every question
    useEffect(() => {
        console.log(currentQuestion)
        console.log(currentQuestion.explanation)
        setQuestionLink(currentQuestion.explanation)
    }, [currentQuestion])

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyStroke = (e) => {
            if (
                e.target.tagName === "INPUT" ||
                e.target.tagName === "TEXTAREA" ||
                e.metaKey ||
                e.ctrlKey ||
                e.altKey
            ) return;

            switch (e.code) {
                case "KeyA":
                    e.preventDefault();
                    handlePrevious();
                    break;
                case "KeyD":
                    e.preventDefault();
                    handleNext();
                    break;
                case "Enter":
                    e.preventDefault()
                    handleShowAnswer()
                    break;
                case "KeyS":
                    e.preventDefault();
                    handleSkip();
                    break;
                case "KeyE":
                    e.preventDefault();
                    handleExplainationClick(questionLink);

                    break;
                default:
                    break;
            }
        };

        document.addEventListener("keydown", handleKeyStroke);

        return () => {
            document.removeEventListener("keydown", handleKeyStroke);
        };
    }, [currentQuestion]);

    // Timer
    const handleTimer = () => {
        if (intervalRef.current !== null) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            setTimer(false);
            setTimerVal(0);
        } else {
            setTimerVal(0);
            setTimer(true);
            intervalRef.current = setInterval(() => {
                setTimerVal(prev => prev + 1);
            }, 1000);
        }
    };

    useEffect(() => {
        // Cleanup on unmount
        return () => {
            if (intervalRef.current !== null) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            setTimerVal(0);
        };
    }, []);

    useEffect(() => {
        // Always clear previous interval before starting a new one
        if (intervalRef.current !== null) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        if (!settings?.autoTimer) {
            setTimer(false);
            setTimerVal(0);
        } else {
            setTimerVal(0);
            setTimer(true);
            intervalRef.current = setInterval(() => {
                setTimerVal(prev => prev + 1);
            }, 1000);
        }
        // Cleanup on question change
        return () => {
            if (intervalRef.current !== null) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [currentQuestion, settings?.autoTimer]);

    const minutes = String(Math.floor(timerVal / 60)).padStart(2, "0");
    const seconds = String(timerVal % 60).padStart(2, "0")


    // Handle bookmark
    const handleBookmark = () => {
        const profile = getUserProfile();

        if (profile) {
            const oldBookmark = profile.bookmark_questions || []

            const bookmark_questions = [
                ...oldBookmark,
                { id: questionId, subject: subject }
            ]

            const updatedProfile = { ...profile, bookmark_questions }
            console.log("User Profile: ", updatedProfile)
            updateUserProfile(updatedProfile)
            syncUserToSupabase()
        } else {
            toast.error("Unable to bookmark, try again later.")
        }
    }

    // Determine if current question is a multiple selection question
    const isMultipleSelection = () => {
        if (!currentQuestion) return false;
        if (currentQuestion.tags && Array.isArray(currentQuestion.tags)) {
            return currentQuestion.tags.some(tag =>
                tag.toLowerCase().includes('multiple-select') ||
                tag.toLowerCase().includes('multiple select')
            );
        }
        return currentQuestion.questionType === 'MSQ' ||
            currentQuestion.questionType === 'Multiple Select Question';
    }

    // Determine if current question is a numerical question
    const isNumericalQuestion = () => {
        if (!currentQuestion) return false;

        if (currentQuestion.questionType) {
            return currentQuestion.questionType.toLowerCase().includes('numerical')
        }

        return currentQuestion.questionType === 'Numerical Answer' ||
            (currentQuestion.options &&
                Array.isArray(currentQuestion.options) &&
                currentQuestion.options.length === 0);
    }

    // Handle single option selection
    const handleOptionSelect = (option) => {
        if (showAnswer) return;

        if (isMultipleSelection()) {
            // For multiple selection questions
            const optionIndex = selectedOptions.indexOf(option);
            if (optionIndex === -1) {
                // Add option if not already selected
                setSelectedOptions([...selectedOptions, option]);
            } else {
                // Remove option if already selected
                setSelectedOptions(selectedOptions.filter((_, index) => index !== optionIndex));
            }
        } else {
            // For single selection questions
            setUserAnswer(option);
            setSelectedOptions([...selectedOptions, option])
            if (option === userAnswer) {
                setUserAnswer(null);
                setSelectedOptions([]);
            }
        }
    }

    // Handle numerical input change
    const handleNumericalInputChange = (e) => {
        if (showAnswer) return;
        setNumericalAnswer(e.target.value);
    }

    // Check if an option is selected (for multiple selection)
    const isOptionSelected = (option) => {
        if (isMultipleSelection()) {
            return selectedOptions.includes(option);
        }
        return userAnswer === option;
    }

    // Handle show answer
    const handleShowAnswer = (overrideAnswer) => {
        setShowAnswer(true);
        setTimer(false);
        if (intervalRef.current !== null) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        if (document.activeElement && document.activeElement.tagName === "BUTTON") {
            document.activeElement.blur();
        }


        try {
            if (isNumericalQuestion()) {
                // Handle numerical answer checking
                console.log("🔥 overrideAnswer:", overrideAnswer);
                console.log("📦 numericalAnswer (state):", numericalAnswer);
                const raw = overrideAnswer !== undefined
                    ? overrideAnswer.toString().trim()
                    : numericalAnswer.toString().trim();

                const answerToCheck = parseFloat(raw);
                console.log("🔍 Parsed Answer:", answerToCheck);

                console.log("📦 currentQuestion.correctAnswer:", currentQuestion?.correctAnswer);
                console.log("✅ parsed value:", parseFloat(overrideAnswer ?? numericalAnswer));
                console.log("✅ typeof overrideAnswer:", typeof overrideAnswer);

                if (isNaN(answerToCheck)) {
                    toast.error("You haven't entered a valid number.");
                    setResult("unattempted");
                    return;
                }

                const userNumericValue = answerToCheck;
                const correctNumericValue = parseFloat(currentQuestion?.correctAnswer);


                if (!isNaN(userNumericValue) && !isNaN(correctNumericValue)) {
                    if (userNumericValue === correctNumericValue) {
                        setResult('correct');
                    } else {
                        setResult('incorrect')
                    }

                } else {
                    console.log('unattempted')
                    setResult('unattempted');
                }



            } else if (isMultipleSelection()) {
                // Handle multiple selection checking
                if (Array.isArray(currentQuestion?.correctAnswer) && selectedOptions.length > 0) {
                    // Get correct options based on indices
                    const correctOptions = currentQuestion.correctAnswer.map(index =>
                        currentQuestion.options[index]
                    ).filter(Boolean);

                    // Check if selected options match correct options
                    const allCorrectSelected = correctOptions.every(opt =>
                        selectedOptions.includes(opt)
                    );
                    const noExtraSelected = selectedOptions.every(opt =>
                        correctOptions.includes(opt)
                    );

                    setResult(allCorrectSelected && noExtraSelected ? 'correct' : 'incorrect');
                } else {
                    setResult('unattempted');
                }
            } else if (userAnswer) {
                // Handle single selection checking
                if (Array.isArray(currentQuestion?.correctAnswer)) {
                    const correctIndex = currentQuestion.correctAnswer[0];
                    if (currentQuestion.options &&
                        Array.isArray(currentQuestion.options) &&
                        correctIndex !== undefined &&
                        currentQuestion.options[correctIndex] !== undefined) {
                        const correctOption = currentQuestion.options[correctIndex];
                        setResult(userAnswer === correctOption ? 'correct' : 'incorrect');
                    } else {
                        setResult('unattempted');
                    }
                } else if (currentQuestion?.correctAnswer) {
                    setResult(userAnswer === currentQuestion.correctAnswer ? 'correct' : 'incorrect');
                } else {
                    setResult('unattempted');
                }
            } else {
                setResult('unattempted');
            }
        } catch (error) {
            console.error("Error determining answer correctness:", error);
            setResult('unattempted');
        }
    }

    // Get correct answer text
    const getCorrectAnswerText = () => {
        if (!currentQuestion) return '';

        try {
            if (isNumericalQuestion()) {
                return currentQuestion.correctAnswer?.toString()
            }

            if (isMultipleSelection() && Array.isArray(currentQuestion.correctAnswer)) {
                // For multiple selection, show all correct options
                const correctIndices = currentQuestion.correctAnswer;
                if (Array.isArray(currentQuestion.options)) {
                    const correctOptions = correctIndices.map(index =>
                        currentQuestion.options[index]
                    ).filter(Boolean);
                    return correctOptions.join(', ');
                }
            }

            if (Array.isArray(currentQuestion.correctAnswer) &&
                currentQuestion.options &&
                Array.isArray(currentQuestion.options)) {
                const index = currentQuestion.correctAnswer[0];
                if (index !== undefined && currentQuestion.options[index] !== undefined) {
                    return currentQuestion.options[index];
                }
            }

            // For questions that might have answerText
            if (currentQuestion.answerText) {
                return currentQuestion.answerText;
            }

            return currentQuestion.correctAnswer || 'Answer not available';
        } catch (error) {
            console.error("Error getting correct answer text:", error);
            return 'Answer not available';
        }
    }

    // Reset question state
    const resetQuestion = () => {
        setTimer(false);
        setUserAnswer(null);
        setSelectedOptions([]);
        setNumericalAnswer('');
        setShowAnswer(false);
        setResult(null);
    }

    // Get question type text
    const getQuestionTypeText = (type) => {
        if (!type) return 'Question';

        switch (type) {
            case 'MCQ':
            case 'multiple-choice':
                return isMultipleSelection() ? 'Multiple Select Question' : 'Multiple Choice Question';
            case 'MSQ':
            case 'Multiple Select Question':
                return 'Multiple Select Question';
            case 'numerical':
                return 'Numerical Answer';
            case 'Descriptive':
                return 'Descriptive Question';
            case 'Match the following':
                return 'Match the Following';
            default:
                return type;
        }
    }

    // Move to next question
    const handleNext = () => {
        const currentPosition = questions.findIndex(q => q.id === currentIndex);
        if (currentPosition < questions.length - 1) {
            setCurrentIndex(questions[currentPosition + 1].id);
            resetQuestion();
        }
    }

    // Move to previous question
    const handlePrevious = () => {
        const currentPosition = questions.findIndex(q => q.id === currentIndex);
        if (currentPosition > 0) {
            setCurrentIndex(questions[currentPosition - 1].id);
            resetQuestion();
        }
    }

    // Skip current question
    const handleSkip = () => {
        handleNext();
    }

    if (!currentQuestion) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-gray-500">Loading questions...</p>
            </div>
        );
    }

    // Determine if we should show options
    const hasOptions = currentQuestion.options &&
        Array.isArray(currentQuestion.options) &&
        currentQuestion.options.length > 0;

    // Normalize difficulty for display - handle null case
    let normalizedDifficulty = 'unknown';
    if (currentQuestion.difficulty) {
        normalizedDifficulty = currentQuestion.difficulty.toLowerCase() === 'normal'
            ? 'medium'
            : currentQuestion.difficulty.toLowerCase();
    }

    // Get difficulty class names
    const getDifficultyClassNames = () => {
        if (!currentQuestion.difficulty) return 'bg-gray-100 text-gray-700';

        if (normalizedDifficulty === 'easy') return 'bg-green-100 text-green-700';
        if (normalizedDifficulty === 'medium') return 'bg-yellow-100 text-yellow-700';
        if (normalizedDifficulty === 'hard') return 'bg-red-100 text-red-700';

        return 'bg-gray-100 text-gray-700';
    }

    // Get difficulty display text
    const getDifficultyDisplayText = () => {
        if (!currentQuestion.difficulty) return 'Unknown';
        return normalizedDifficulty.charAt(0).toUpperCase() + normalizedDifficulty.slice(1);
    }

    // Redirect to explaination link
    const handleExplainationClick = (link) => {
        window.open(link, '_blank')
    }

    // Update the next button disabled state:
    const isLastQuestion = questions.findIndex(q => q.id === currentIndex) === questions.length - 1;

    const isFirstQuestion = questions.findIndex(q => q.id === currentIndex) === 0

    return (
        <motion.div
            className="max-w-3xl mx-auto rounded-xl shadow-sm border border-border-primary dark:border-border-primary-dark overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            {/* Question Header */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border-primary dark:border-border-primary-dark bg-gradient-to-r from-gray-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-800">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <h3 className="font-bold text-base sm:text-lg">
                        Question {questions.findIndex(q => q.id === currentIndex) + 1} of {questions.length}
                    </h3>
                    <div className="flex flex-wrap gap-2 sm:space-x-3 items-center">
                        <QuestionBookmark handleBookmark={handleBookmark} />
                        <QuestionTimer timer={timer} handleTimer={handleTimer} minutes={minutes} seconds={seconds} />
                        <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyClassNames()}`}>
                            {getDifficultyDisplayText()}
                        </span>
                        {currentQuestion.year && (
                            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                                GATE {currentQuestion.year}
                            </span>
                        )}
                    </div>
                </div>

                {/* Question type and marks */}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                    {currentQuestion.questionType && (
                        <span className="text-xs px-2 py-1 bg-indigo-50 text-indigo-600 rounded-full">
                            {getQuestionTypeText(currentQuestion.questionType)}
                        </span>
                    )}

                    {currentQuestion.marks && (
                        <span className="text-xs px-2 py-1 bg-purple-50 text-purple-600 rounded-full">
                            {currentQuestion.marks} Mark{currentQuestion.marks !== 1 ? 's' : ''}
                        </span>
                    )}

                    {isMultipleSelection() && (
                        <span className="text-xs px-2 py-1 bg-orange-50 text-orange-600 rounded-full">
                            Select all that apply
                        </span>
                    )}
                </div>
            </div>

            {/* Question Content */}
            <div className="p-4 sm:p-6">
                <div className="mb-4 sm:mb-6">
                    <div className="text-base md:text-lg">
                        {currentQuestion.question ? (
                            <MathRenderer text={currentQuestion.question} />
                        ) : (
                            <span>Question content unavailable</span>
                        )}
                    </div>
                </div>

                {/* Options - Only show if the question has options */}
                {hasOptions && (
                    <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                        {currentQuestion.options.map((option, index) => (
                            <motion.div
                                key={index}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                className={`p-4 border rounded-lg cursor-pointer transition-all 
                                    ${isOptionSelected(option) ? 'border-blue-500 bg-blue-50 dark:bg-blue-600' : 'border-gray-200 dark:border-zinc-700 hover:border-blue-200'}
                                    ${showAnswer && currentQuestion.correctAnswer && (
                                        (Array.isArray(currentQuestion.correctAnswer) &&
                                            currentQuestion.correctAnswer.includes(index)) ||
                                        option === currentQuestion.correctAnswer
                                    )
                                        ? 'border-green-500 bg-green-50 dark:bg-green-600'
                                        : showAnswer && isOptionSelected(option) && currentQuestion.correctAnswer && (
                                            (Array.isArray(currentQuestion.correctAnswer) &&
                                                !currentQuestion.correctAnswer.includes(index)) ||
                                            option !== currentQuestion.correctAnswer
                                        )
                                            ? 'border-red-500 bg-red-50 dark:bg-red-600'
                                            : ''
                                    }
                                `}
                                onClick={() => handleOptionSelect(option)}
                            >
                                <div className="flex items-center">
                                    {isMultipleSelection() ? (
                                        // Checkbox for multiple selection
                                        <div className={`w-5 h-5 border rounded flex items-center justify-center mr-3 
                                            ${isOptionSelected(option)
                                                ? 'border-blue-500 bg-blue-500'
                                                : 'border-gray-300 dark:border-gray-700'
                                            }`}
                                        >
                                            {isOptionSelected(option) && (
                                                <FaCheck className="text-xs" />
                                            )}
                                        </div>
                                    ) : (
                                        // Radio button for single selection
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 
                                            ${userAnswer === option
                                                ? 'border-blue-500 bg-blue-500'
                                                : 'border-gray-300 dark:border-gray-700'
                                            }`}
                                        >
                                            {userAnswer === option && (
                                                <div className="w-2 h-2 bg-white rounded-full"></div>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex-1">
                                        {option ? <MathRenderer text={option} /> : 'Option unavailable'}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Numerical Answer Input */}
                {isNumericalQuestion() && (
                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-2">
                            Enter your numerical answer:
                        </label>
                        <input
                            ref={numInputRef}
                            type="text"
                            className="w-full p-3 border border-border-primary dark:border-border-primary-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={numericalAnswer}
                            onChange={(e) => handleNumericalInputChange(e)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();

                                    handleShowAnswer(numInputRef.current.value)
                                }
                            }}
                            placeholder="Enter your answer"
                            disabled={showAnswer}
                        />
                        {showAnswer && (numericalAnswer === getCorrectAnswerText()) && (
                            <p className="mt-2 text-sm">
                                Correct answer: {getCorrectAnswerText()}
                            </p>
                        )}
                    </div>
                )}

                {/* Result Message */}
                {showAnswer && (
                    <ResultMessage
                        showAnswer={showAnswer}
                        result={result}
                        getCorrectAnswerText={getCorrectAnswerText}
                    />
                )}


                {/* Action Buttons */}
                <ActionButtons
                    selectedOptions={selectedOptions}
                    isFirstQuestion={isFirstQuestion}
                    isLastQuestion={isLastQuestion}
                    handleNext={handleNext}
                    handlePrevious={handlePrevious}
                    showAnswer={showAnswer}
                    handleShowAnswer={handleShowAnswer}
                    handleSkip={handleSkip}
                    handleExplainationClick={handleExplainationClick}
                    currentQuestion={currentQuestion}
                    questions={questions}
                />
            </div>

            {/* Question ID Badge and Tags */}
            <div className="px-4 sm:px-6 py-2 mb-10 md:mb-0 sm:py-3 border-t border-border-primary dark:border-border-primary-dark">
                <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center text-xs mb-2 sm:mb-0 gap-4">
                        <span>ID: {currentQuestion.id || 'Unknown'}</span>
                        <span>Subject: {subject.toUpperCase()}</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

export default QuestionCard;