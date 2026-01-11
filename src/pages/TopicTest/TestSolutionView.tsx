import { useState, useMemo } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { toast } from 'sonner';

import { supabase } from '@/utils/supabaseClient';
import useAuth from '@/hooks/useAuth';
import QuestionCard from '@/components/QuestionCard/QuestionCard';
import { handleBookmark, isMultipleSelection, isNumericalQuestion } from '@/utils/questionUtils';

import { usePeerBenchmark } from '@/hooks/usePeerBenchmark';
import ReportModal from '@/components/ReportModal';

const TestSolutionView = () => {
    const { testId, questionIndex } = useParams<{
        testId: string;
        questionIndex: string;
    }>();

    const { attempts } = useOutletContext();
    const navigate = useNavigate();
    const { user, isLogin } = useAuth();

    const [showReportModal, setShowReportModal] = useState(false);

    // 3. Derived State
    const currentIndex = parseInt(questionIndex || '0', 10);
    const currentAttempt = attempts[currentIndex];
    const currentQuestion = currentAttempt?.questions;

    if (!currentAttempt) {
        toast.error('No question present.');
        navigate(`/topic-test-result/${testId}`, { replace: true });
    }

    const safeQuestion = useMemo(() => {
        return (
            currentQuestion || ({ id: '0', options: [], correct_answer: [], subject: '' } as any)
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
            userAnswerIndex: !isMSQ && !isNAT && typeof ans === 'number' ? ans : null,

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
    } = usePeerBenchmark(safeQuestion.id);

    // Navigation Handlers
    const handleNext = () => {
        if (currentIndex < attempts.length - 1) {
            navigate(`/topic-test-review/${testId}/${currentIndex + 1}`);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            navigate(`/topic-test-review/${testId}/${currentIndex - 1}`);
        }
    };

    const handleBack = () => {
        navigate(`/topic-test-result/${testId}`);
    };

    const handleReportSubmit = async (reportType: string, reportText: string) => {
        const report = {
            user_id: user?.id,
            question_id: safeQuestion.id,
            report_type: reportType,
            report_text: reportText,
        };

        const { error } = await supabase.from('question_reports').insert([report]);

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
            await navigator.share({ title: 'Check this question', url: shareUrl });
        } else {
            await navigator.clipboard.writeText(shareUrl);
            toast.success('Public practice link copied!');
        }
    };

    const onToggleBookmark = () => {
        handleBookmark(isLogin, safeQuestion.id, safeQuestion.subject);
    };

    const handleExplanation = () => {
        if (currentQuestion?.explanation) {
            window.open(currentQuestion.explanation, '_blank');
        }
    };

    return (
        <div>
            <QuestionCard
                question={currentQuestion}
                totalQuestions={attempts.length}
                questionNumber={currentIndex + 1}
                userAnswerIndex={normalizedProps?.userAnswerIndex ?? null}
                selectedOptionIndices={normalizedProps?.selectedOptionIndices ?? []}
                numericalAnswer={normalizedProps?.numericalAnswer ?? null}
                marked={normalizedProps?.marked}
                onOptionSelect={() => {}}
                showAnswer={true}
                result={normalizedProps?.result}
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
                onBookmark={onToggleBookmark}
                isFirst={currentIndex === 0}
                isLast={currentIndex === attempts.length - 1}
            />

            {showReportModal && (
                <ReportModal
                    show={showReportModal}
                    onClose={() => setShowReportModal(false)}
                    onSubmit={handleReportSubmit}
                />
            )}
        </div>
    );
};

export default TestSolutionView;
