import React, { useState } from 'react';
import {
    getDifficultyClassNames,
    getQuestionTypeText,
    isMultipleSelection,
} from '../../../utils/questionUtils.js';
import QuestionTimer from './QuestionTimer.js';
import QuestionBookmark from './QuestionBookmark.js';
import type { Question } from '../../../types/question.ts';
import { Warning, ShareFat } from '@phosphor-icons/react';
import ReportModal from '../../ReportModal.tsx';
import { supabase } from '../../../utils/supabaseClient.ts';
import useAuth from '../../../hooks/useAuth.ts';
import { toast } from 'sonner';

type QuestionHeaderProps = {
    subject: string | undefined;
    questions: Question[];
    currentIndex: string | number;
    currentQuestion: Question;
    questionId: string | number;
    isTimerActive: boolean;
};

const QuestionHeader = ({
    subject,
    questions,
    currentIndex,
    currentQuestion,
    questionId,
    isTimerActive,
}: QuestionHeaderProps) => {
    const { user } = useAuth();
    const [showReportModal, setShowReportModal] = useState(false);
    // Get difficulty display text
    const getDifficultyDisplayText = () => {
        if (!currentQuestion.difficulty) return 'Unknown';
        return normalizedDifficulty.charAt(0).toUpperCase() + normalizedDifficulty.slice(1);
    };

    // Normalize difficulty for display - handle null case
    let normalizedDifficulty = 'unknown';
    if (currentQuestion.difficulty) {
        normalizedDifficulty =
            currentQuestion.difficulty.toLowerCase() === 'normal'
                ? 'medium'
                : currentQuestion.difficulty.toLowerCase();
    }

    // Send question reports to Supabase
    const handleReportButton = async (reportType: string, reportText: string) => {
        const report = {
            user_id: user?.id,
            question_id: currentQuestion.id,
            report_type: reportType,
            report_text: reportText,
        };

        const { data, error } = await supabase.from('question_reports').insert([report]);

        if (error) {
            if (error.code === '23505') {
                toast.error("Already reported by you, don't spam please");
            } else {
                toast.error('There was an error in submitting the report.');
            }
            console.error('Error reporting question:', error);
        } else {
            toast.success('Thank you for making the platform great. ❤️');
            console.log('Report submitted:', data);
        }

        setShowReportModal(false);
    };

    // Allow sharing question to peers
    const handleSharingQuestion = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'GATEQuest PYQ question',
                    text: 'Try out this question:',
                    url: window.location.href,
                });
            } catch (err) {
                console.error('Share cancelled or failed.', err);
            }
        } else {
            try {
                await navigator.clipboard.writeText(window.location.href);
                toast.message('Question link copied successfully.');
            } catch (err) {
                console.error(err);
            }
        }
    };

    return (
        <div>
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border-primary dark:border-border-primary-dark bg-gradient-to-r from-gray-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-800">
                {showReportModal && (
                    <ReportModal
                        onClose={() => setShowReportModal(false)}
                        onSubmit={handleReportButton}
                    />
                )}
                {/* Top Row: Title + Right Info */}
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
                    <h3 className="font-bold text-base sm:text-lg">
                        Question {questions.findIndex((q) => q.id === currentIndex) + 1} of{' '}
                        {questions.length}
                    </h3>

                    <div className="flex flex-wrap items-center gap-2">
                        <QuestionBookmark questionId={questionId} subject={subject} />
                        <QuestionTimer
                            currentQuestion={currentQuestion}
                            isTimerActive={isTimerActive}
                        />
                        <span
                            className={`text-xs px-2 py-1 rounded-xl md:rounded-full ${getDifficultyClassNames(currentQuestion.difficulty)}`}
                        >
                            {getDifficultyDisplayText()}
                        </span>
                        {currentQuestion.year && (
                            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                                GATE {currentQuestion.year}
                            </span>
                        )}
                        <button
                            onClick={() => setShowReportModal((prev) => !prev)}
                            className="p-1 bg-red-200 text-red-600 rounded-full hover:bg-red-300 transition-all cursor-pointer"
                        >
                            <Warning />
                        </button>
                        <button
                            onClick={handleSharingQuestion}
                            className="p-1 bg-green-200 text-green-600 rounded-full hover:bg-green-300 transition-all cursor-pointer"
                        >
                            <ShareFat />
                        </button>
                    </div>
                </div>

                {/* Bottom Row: Type, Marks, Special Flags */}
                <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs">
                    {currentQuestion.question_type && (
                        <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-full">
                            {getQuestionTypeText(currentQuestion)}
                        </span>
                    )}

                    <div className="flex items-center space-x-2">
                        {currentQuestion.marks && (
                            <span className="px-2 py-1 bg-purple-50 text-purple-600 rounded-full">
                                {currentQuestion.marks} Mark
                                {currentQuestion.marks !== 1 ? 's' : ''}
                            </span>
                        )}

                        {isMultipleSelection(currentQuestion) && (
                            <span className="px-2 py-1 bg-orange-50 text-orange-600 rounded-full">
                                Select all that apply
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuestionHeader;
