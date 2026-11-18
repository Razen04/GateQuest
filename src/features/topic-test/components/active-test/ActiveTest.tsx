import { CalculatorIcon, XIcon } from '@phosphor-icons/react';
import React, { useState } from 'react';
import QuestionContent from '@/features/questions/components/QuestionCard/QuestionContent';
import {
    isMultipleSelection,
    isNumericalQuestion,
} from '@/features/questions/utils/questionUtils';
import useTest from '@/features/topic-test/hooks/test-engine/useTest';
import { Button } from '@/shared/components/ui/button';
import QuestionPalette from './QuestionPallete';
import TestControlBar from './TestControlBar';
import TestHeader from './TestHeader';

const ActiveTest = () => {
    const {
        navigation,
        answers,
        timer,
        handleNext,
        handlePrev,
        handleJumpTo,
        handleSubmit,
        questions,
        isMockMode,
        mockLabel,
        finishUnlockAt,
    } = useTest();
    const [isPaletteOpen, setIsPaletteOpen] = useState(false);
    const [showCalc, setShowCalc] = useState(false);

    const currentIndex = navigation.currentIndex;
    const totalQuestions = questions?.length || 0;
    const currentQ = questions?.[currentIndex];

    if (!currentQ) return null;

    const currentAttempt = answers.answers.get(currentQ.id);
    const isFirst = currentIndex === 0;
    const isLast = currentIndex === totalQuestions - 1;

    const realIndex = questions.findIndex((q) => q.id === currentQ.id);
    const attemptOrder = realIndex + 1;
    const isMSQ = isMultipleSelection(currentQ);
    const isNAT = isNumericalQuestion(currentQ);

    const msqSelection: number[] =
        isMSQ && Array.isArray(currentAttempt?.user_answer)
            ? currentAttempt?.user_answer
            : [];

    const mcqSelection: number | null =
        !isMSQ && !isNAT && typeof currentAttempt?.user_answer === 'number'
            ? currentAttempt?.user_answer
            : null;

    const rawVal = currentAttempt?.user_answer;
    const natValue =
        typeof rawVal === 'number' || typeof rawVal === 'string' ? rawVal : '';

    const handleOptionClick = (optionIndex: number) => {
        if (isMSQ) {
            const currentArr = Array.isArray(currentAttempt?.user_answer)
                ? [...currentAttempt!.user_answer]
                : [];
            const existsAt = currentArr.indexOf(optionIndex);
            if (existsAt > -1) currentArr.splice(existsAt, 1);
            else currentArr.push(optionIndex);
            currentArr.sort((a, b) => a - b);
            answers.selectOption(currentQ.id, currentArr, attemptOrder);
        } else {
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

    const allAttempts = Array.from(answers.answers.values());
    const answeredCount = allAttempts.filter(
        (a) => a.status === 'answered'
    ).length;
    const markedCount = allAttempts.filter((a) => a.marked_for_review).length;
    const visitedNotAnswered = allAttempts.filter(
        (a) => a.status === 'viewed'
    ).length;
    const unvisitedCount =
        questions.length - (answeredCount + visitedNotAnswered);

    return (
        <div className="flex flex-col h-full overflow-hidden text-foreground">
            <TestHeader
                timeDisplay={timer.timeDisplay}
                questionStatus={`${currentIndex + 1} of ${totalQuestions}`}
                onEndTest={() => handleSubmit()}
                isMockMode={isMockMode}
                title={isMockMode ? mockLabel : 'Custom Test'}
                finishUnlockAt={finishUnlockAt}
            />

            <div className="flex flex-1 overflow-hidden relative">
                <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex justify-between items-center pb-4">
                            <div className="w-fit flex gap-2 font-bold items-center mb-2 text-white">
                                <p className="bg-chart-1 p-2">
                                    Marks: {currentQ.marks}
                                </p>
                                {!isMSQ && !isNAT && (
                                    <p className="bg-destructive p-2">
                                        Negative Marks: {currentQ.marks}/3
                                    </p>
                                )}
                            </div>

                            <div className="relative">
                                <Button
                                    size="icon-lg"
                                    onClick={() => setShowCalc((prev) => !prev)}
                                    className={`px-2 py-1 rounded-none text-white ${showCalc ? 'bg-destructive' : 'bg-chart-1'}`}
                                >
                                    {showCalc ? (
                                        <XIcon size={32} />
                                    ) : (
                                        <CalculatorIcon size={32} />
                                    )}
                                </Button>

                                {showCalc && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-40 bg-black/30"
                                            onClick={() => setShowCalc(false)}
                                        />
                                        <div className="hidden md:block absolute right-0 mt-2 z-50">
                                            <div
                                                className="relative w-[475px] h-[350px] bg-popover shadow-2xl overflow-hidden"
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                            >
                                                <iframe
                                                    src="https://www.gatexplore.com/scientific-calculator/calculator.html"
                                                    className="w-full h-full"
                                                />
                                            </div>
                                        </div>
                                        <div className="md:hidden fixed inset-x-0 bottom-0 z-50 flex items-end">
                                            <div
                                                className="w-full h-[60vh] bg-popover overflow-hidden relative"
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                            >
                                                <iframe
                                                    src="https://www.gatexplore.com/scientific-calculator/calculator.html"
                                                    className="w-full h-full"
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <QuestionContent
                            env="Test"
                            currentQuestion={currentQ}
                            hasOptions={!isNAT}
                            showAnswer={false}
                            selectedOptionIndices={msqSelection}
                            userAnswerIndex={mcqSelection}
                            onOptionSelect={handleOptionClick}
                        />

                        {isNAT && (
                            <div className="mt-6 p-4 border bg-muted border-border">
                                <label className="block text-sm font-semibold mb-3 text-foreground">
                                    Your Numerical Answer:
                                </label>
                                <input
                                    type="number"
                                    className="w-full p-3 text-lg border bg-background border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-chart-1 focus:border-chart-1"
                                    placeholder="Enter value..."
                                    value={natValue}
                                    onChange={handleNumericalChange}
                                />
                            </div>
                        )}
                    </div>
                </main>

                <aside className="hidden lg:block w-80 border-l border-border h-full overflow-y-auto bg-muted/50">
                    <QuestionPalette
                        questions={questions}
                        currentIndex={currentIndex}
                        markedForReview={answers.isMarkedForReview}
                        isAnswered={answers.isAnswered}
                        isVisited={answers.isVisited}
                        isOpen={true}
                        onToggle={() => {}}
                        onJumpTo={handleJumpTo}
                        answeredCount={answeredCount}
                        markedCount={markedCount}
                        visitedNotAnswered={visitedNotAnswered}
                        unvisitedCount={unvisitedCount}
                    />
                </aside>

                <div className="md:hidden">
                    <QuestionPalette
                        questions={questions}
                        currentIndex={currentIndex}
                        markedForReview={answers.isMarkedForReview}
                        isAnswered={answers.isAnswered}
                        isVisited={answers.isVisited}
                        isOpen={isPaletteOpen}
                        onToggle={() => setIsPaletteOpen(false)}
                        onJumpTo={handleJumpTo}
                        answeredCount={answeredCount}
                        markedCount={markedCount}
                        visitedNotAnswered={visitedNotAnswered}
                        unvisitedCount={unvisitedCount}
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
