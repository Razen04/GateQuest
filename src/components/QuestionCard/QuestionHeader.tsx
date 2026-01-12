import {
    getDifficultyClassNames,
    getQuestionTypeText,
    isMultipleSelection,
} from '../../utils/questionUtils.js';
import QuestionTimer from './QuestionTimer.js';
import QuestionBookmark from './QuestionBookmark.js';
import type { Question } from '../../types/question.ts';
import { Warning, ShareFat } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button.tsx';

type TimerProps = {
    minutes: string;
    seconds: string;
    isActive: boolean;
    onToggle: () => void;
};

type QuestionHeaderProps = {
    questionNumber: number;
    totalQuestions: number;
    question: Question;
    timer?: TimerProps | undefined;
    onReport: () => void;
    onShare: () => void;
    onBookmark: () => void;
    marked?: boolean | undefined;
};

const QuestionHeader = ({
    questionNumber,
    totalQuestions,
    question,
    timer,
    onReport,
    onShare,
    onBookmark,
    marked,
}: QuestionHeaderProps) => {
    // Helper: Normalize difficulty text for display
    const getDifficultyDisplayText = () => {
        if (!question.difficulty) return 'Unknown';
        const normalized =
            question.difficulty.toLowerCase() === 'normal'
                ? 'medium'
                : question.difficulty.toLowerCase();
        return normalized.charAt(0).toUpperCase() + normalized.slice(1);
    };

    return (
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border-primary dark:border-border-primary-dark bg-gradient-to-r from-gray-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-800">
            {/* Top Row: Title + Right Controls */}
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
                <h1 className="font-bold text-xl dark:text-gray-100">
                    Question {questionNumber} of {totalQuestions}
                </h1>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Bookmark (Pure Component) */}
                    <QuestionBookmark onClick={onBookmark} />

                    {/* Timer props shown conditionally for test review mode */}
                    {timer && (
                        <QuestionTimer
                            minutes={timer.minutes}
                            seconds={timer.seconds}
                            isActive={timer.isActive}
                            onToggle={timer.onToggle}
                        />
                    )}

                    {/* Difficulty Badge */}
                    <span
                        className={`text-sm px-2 py-1 ${getDifficultyClassNames(question.difficulty)}`}
                    >
                        {getDifficultyDisplayText()}
                    </span>

                    {/* Year Badge */}
                    {question.year && (
                        <span className="text-sm px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100">
                            GATE {question.year}
                        </span>
                    )}

                    {marked && (
                        <span className="px-2 py-1 text-sm text-violet-100 dark:bg-violet-900 dark:text-violet-100">
                            Marked For Review
                        </span>
                    )}

                    {/* Report Button */}
                    <Button
                        size="icon-sm"
                        onClick={onReport}
                        className=" bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-500 dark:text-red-50 dark:hover:bg-red-700"
                        title="Report Question"
                    >
                        <Warning size={10} />
                    </Button>

                    {/* Share Button */}
                    <Button
                        size="icon-sm"
                        onClick={onShare}
                        className=" bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-500 dark:text-green-50 dark:hover:bg-green-700"
                        title="Share Question"
                    >
                        <ShareFat size={10} />
                    </Button>
                </div>
            </div>

            {/* Bottom Row: Type, Marks, Flags */}
            <div className="mt-2 flex flex-wrap justify-between gap-2 text-sm">
                {question.question_type && (
                    <span className="px-2 py-1 bg-indigo-50 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-50">
                        {getQuestionTypeText(question)}
                    </span>
                )}

                <div className="flex items-center space-x-2">
                    {question.marks && (
                        <span className="px-2 py-1 bg-purple-50 text-purple-500 dark:bg-purple-900 dark:text-purple-50">
                            {question.marks} Mark{question.marks !== 1 ? 's' : ''}
                        </span>
                    )}

                    {isMultipleSelection(question) && (
                        <span className="px-2 py-1 bg-orange-50 text-orange-600 dark:bg-orange-900 dark:text-orange-200">
                            Select all that apply
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuestionHeader;
