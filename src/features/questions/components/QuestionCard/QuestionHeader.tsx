import {
    getDifficultyClassNames,
    getQuestionTypeText,
    isMultipleSelection,
} from '../../utils/questionUtils.js';
import QuestionTimer from './QuestionTimer.js';
import QuestionBookmark from './QuestionBookmark.js';
import { Warning, ShareFat, Dot, Eye, Flag } from '@phosphor-icons/react';
import type { Question } from '@/shared/types/storage.js';

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
    isAnswered: boolean;
    userCount: number | undefined;
};

const Divider = () => (
    <Dot size={14} weight="fill" className="text-slate-300 dark:text-slate-600" />
);

const QuestionHeader = ({
    questionNumber,
    totalQuestions,
    question,
    timer,
    onReport,
    onShare,
    onBookmark,
    marked,
    isAnswered,
    userCount,
}: QuestionHeaderProps) => {
    const getDifficultyDisplayText = () => {
        if (!question.difficulty) return 'Unknown';

        const normalized =
            question.difficulty.toLowerCase() === 'normal'
                ? 'medium'
                : question.difficulty.toLowerCase();

        return normalized.charAt(0).toUpperCase() + normalized.slice(1);
    };

    const examLabel = question.year
        ? `${(Array.isArray(question.metadata.exam)
              ? question.metadata.exam
              : [question.metadata.exam || 'GATE']
          )
              .join(' / ')
              .toUpperCase()} ${question.year}${
              question.metadata.set ? ` • ${question.metadata.set}` : ''
          }`
        : 'Year Unknown';

    return (
        <div className="border-b border-slate-200/70 bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-4 dark:border-white/10 dark:from-zinc-900 dark:to-zinc-950 sm:px-6">
            {/* TOP ROW */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <h1 className="font-['Space_Grotesk',sans-serif] text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Question {questionNumber}
                        <span className="ml-2 text-base font-medium text-slate-400">
                            / {totalQuestions}
                        </span>
                    </h1>

                    {/* Metadata */}
                    <div className="mt-2 flex flex-wrap items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                        <span>{examLabel}</span>

                        {question.question_type && (
                            <>
                                <Divider />
                                <span>{getQuestionTypeText(question)}</span>
                            </>
                        )}

                        {question.marks && (
                            <>
                                <Divider />
                                <span>
                                    {question.marks} Mark
                                    {question.marks > 1 ? 's' : ''}
                                </span>
                            </>
                        )}

                        {isMultipleSelection(question) && (
                            <>
                                <Divider />
                                <span>Multiple Selection</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Right controls */}
                <div className="flex flex-wrap items-center gap-2">
                    <QuestionBookmark onClick={onBookmark} />

                    {timer && (
                        <QuestionTimer
                            minutes={timer.minutes}
                            seconds={timer.seconds}
                            isActive={timer.isActive}
                            onToggle={timer.onToggle}
                            isAnswered={isAnswered}
                        />
                    )}

                    <span
                        className={`px-2.5 py-1 text-xs font-semibold ${getDifficultyClassNames(
                            question.difficulty,
                        )}`}
                    >
                        {getDifficultyDisplayText()}
                    </span>

                    {marked && (
                        <span className="flex items-center gap-1 border border-violet-300/30 bg-violet-500/10 px-2.5 py-1 text-xs font-medium text-violet-700 dark:border-violet-500/20 dark:text-violet-300">
                            <Flag size={12} weight="fill" />
                            Review
                        </span>
                    )}
                </div>
            </div>

            {/* Bottom utility row */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/70 pt-3 text-xs dark:border-white/10">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Eye size={14} />

                    <span className="flex items-center gap-1">{userCount ?? 1} studying now</span>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={onReport}
                        className="flex items-center gap-1.5 border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20"
                    >
                        <Warning size={14} />
                        Report
                    </button>

                    <button
                        onClick={onShare}
                        className="flex items-center gap-1.5 border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-100 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20"
                    >
                        <ShareFat size={14} />
                        Share
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuestionHeader;
