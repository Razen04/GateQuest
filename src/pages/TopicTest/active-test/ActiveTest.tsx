import React, { useState } from 'react';
import useTest from '@/hooks/test-engine/useTest';
import QuestionContent from '@/components/QuestionCard/QuestionContent';
import { isMultipleSelection, isNumericalQuestion } from '@/utils/questionUtils';

// Sub-components
import TestHeader from './TestHeader';
import TestControlBar from './TestControlBar';
import QuestionPalette from './QuestionPallete';

const ActiveTest = () => {
    const { navigation, answers, timer, handleNext, handlePrev, handleSubmit, questions } =
        useTest();
    const [isPaletteOpen, setIsPaletteOpen] = useState(false);

    // Derived States
    const currentIndex = navigation.currentIndex;
    const totalQuestions = questions?.length || 0;
    const currentQ = questions?.[currentIndex];

    // If data isn't loaded yet, show nothing
    if (!currentQ) return null;

    const currentAttempt = answers.answers.get(currentQ.id);
    const isFirst = currentIndex === 0;
    const isLast = currentIndex === totalQuestions - 1;

    // useTestAnswer requires this for saving to DB
    // Find the permanent index of this question in the master list
    const realIndex = questions.findIndex((q) => q.id === currentQ.id);
    const attemptOrder = realIndex + 1;
    // Question Type Logic
    const isMSQ = isMultipleSelection(currentQ);
    const isNAT = isNumericalQuestion(currentQ);

    // Data Normalization
    // MSQ: Expects array of numbers. If undefined, give empty array.
    const msqSelection: number[] =
        isMSQ && Array.isArray(currentAttempt?.user_answer) ? currentAttempt?.user_answer : [];

    // MCQ: Expects single number. If undefined or array, give null.
    const mcqSelection: number | null =
        !isMSQ && !isNAT && typeof currentAttempt?.user_answer === 'number'
            ? currentAttempt?.user_answer
            : null;

    // NAT: Expects string or number.
    // Get the raw value
    const rawVal = currentAttempt?.user_answer;

    // Normalize: If it's a number or string, use it. If it's an array or null, use empty string.
    const natValue = typeof rawVal === 'number' || typeof rawVal === 'string' ? rawVal : '';

    // Handlers
    const handleOptionClick = (optionIndex: number) => {
        if (isMSQ) {
            // MSQ Logic: Toggle the index in the array
            const currentArr = Array.isArray(currentAttempt?.user_answer)
                ? [...currentAttempt!.user_answer]
                : [];

            const existsAt = currentArr.indexOf(optionIndex);
            if (existsAt > -1) {
                currentArr.splice(existsAt, 1); // Remove
            } else {
                currentArr.push(optionIndex); // Add
            }

            // Sort for consistency
            currentArr.sort((a, b) => a - b);

            answers.selectOption(currentQ.id, currentArr, attemptOrder);
        } else {
            // MCQ Logic: Just set the value
            answers.selectOption(currentQ.id, optionIndex, attemptOrder);
        }
    };

    const handleNumericalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        const numVal = val === '' ? null : parseFloat(val);
        answers.selectOption(currentQ.id, numVal, attemptOrder);
    };

    const handleClearResponse = () => {
        answers.selectOption(currentQ.id, null, attemptOrder);
    };

    const handleMarkReview = () => {
        answers.toggleReview(currentQ.id, attemptOrder);
    };

    const isReviewMarked = answers.isMarkedForReview(currentQ.id);

    return (
        <div className="flex flex-col h-full overflow-hidden text-slate-900 dark:text-slate-100">
            <TestHeader
                timeDisplay={timer.timeDisplay}
                questionStatus={`${currentIndex + 1} of ${totalQuestions}`}
                onEndTest={handleSubmit}
            />

            <div className="flex flex-1 overflow-hidden relative">
                <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24">
                    <div className="max-w-4xl mx-auto">
                        {/* Render Text & Options */}
                        <QuestionContent
                            currentQuestion={currentQ}
                            hasOptions={!isNAT}
                            showAnswer={false}
                            selectedOptionIndices={msqSelection}
                            userAnswerIndex={mcqSelection}
                            onOptionSelect={handleOptionClick}
                        />

                        {/* Render Numerical Input (Conditionally) */}
                        {isNAT && (
                            <div className="mt-6 p-4 border bg-gray-50 dark:bg-zinc-900 border-gray-200 dark:border-zinc-800">
                                <label className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
                                    Your Numerical Answer:
                                </label>
                                <input
                                    type="number"
                                    className="w-full p-3 text-lg border 
                                             focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                                             dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
                                    placeholder="Enter value..."
                                    value={natValue}
                                    onChange={handleNumericalChange}
                                />
                            </div>
                        )}
                    </div>
                </main>

                <aside className="hidden lg:block w-80 border-l border-gray-200 dark:border-zinc-800 h-full overflow-y-auto bg-gray-50/50 dark:bg-zinc-900/50">
                    <QuestionPalette
                        questions={questions}
                        currentIndex={currentIndex}
                        markedForReview={answers.isMarkedForReview}
                        isAnswered={answers.isAnswered}
                        isOpen={true} // always open on desktop
                        onToggle={() => {}}
                        onJumpTo={(idx) => navigation.jumpTo(idx)}
                    />
                </aside>

                {/* MOBILE PALETTE */}
                <div className="md:hidden">
                    <QuestionPalette
                        questions={questions}
                        currentIndex={currentIndex}
                        markedForReview={answers.isMarkedForReview}
                        isAnswered={answers.isAnswered}
                        isOpen={isPaletteOpen}
                        onToggle={() => setIsPaletteOpen(false)}
                        onJumpTo={(idx) => navigation.jumpTo(idx)}
                    />
                </div>
            </div>

            <TestControlBar
                isFirst={isFirst}
                isLast={isLast}
                isReviewMarked={isReviewMarked}
                onNext={handleNext}
                onPrev={handlePrev}
                onMarkForReview={handleMarkReview}
                onClearResponse={handleClearResponse}
                onTogglePalette={() => setIsPaletteOpen(!isPaletteOpen)}
                isPaletteOpen={isPaletteOpen}
            />
        </div>
    );
};

export default ActiveTest;
