import React, { useEffect, useRef } from 'react';
import { ArrowLeft } from '@phosphor-icons/react';

// Types
import type { Question } from '../../types/question';
import type { Database } from '../../types/supabase'; // Needed for PeerStats type

// Utils
import { isNumericalQuestion, getCorrectAnswerText } from '../../utils/questionUtils';
import QuestionHeader from '@/components/QuestionCard/QuestionHeader';
import QuestionContent from '@/components/QuestionCard/QuestionContent';
import ResultMessage from '@/components/QuestionCard/ResultMessage';
import QuestionPeerStats from '@/components/QuestionCard/QuestionPeerStats';
import ActionButtons from '@/components/QuestionCard/ActionButtons';
import QuestionBadge from '@/components/QuestionCard/QuestionBadge';

// Child Components

// ----------------------------------------------------------------------

type TimerProps = {
    minutes: string;
    seconds: string;
    isActive: boolean;
    onToggle: () => void;
};

type PeerStatsProps = {
    loading: boolean;
    message: string | null;
    data: Database['public']['Tables']['question_peer_stats']['Row'] | null;
};

type QuestionCardProps = {
    // Data
    question: Question;
    totalQuestions: number;
    questionNumber: number;

    // User State
    userAnswerIndex: number | null;
    selectedOptionIndices: number[];
    numericalAnswer: number | null;

    // Flow State
    showAnswer: boolean;
    result: 'correct' | 'incorrect' | 'unattempted';

    // Complex Sub-props
    timer: TimerProps;
    peerStats: PeerStatsProps;

    // Handlers
    onOptionSelect: (index: number) => void;
    onNumericalChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onShowAnswer: () => void;
    handleSubmit: () => void;
    onNext: () => void;
    onPrev: () => void;
    onReport: () => void;
    onShare: () => void;
    onBookmark: () => void;
    onExplanationClick: () => void;
    onBack: () => void;

    // Navigation Flags
    isFirst: boolean;
    isLast: boolean;
};

const QuestionCard = ({
    question,
    totalQuestions,
    questionNumber,
    userAnswerIndex,
    selectedOptionIndices,
    numericalAnswer,
    showAnswer,
    result,
    timer,
    peerStats,
    onOptionSelect,
    onNumericalChange,
    onShowAnswer,
    handleSubmit,
    onNext,
    onPrev,
    onReport,
    onShare,
    onBookmark,
    onExplanationClick,
    onBack,
    isFirst,
    isLast,
}: QuestionCardProps) => {
    const numInputRef = useRef<HTMLInputElement>(null);
    const pageRef = useRef<HTMLDivElement>(null);

    // Derived: Check if options exist to conditionally render the options list
    const hasOptions = !!(
        question.options &&
        Array.isArray(question.options) &&
        question.options.length > 0
    );

    // Derived: Get correct answer text for the numerical display
    const correctAnswerText = getCorrectAnswerText(question);

    // effect to scroll to top when user go to next or previous question
    useEffect(() => {
        if (pageRef.current) pageRef.current.scrollTop = 0;
    }, [questionNumber]);

    return (
        <div className="mx-auto max-w-5xl 2xl:max-w-7xl mt-4 p-6">
            {/* Top Back Button */}
            <div className="flex items-center mb-4 sm:mb-6 dark:text-white">
                <button
                    onClick={onBack}
                    className="flex items-center hover:text-blue-500 transition-colors cursor-pointer focus:outline-none"
                >
                    <ArrowLeft className="mr-2" />
                    <span>Back</span>
                </button>
            </div>

            {/* Main Card Container */}
            <div
                ref={pageRef}
                className="flex-1 max-w-5xl 2xl:max-w-7xl mx-auto h-dvh pb-60 mt-6 shadow-sm  dark:text-white overflow-y-scroll border border-border-primary dark:border-border-primary-dark bg-white dark:bg-zinc-900"
            >
                {/* 1. Header Section */}
                <QuestionHeader
                    questionNumber={questionNumber}
                    totalQuestions={totalQuestions}
                    question={question}
                    timer={timer}
                    onReport={onReport}
                    onShare={onShare}
                    onBookmark={onBookmark}
                />

                <div className="p-4 sm:p-6">
                    {/* 2. Content Section (Text & Options) */}
                    <QuestionContent
                        currentQuestion={question}
                        hasOptions={hasOptions}
                        showAnswer={showAnswer}
                        selectedOptionIndices={selectedOptionIndices}
                        userAnswerIndex={userAnswerIndex}
                        onOptionSelect={onOptionSelect}
                    />

                    {/* 3. Numerical Input Section (Conditional) */}
                    {isNumericalQuestion(question) && (
                        <div className="mb-6">
                            <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                                Enter your numerical answer:
                            </label>
                            <input
                                ref={numInputRef}
                                type="number"
                                className="w-full p-3 border border-border-primary dark:border-border-primary-dark focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-zinc-800 dark:text-white"
                                value={numericalAnswer ?? ''}
                                onChange={onNumericalChange}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        onShowAnswer();
                                    }
                                }}
                                placeholder="Enter your answer"
                                disabled={showAnswer}
                            />
                            {showAnswer && numericalAnswer === Number(correctAnswerText) && (
                                <p className="mt-2 text-sm text-green-600">
                                    Correct answer: {correctAnswerText}
                                </p>
                            )}
                        </div>
                    )}

                    {/* 4. Result Message */}
                    {showAnswer && (
                        <ResultMessage
                            showAnswer={showAnswer}
                            result={result}
                            currentQuestion={question}
                        />
                    )}

                    {/* 5. Peer Statistics */}
                    {showAnswer && (
                        <QuestionPeerStats
                            loading={peerStats.loading}
                            message={peerStats.message}
                            data={peerStats.data}
                        />
                    )}

                    {/* 6. Action Buttons */}
                    <ActionButtons
                        isFirstQuestion={isFirst}
                        isLastQuestion={isLast}
                        handleNext={onNext}
                        handlePrevious={onPrev}
                        showAnswer={showAnswer}
                        handleShowAnswer={onShowAnswer}
                        handleSubmit={handleSubmit}
                        handleExplainationClick={onExplanationClick}
                        currentQuestion={question}
                    />
                </div>

                {/* 7. Footer Badge */}
                <QuestionBadge currentQuestion={question} />
            </div>
        </div>
    );
};

export default QuestionCard;
