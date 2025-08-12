// 1. Core and external library imports
// React and router stuff first, pretty standard.
import React, { useState, useEffect, useRef, useContext } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa6';

// 2. Custom hook imports (application logic)
// All the complex logic is abstracted into these hooks.
// Makes this component way cleaner.
import { useQuestionTimer } from '../../hooks/useQuestionTimer';
import { useQuestionState } from '../../hooks/useQuestionState';
import useQuestionNav from '../../hooks/useQuestionNav';
import useKeyboardShortcuts from '../../hooks/useKeyboardShortcuts';
import useAnswerFlow from '../../hooks/useAnswerFlow';

// 3. Context imports (global state)
// Grabbing shared state from across the app. No prop drilling!
import AppSettingContext from '../../context/AppSettingContext';
import AuthContext from '../../context/AuthContext';
import StatsContext from '../../context/StatsContext';

// 4. Utility and helper function imports
// Simple, reusable functions that don't need to be hooks.
import { getUserProfile } from '../../helper';
import { getCorrectAnswerText, isNumericalQuestion } from '../../utils/questionUtils';

// 5. Component imports (UI pieces)
// Breaking the UI down into smaller, dumber components.
import QuestionHeader from '../../components/Practice/QuestionCard/QuestionHeader';
import QuestionContent from '../../components/Practice/QuestionCard/QuestionContent';
import QuestionBadge from '../../components/Practice/QuestionCard/QuestionBadge';
import ActionButtons from '../../components/Practice/QuestionCard/ActionButtons';
import ResultMessage from '../../components/Practice/QuestionCard/ResultMessage';
import ModernLoader from '../../components/ModernLoader';

