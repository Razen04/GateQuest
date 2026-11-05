import {
    Check,
    CopyIcon,
    Dot,
    Eye,
    Flag,
    ShareFat,
    Trash,
    Warning,
} from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/shared/components/ui/dialog';
import { Textarea } from '@/shared/components/ui/textarea';
import type { Question } from '@/shared/types/storage.js';
import useBookmark from '../../hooks/useBookmark';
import {
    getDifficultyClassNames,
    getQuestionTypeText,
    isMultipleSelection,
} from '../../utils/questionUtils.js';
import QuestionBookmark from './QuestionBookmark.js';
import QuestionTimer from './QuestionTimer.js';

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
    onCopy: () => void;
    marked?: boolean | undefined;
    isAnswered: boolean;
    userCount: number | undefined;
};

const Divider = () => (
    <Dot size={14} weight="fill" className="text-muted-foreground/50" />
);

const QuestionHeader = ({
    questionNumber,
    totalQuestions,
    question,
    subjectSlug,
    timer,
    onReport,
    onShare,
    onCopy,
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

    useEffect(() => {
        if (subjectSlug) {
            fetchBookmarks(subjectSlug);
        }
    }, [subjectSlug, fetchBookmarks]);

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
                const val = await toggleBookmark({
                    subjectSlug,
                    questionId: question.id,
                    ...(noteText.trim() ? { note: noteText.trim() } : {}),
                });

                if (val) toast.success('Question bookmarked successfully.');
                else toast.error('Unable to bookmark.');
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

    const utilityButton =
        'flex items-center gap-1.5 border px-3 py-1.5 text-xs font-medium backdrop-blur-md transition-colors';

    return (
        <div className="relative overflow-hidden border-b border-border bg-card/70 backdrop-blur-2xl">
            {/* Glass Highlight */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-primary/5 to-transparent" />

            <div className="relative px-4 py-4 sm:px-6">
                {/* TOP ROW */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 font-mono">
                        <h1 className="font-['Sora',sans-serif] text-2xl font-bold tracking-tight text-foreground">
                            Question {questionNumber}
                            <span className="ml-2 text-base font-medium text-muted-foreground">
                                / {totalQuestions}
                            </span>
                        </h1>

                        {/* Metadata */}
                        <div className="mt-2 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
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

                        {/* Question Details */}
                        <div className="mt-2 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                            <span title={question.id || 'Unknown'}>
                                <span className="sm:hidden">
                                    ID:{' '}
                                    {question.id
                                        ? `${question.id.slice(0, 8)}…`
                                        : 'Unknown'}
                                </span>

                                <span className="hidden sm:inline">
                                    ID: {question.id || 'Unknown'}
                                </span>
                            </span>

                            <Divider />

                            <span>Subject: {question.subject}</span>

                            <Divider />

                            <span>Topic: {question.topic}</span>
                        </div>
                    </div>

                    {/* Right Controls */}
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
                            className={`border border-border px-2.5 py-1 text-xs font-semibold ${getDifficultyClassNames(
                                question.difficulty
                            )}`}
                        >
                            {getDifficultyDisplayText()}
                        </span>

                        {marked && (
                            <span className="flex items-center gap-1 border border-violet-500/20 bg-violet-500/10 px-2.5 py-1 text-xs font-medium text-violet-700 dark:text-violet-300">
                                <Flag size={12} weight="fill" />
                                Review
                            </span>
                        )}
                    </div>
                </div>

                {/* Bottom Utility Row */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3 text-xs">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Eye size={14} />
                        <span>{userCount ?? 1} studying now</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={onCopy}
                            className={`${utilityButton} border-border bg-secondary/60 text-secondary-foreground hover:bg-secondary`}
                        >
                            <CopyIcon size={14} />
                            Copy
                        </button>

                        <button
                            onClick={onReport}
                            className={`${utilityButton} border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/20`}
                        >
                            <Warning size={14} />
                            Report
                        </button>

                        <button
                            onClick={onShare}
                            className={`${utilityButton} border-emerald-500/20 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400`}
                        >
                            <ShareFat size={14} />
                            Share
                        </button>
                    </div>
                </div>
            </div>

            {/* Bookmark Note Modal */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px] rounded-none border border-border bg-card/95 backdrop-blur-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-['Sora',sans-serif]">
                            {isBookmarked
                                ? 'Edit Bookmark Note'
                                : 'Add Bookmark'}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-3 py-2">
                        <label className="text-xs font-medium text-muted-foreground">
                            Notes (Optional - Max 100 characters)
                        </label>

                        <Textarea
                            placeholder="Add key revision formula, error insight, or notes..."
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            maxLength={100}
                            rows={3}
                            className="resize-none rounded-none border-input bg-background/70 focus-visible:ring-ring"
                        />

                        <div className="flex justify-end text-xs text-muted-foreground">
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
                                <Trash size={14} />
                                Remove
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
                                className="flex items-center gap-1 rounded-none"
                            >
                                <Check size={14} />
                                Save
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default QuestionHeader;
