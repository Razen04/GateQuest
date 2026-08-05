import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
    getDifficultyClassNames,
    getQuestionTypeText,
    isMultipleSelection,
} from '../../utils/questionUtils.js';
import QuestionTimer from './QuestionTimer.js';
import QuestionBookmark from './QuestionBookmark.js';
import {
    Warning,
    ShareFat,
    Dot,
    Eye,
    Flag,
    Trash,
    Check,
} from '@phosphor-icons/react';
import type { Question } from '@/shared/types/storage.js';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import useBookmark from '../../hooks/useBookmark';

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
    subjectSlug: string | undefined;
    timer?: TimerProps | undefined;
    onReport: () => void;
    onShare: () => void;
    marked?: boolean | undefined;
    isAnswered: boolean;
    userCount: number | undefined;
};

const Divider = () => (
    <Dot
        size={14}
        weight="fill"
        className="text-slate-300 dark:text-slate-600"
    />
);

const QuestionHeader = ({
    questionNumber,
    totalQuestions,
    question,
    subjectSlug,
    timer,
    onReport,
    onShare,
    marked,
    isAnswered,
    userCount,
}: QuestionHeaderProps) => {
    const {
        bookmarksMap,
        fetchBookmarks,
        toggleBookmark,
        updateBookmarkNote,
        loading,
    } = useBookmark();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [noteText, setNoteText] = useState('');

    const currentBookmark = bookmarksMap[question.id];
    const isBookmarked = Boolean(currentBookmark);

    // Fetch bookmarks for this subject when header mounts or subject changes
    useEffect(() => {
        if (subjectSlug) {
            fetchBookmarks(subjectSlug);
        }
    }, [subjectSlug, question.id, fetchBookmarks]);

    // Keep textarea state in sync with existing bookmark note when modal opens
    useEffect(() => {
        if (isDialogOpen) {
            setNoteText(currentBookmark?.notes || '');
        }
    }, [isDialogOpen, currentBookmark]);

    const handleSaveBookmark = async () => {
        if (noteText.length > 100 || !subjectSlug) return;

        try {
            if (isBookmarked) {
                await updateBookmarkNote({
                    subjectSlug,
                    questionId: question.id,
                    ...(noteText.trim() ? { note: noteText.trim() } : {}),
                });
                toast.success('Bookmark note updated');
            } else {
                await toggleBookmark({
                    subjectSlug,
                    questionId: question.id,
                    ...(noteText.trim() ? { note: noteText.trim() } : {}),
                });
                toast.success('Question bookmarked');
            }

            window.dispatchEvent(new Event('BOOKMARKS_UPDATED'));
            setIsDialogOpen(false);
        } catch (err) {
            console.error('Failed to save bookmark:', err);
            toast.error('Failed to save bookmark. Please try again.');
        }
    };

    const handleRemoveBookmark = async () => {
        if (!subjectSlug) return;

        try {
            if (isBookmarked) {
                await toggleBookmark({
                    subjectSlug,
                    questionId: question.id,
                });
                window.dispatchEvent(new Event('BOOKMARKS_UPDATED'));
                toast.success('Bookmark removed');
            }
            setIsDialogOpen(false);
        } catch (err) {
            console.error('Failed to remove bookmark:', err);
            toast.error('Failed to remove bookmark. Please try again.');
        }
    };

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
                    <QuestionBookmark
                        onClick={() => setIsDialogOpen(true)}
                        isBookmarked={isBookmarked}
                        hasNote={Boolean(currentBookmark?.notes)}
                    />

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
                            question.difficulty
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

                    <span className="flex items-center gap-1">
                        {userCount ?? 1} studying now
                    </span>
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

            {/* Bookmark Note Modal */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px] rounded-none">
                    <DialogHeader>
                        <DialogTitle>
                            {isBookmarked
                                ? 'Edit Bookmark Note'
                                : 'Add Bookmark'}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-3 py-2">
                        <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                            Notes (Optional - Max 100 characters)
                        </label>
                        <Textarea
                            placeholder="Add key revision formula, error insight, or notes..."
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            maxLength={100}
                            rows={3}
                            className="resize-none rounded-none"
                        />
                        <div className="flex justify-end text-xs text-slate-400">
                            {noteText.length}/100
                        </div>
                    </div>

                    <DialogFooter className="flex flex-row justify-between items-center sm:justify-between gap-2">
                        {isBookmarked ? (
                            <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={handleRemoveBookmark}
                                disabled={loading}
                                className="flex items-center gap-1 rounded-none"
                            >
                                <Trash size={14} /> Remove
                            </Button>
                        ) : (
                            <div />
                        )}

                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setIsDialogOpen(false)}
                                disabled={loading}
                                className="rounded-none"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                onClick={handleSaveBookmark}
                                disabled={loading || noteText.length > 100}
                                className="flex items-center gap-1 rounded-none text-white"
                            >
                                <Check size={14} /> Save
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default QuestionHeader;
