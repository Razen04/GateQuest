import React, { useState, useEffect, useRef, useContext } from 'react'
import { motion } from 'framer-motion'
import ActionButtons from './ActionButtons'
import ResultMessage from './ResultMessage'
import AppSettingContext from '../../../context/AppSettingContext'
import { getUserProfile } from '../../../helper'
import AuthContext from '../../../context/AuthContext'
import StatsContext from '../../../context/StatsContext'
import { getCorrectAnswerText, isNumericalQuestion } from '../../../utils/questionUtils'
import { useQuestionTimer } from '../../../hooks/useQuestionTimer'
import { useQuestionState } from '../../../hooks/useQuestionState'
import QuestionHeader from './QuestionHeader'
import QuestionContent from './QuestionContent'
import QuestionBadge from './QuestionBadge'
import { submitAndRecordAnswer } from '../../../utils/answerHandler'

const QuestionCard = ({ subject, questions, questionId = 0 }) => {

    const profile = getUserProfile();
    let user;
    if (profile) {
        user = profile;
    } else {
        user = {
            id: 1,
        }
    }


    const { updateStats } = useContext(StatsContext);
    const [currentIndex, setCurrentIndex] = useState(questionId)
    const [questionLink, setQuestionLink] = useState("");
    const numInputRef = useRef(null);
    const [userRecord, setUserRecord] = useState(null);
    const currentQuestion = questions.find(q => q.id === currentIndex) || questions[0]


    const { settings } = useContext(AppSettingContext)
    const { isLogin } = useContext(AuthContext)

    const { time: timeTaken, toggle: toggleTimer, stop: stopTimer } = useQuestionTimer(settings?.autoTimer, currentQuestion);

    // All answer/selection/result state is handled by this hook.
    const {
        userAnswerIndex, selectedOptionIndices, numericalAnswer, setNumericalAnswer,
        showAnswer, setShowAnswer, result, setResult,
        resetState: resetQuestionState, handleOptionSelect
    } = useQuestionState(currentQuestion);

    // Load questions based on subject and chapter
    useEffect(() => {
        // Reset state when subject changes
        setCurrentIndex(questionId)
        resetQuestionState()
    }, [subject, questionId])

    // Set question link after every question
    useEffect(() => {
        setQuestionLink(currentQuestion.explanation)
    }, [currentQuestion])

    useEffect(() => {
        setUserRecord({
            user_id: user.id,
            question_id: currentQuestion.id,
            subject: currentQuestion.subject,
            was_correct: null,
            time_taken: 0,
            attempted_at: new Date().toISOString(),
            attempt_number: 0
        })
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


    // Handle numerical input change
    const handleNumericalInputChange = (e) => {
        if (showAnswer) return;
        setNumericalAnswer(e.target.value);
    }

    // Handle show answer
    const handleShowAnswer = async () => {
        if (showAnswer) return;

        console.log("selectedOptionIndices: ", selectedOptionIndices)

        stopTimer();
        setShowAnswer(true);

        const resultStatus = await submitAndRecordAnswer({
            currentQuestion,
            selectedOptionIndices,
            numericalAnswer,
            timeTaken,
            user,
            isLogin,
            updateStats
        });

        console.log("Result: ", resultStatus)

        setResult(resultStatus)
    }


    // Move to next question
    const handleNext = () => {
        const currentPosition = questions.findIndex(q => q.id === currentIndex);
        if (currentPosition < questions.length - 1) {
            setCurrentIndex(questions[currentPosition + 1].id);
            resetQuestionState();
            toggleTimer()
        }
    }

    // Move to previous question
    const handlePrevious = () => {
        const currentPosition = questions.findIndex(q => q.id === currentIndex);
        if (currentPosition > 0) {
            setCurrentIndex(questions[currentPosition - 1].id);
            resetQuestionState();
            toggleTimer()
        }
    }

    // Skip current question
    const handleSubmit = () => {
        stopTimer();
        handleShowAnswer();
    }

    // Determine if we should show options
    const hasOptions = currentQuestion.options &&
        Array.isArray(currentQuestion.options) &&
        currentQuestion.options.length > 0;



    // Redirect to explaination link
    const handleExplainationClick = (link) => {
        window.open(link, '_blank')
    }

    // Update the next button disabled state:
    const isLastQuestion = questions.findIndex(q => q.id === currentIndex) === questions.length - 1;

    const isFirstQuestion = questions.findIndex(q => q.id === currentIndex) === 0

    if (!currentQuestion) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-gray-500">Loading questions...</p>
            </div>
        );
    }

    return (
        <motion.div
            className="max-w-3xl mx-auto rounded-xl shadow-sm border border-border-primary dark:border-border-primary-dark overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            {/* Question Header */}
            <QuestionHeader subject={subject} questions={questions} currentIndex={currentIndex} currentQuestion={currentQuestion} questionId={questionId} />

            {/* Question Content */}
            <div className="p-4 sm:p-6">
                <QuestionContent
                    currentQuestion={currentQuestion}
                    hasOptions={hasOptions}
                    showAnswer={showAnswer}
                    selectedOptionIndices={selectedOptionIndices}
                    userAnswerIndex={userAnswerIndex}
                    onOptionSelect={handleOptionSelect}
                    result={result}
                />

                {/* Numerical Answer Input */}
                {isNumericalQuestion(currentQuestion) && (
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
                        {showAnswer && (numericalAnswer === getCorrectAnswerText(currentQuestion)) && (
                            <p className="mt-2 text-sm">
                                Correct answer: {getCorrectAnswerText(currentQuestion)}
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
                        currentQuestion={currentQuestion}
                    />
                )}


                {/* Action Buttons */}
                <ActionButtons
                    selectedOptions={selectedOptionIndices}
                    isFirstQuestion={isFirstQuestion}
                    isLastQuestion={isLastQuestion}
                    handleNext={handleNext}
                    handlePrevious={handlePrevious}
                    showAnswer={showAnswer}
                    handleShowAnswer={handleShowAnswer}
                    handleSubmit={handleSubmit}
                    handleExplainationClick={handleExplainationClick}
                    currentQuestion={currentQuestion}
                    questions={questions}
                />
            </div>

            <QuestionBadge currentQuestion={currentQuestion} subject={subject} />
        </motion.div>
    );
}

export default QuestionCard;