// This component is the main event for the practice session. It's a "controller" component
// that pulls together a bunch of hooks and smaller UI components to create the full question view.
const QuestionCard = () => {
    // --- Initial Setup & Data Sourcing ---

    // Get user profile. If not logged in, create a dummy user object.
    // This is so the app can still work for guests, might need to revisit this for real guest sessions.
    const profile = getUserProfile();
    let user;
    if (profile) {
        user = profile;
    } else {
        user = {
            id: 1,
        }
    }

    // All the router hooks to understand where we are and how to navigate.
    const navigate = useNavigate(); // To move to other pages
    const location = useLocation(); // To get data passed in state (the filtered question list)
    const [searchParams] = useSearchParams(); // To read the URL query string (?diff=Easy etc.)
    const { subject, qid } = useParams(); // To get the subject and question ID from the URL

    // The question ID from the URL. Default to 0 if it's not there for some reason.
    const questionId = qid ? qid : 0;

    // This is the key to making next/prev work seamlessly.
    // The QuestionList passes the *entire* filtered list of questions in the navigation state.
    // So, no need to re-fetch or re-filter here. Big performance win.
    const passed = location.state?.questions
    const filteredQuestions = Array.isArray(passed) && passed.length ? passed : [];

    // Keep the original query string around so we can go back to the list with the same filters applied.
    const qs = searchParams.toString();

    // Find the specific question object we need to display from the passed list.
    // Using String() on both sides to avoid any pesky type mismatches (URL params are always strings).
    const currentQuestion = filteredQuestions.find(q => String(q.id) === String(questionId)) || filteredQuestions[0]

    // This state tracks the current question ID. It's needed for the navigation hook.
    // It gets updated by the navigation hook itself when moving next/prev.
    const [currentIndex, setCurrentIndex] = useState(questionId)

    // --- Contexts & Refs ---

    // Grab the updateStats function from context to record user progress.
    const { updateStats } = useContext(StatsContext);
    // State for the "View Explanation" link.
    const [questionLink, setQuestionLink] = useState("");
    // A ref for the numerical input, useful for focusing or getting its value directly if needed.
    const numInputRef = useRef(null);


    // Get app settings (like auto-timer) and login status from their respective contexts.
    const { settings } = useContext(AppSettingContext)
    const { isLogin } = useContext(AuthContext)

    // --- Core Logic via Custom Hooks ---

    // Initialize the timer. It gets the settings and the current question to decide if it should run.
    const { isActive: isTimerActive, time: timeTaken, toggle: toggleTimer, reset: resetTimer } = useQuestionTimer(settings?.autoTimer, currentQuestion);

    // This hook is a beast. It handles everything about the user's *answer*.
    // What option they picked, what they typed, if the answer is shown, the result, and how to reset it all.
    const {
        userAnswerIndex, selectedOptionIndices, numericalAnswer,
        showAnswer, setShowAnswer, result, setResult,
        resetState: resetQuestionState, handleOptionSelect, handleNumericalInputChange
    } = useQuestionState(currentQuestion);

    // --- Side Effects (useEffect) ---

    // The "deep link" guardian. If someone lands on this URL directly without the question list
    // in the location state, they get bounced back to the list page with the filters applied.
    // This prevents the card from crashing with no data.
    useEffect(() => {
        if (!filteredQuestions.length) {
            navigate(`/practice/${subject}?${qs}`, { replace: true })
        }
    }, [filteredQuestions.length, subject, qs, navigate])

    // This effect is for when the user navigates to a *new* question.
    // It makes sure we reset all the state from the previous question (like selected answers).
    useEffect(() => {
        setCurrentIndex(questionId) // Sync the currentIndex state
        resetQuestionState() // And wipe the slate clean for the new question.
    }, [questionId, resetQuestionState]) // Runs only when the ID changes.

    // Simple effect to update the explanation link whenever the question changes.
    useEffect(() => {
        // Guard against currentQuestion being null/undefined on the first render cycle.
        if (currentQuestion) {
            setQuestionLink(currentQuestion.explanation)
        }
    }, [currentQuestion])

    // The answer submission logic. This hook takes all the data and returns the functions
    // to trigger the submission flow.
    const { handleShowAnswer, handleSubmit } = useAnswerFlow({
        currentQuestion,
        selectedOptionIndices,
        numericalAnswer,
        timeTaken,
        user,
        isLogin,
        updateStats,
        setShowAnswer,
        setResult,
        resetTimer,
    showAnswer,
    });


    // The navigation logic. This hook knows about the filtered list and handles
    // finding the next/prev question and updating the URL.
    const { isFirst, isLast, handleNext, handlePrevious } = useQuestionNav({
        filteredQuestions,
        subject,
        qs,
        currentIndex,
        setCurrentIndex,
        navigate,
        resetQuestionState,
        toggleTimer,
    });

    // --- Derived State & Event Handlers ---

    // A simple boolean to make conditional rendering of options cleaner.
    // The '!!' and optional chaining make sure it doesn't crash if currentQuestion is missing.
    const hasOptions = !!(currentQuestion && currentQuestion.options &&
        Array.isArray(currentQuestion.options) &&
        currentQuestion.options.length > 0);



    // Simple handler to open the explanation link in a new tab.
    const handleExplainationClick = (link) => {
        window.open(link, '_blank')
    }

    // Bind keyboard shortcuts. The hook takes an object of functions to call.
    // I'm passing the handlers from the other hooks directly to it.
    // This keeps all the keyboard logic in one place.
    useKeyboardShortcuts({
        onPrev: handlePrevious,
        onNext: handleNext,
        onShowAnswer: handleShowAnswer,
        onExplain: () => handleExplainationClick(questionLink),
    }, [currentQuestion, questionLink]); // Re-bind if the question changes.

    // These are just aliases from the useQuestionNav hook for cleaner prop names.
    const isLastQuestion = isLast;
    const isFirstQuestion = isFirst

    // --- Render Logic ---

    // Loading state. If currentQuestion hasn't been found yet, show a message.
    // This can happen for a split second before the deep-link redirect kicks in.
    if (!currentQuestion) {
        return (
            <div className="flex items-center justify-center h-64">
                <ModernLoader />
            </div>
        );
    }

    // Handler for the "Back to Questions" button.
    const handleBack = () => {
        navigate(`/practice/${subject}?${qs}`)
    }

    return (
        // The main container div
        <div className='mx-auto max-w-3xl mt-4 p-6'>
            <div className="flex items-center mb-4 sm:mb-6 dark:text-white">
                <button
                    onClick={handleBack}
                    className="flex items-center hover:text-blue-500 transition-colors cursor-pointer"
                >
                    <FaArrowLeft className="mr-2" />
                    <span>Back to Questions</span>
                </button>
            </div>
            {/* The main card container with scrolling behavior. */}
            <div
                className="max-w-3xl mx-auto h-screen pb-60 mt-6 rounded-xl shadow-sm overflow-y-scroll dark:text-white border-border-primary dark:border-border-primary-dark"
            >
                {/* Pass all the necessary data down to the header component. */}
                <QuestionHeader subject={subject} questions={filteredQuestions} currentIndex={currentIndex} currentQuestion={currentQuestion} questionId={questionId} resetTimer={resetTimer} isTimerActive={isTimerActive} />

                {/* The main content area */}
                <div className="p-4 sm:p-6">
                    {/* Renders the question text and the multiple-choice options */}
                    <QuestionContent
                        currentQuestion={currentQuestion}
                        hasOptions={hasOptions}
                        showAnswer={showAnswer}
                        selectedOptionIndices={selectedOptionIndices}
                        userAnswerIndex={userAnswerIndex}
                        onOptionSelect={handleOptionSelect}
                        result={result}
                    />

                    {/* Conditionally render the numerical input field only for numerical questions. */}
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

                    {/* Conditionally render the result message only after the answer is shown. */}
                    {showAnswer && (
                        <ResultMessage
                            showAnswer={showAnswer}
                            result={result}
                            getCorrectAnswerText={getCorrectAnswerText}
                            currentQuestion={currentQuestion}
                        />
                    )}


                    {/* The main action buttons (prev, next, submit). Pass down all the handlers. */}
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
                        questions={filteredQuestions}
                    />
                </div>

                {/* The little badge at the bottom showing subject and current question ID. */}
                <QuestionBadge currentQuestion={currentQuestion} subject={subject} />
            </div>
        </div>

    );
}

export default QuestionCard;