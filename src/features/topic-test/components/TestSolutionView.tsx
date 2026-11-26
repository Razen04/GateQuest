import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '@/app/stores/useAuthStore';
import QuestionCard from '@/features/questions/components/QuestionCard/QuestionCard';
import { usePeerBenchmark } from '@/features/questions/hooks/usePeerBenchmark';
import {
    isMultipleSelection,
    isNumericalQuestion,
} from '@/features/questions/utils/questionUtils';
import ReportModal from '@/shared/components/ReportModal';
import useKeyboardShortcuts from '@/shared/hooks/useKeyboardShortcuts';
import { supabase } from '@/shared/utils/supabaseClient';
import type { AttemptWithQuestion } from '../components/TestReviewLayout';
import {
    getAdjacentIndex,
    getDisplayNumber,
    getDisplayTotal,
} from '../utils/questionPalette';

const TestSolutionView = () => {
    const { testId, questionIndex } = useParams<{
        testId: string;
        questionIndex: string;
    }>();

    const { attempts } = useOutletContext<{
        attempts: AttemptWithQuestion[];
    }>();
    const navigate = useNavigate();
    const user = useAuthStore((s) => s.user);

    const [showReportModal, setShowReportModal] = useState(false);

    // 3. Derived State
    const currentIndex = parseInt(questionIndex || '0', 10);
    const currentAttempt = attempts[currentIndex];
    const currentQuestion = currentAttempt?.questions;

    const subjectSlug = currentQuestion?.subject ?? '';
    const reviewQuestions = useMemo(
        () =>
            attempts
                .map((a) => a.questions)
                .filter((q): q is NonNullable<typeof q> => Boolean(q)),
        [attempts]
    );
    const displayNumber = getDisplayNumber(reviewQuestions, currentIndex);
    const displayTotal = getDisplayTotal(reviewQuestions, currentIndex);

    const safeQuestion = useMemo(() => {
        return (
            currentQuestion ||
            ({
                id: '0',
                options: [],
                correct_answer: [],
                subject_id: '',
            } as any)
        );
    }, [currentQuestion]);

    const normalizedProps = useMemo(() => {
        if (!safeQuestion || !currentAttempt) return null;

        const isMSQ = isMultipleSelection(safeQuestion);
        const isNAT = isNumericalQuestion(safeQuestion);
        const ans = currentAttempt.user_answer;
        const markedForReview = currentAttempt.marked_for_review;

        return {
            // MCQ: Expects index (number) or null
            userAnswerIndex:
                !isMSQ && !isNAT && typeof ans === 'number' ? ans : null,

            // MSQ: Expects array of indices
            selectedOptionIndices: isMSQ && Array.isArray(ans) ? ans : [],

            // NAT: Expects numerical value
            numericalAnswer: isNAT && ans !== null ? Number(ans) : null,

            // Result Status
            result:
                currentAttempt.status === 'answered'
                    ? currentAttempt.is_correct === true
                        ? 'correct'
                        : 'incorrect'
                    : 'unattempted',
            marked: markedForReview,
        };
    }, [currentAttempt, safeQuestion]);

    // Peer Stats
    const {
        benchmarkDetails,
        loading: statsLoading,
        message: statsMessage,
    } = usePeerBenchmark(safeQuestion.id, true); // enable is true because in TestSolution we need to see the peer_stats since all the questions are already answered

    // Navigation handlers stay above the early return so the shortcut hook
    // can be registered unconditionally on every render.
    const handleNext = useCallback(() => {
        const next = getAdjacentIndex(reviewQuestions, currentIndex, 1);
        if (next != null) {
            navigate(`/topic-test-review/${testId}/${next}`);
        }
    }, [reviewQuestions, currentIndex, navigate, testId]);

    const handlePrev = useCallback(() => {
        const prev = getAdjacentIndex(reviewQuestions, currentIndex, -1);
        if (prev != null) {
            navigate(`/topic-test-review/${testId}/${prev}`);
        }
    }, [reviewQuestions, currentIndex, navigate, testId]);

    const handleExplanation = useCallback(() => {
        if (currentQuestion?.source_url) {
            window.open(currentQuestion.source_url, '_blank');
        } else {
            toast.message(
                'No GATEOverflow explanation available. Please use AskAI or refer to the AI Explanation provided.'
            );
        }
    }, [currentQuestion]);

    // Review is read-only: Q/W and the arrow keys move between questions and
    // Slash opens the explanation. Selection, submit and show-answer
    // shortcuts are intentionally inert here.
    useKeyboardShortcuts({
        onPrev: handlePrev,
        onNext: handleNext,
        onExplain: handleExplanation,
        enableOptionSelection: false,
    });

    if (!currentAttempt || !currentQuestion) return null;

    const handleBack = () => {
        navigate(`/topic-test-result/${testId}`);
    };

    const handleReportSubmit = async (
        reportType: string,
        reportText: string
    ) => {
        if (!user?.id) return;
        const report = {
            user_id: user.id,
            question_id: safeQuestion.id,
            report_type: reportType,
            report_text: reportText,
        };

        const { error } = await supabase
            .from('question_reports')
            .insert([report]);

        if (error) {
            if (error.code === '23505') {
                toast.error("Already reported by you, don't spam please");
            } else {
                toast.error('There was an error in submitting the report.');
            }
            console.error('Error reporting question:', error);
        } else {
            toast.success('Thank you for making the platform great. ❤️');
        }

        setShowReportModal(false);
    };

    const handleShare = async () => {
        const shareUrl = `${window.location.origin}/practice/${safeQuestion.subject}/${safeQuestion.id}`;

        if (navigator.share) {
            await navigator.share({
                title: 'Check this question',
                url: shareUrl,
            });
        } else {
            await navigator.clipboard.writeText(shareUrl);
            toast.success('Public practice link copied!');
        }
    };

    // function to copy raw question and options
    const onCopyQuestion = async () => {
        try {
            const question = currentQuestion?.question;
            const options = currentQuestion?.options;
            const questionType = currentQuestion?.question_type;

            const content = {
                questionType,
                question,
                ...(options?.length ? { options } : {}),
            };

            await navigator.clipboard.writeText(
                JSON.stringify(content, null, 2)
            );
            toast.success('Question and options copied successfully.');
        } catch (err) {
            toast.error('Unable to copy.');
            console.error('Unable to copy: ', err);
        }
    };

    return (
        <div>
            <QuestionCard
                question={currentQuestion}
                totalQuestions={displayTotal}
                questionNumber={displayNumber}
                subjectSlug={subjectSlug}
                userAnswerIndex={normalizedProps?.userAnswerIndex ?? null}
                selectedOptionIndices={
                    normalizedProps?.selectedOptionIndices ?? []
                }
                numericalAnswer={normalizedProps?.numericalAnswer ?? null}
                marked={normalizedProps?.marked ?? false}
                onOptionSelect={() => {}}
                showAnswer={true}
                result={
                    normalizedProps?.result === 'correct' ||
                    normalizedProps?.result === 'incorrect'
                        ? normalizedProps.result
                        : 'unattempted'
                }
                peerStats={{
                    loading: statsLoading,
                    message: statsMessage,
                    data: benchmarkDetails,
                }}
                onExplanationClick={handleExplanation}
                onNext={handleNext}
                onPrev={handlePrev}
                onBack={handleBack}
                onReport={() => setShowReportModal(true)}
                onShare={handleShare}
                onCopy={onCopyQuestion}
                isFirst={
                    getAdjacentIndex(reviewQuestions, currentIndex, -1) === null
                }
                isLast={
                    getAdjacentIndex(reviewQuestions, currentIndex, 1) === null
                }
            />

            {showReportModal && (
                <ReportModal
                    show={showReportModal}
                    onClose={() => setShowReportModal(false)}
                    onSubmit={handleReportSubmit}
                    reportSubmitting={false}
                />
            )}
        </div>
    );
};

export default TestSolutionView;
