import QuestionCard from '@/components/QuestionCard/QuestionCard';
import ReportModal from '@/components/ReportModal';
import ModernLoader from '@/components/ui/ModernLoader';
import useAnswerFlow from '@/hooks/useAnswerFlow';
import useAuth from '@/hooks/useAuth';
import useKeyboardShortcuts from '@/hooks/useKeyboardShortcuts';
import { usePeerBenchmark } from '@/hooks/usePeerBenchmark';
import useQuestionNav from '@/hooks/useQuestionNav';
import { useQuestionState } from '@/hooks/useQuestionState';
import { useQuestionTimer } from '@/hooks/useQuestionTimer';
import useSettings from '@/hooks/useSettings';
import useStats from '@/hooks/useStats';
import type { Question } from '@/types/question';
import { handleBookmark } from '@/utils/questionUtils';
import { supabase } from '@/utils/supabaseClient';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

const SmartRevisionQuestionCard = () => {
    // Router and Base Navigation Data
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const { rid, subject, qid } = useParams();
    const qs = searchParams.toString();

    const [questions, setQuestions] = useState<Question[]>([]);

    useEffect(() => {
        const passedState = location.state?.questions;
        if (Array.isArray(passedState) && passedState.length > 0) {
            setQuestions(passedState);
            return;
        }

        navigate(`/practice/${subject}/${qid}?${qs}`, {
            replace: true,
        });
    }, [location.state, qs, navigate, qid, subject]);

    const [currentIndex, setCurrentIndex] = useState<string | number>(qid || 0);

    const currentQuestion = useMemo(() => {
        if (!questions || questions.length === 0) return null;
        return (
            questions.find((q: Question) => String(q.id) === String(currentIndex)) || questions[0]
        );
    }, [questions, currentIndex]);

    const safeQuestion =
        currentQuestion || ({ id: '0', options: [], correct_answer: [], subject: '' } as any);

    // Global contexts
    const { user, isLogin } = useAuth();
    const { settings } = useSettings();
    const { updateStats } = useStats();

    // Timer Logic
    const {
        time: timeTaken,
        minutes,
        seconds,
        isActive: isTimerActive,
        toggle: toggleTimer,
        reset: resetTimer,
    } = useQuestionTimer(settings?.autoTimer, safeQuestion);

    // Question State (User Selection, Numerical Input)
    const {
        userAnswerIndex,
        selectedOptionIndices,
        numericalAnswer,
        showAnswer,
        setShowAnswer,
        result,
        setResult,
        resetState: resetQuestionState,
        handleOptionSelect,
        handleNumericalInputChange,
    } = useQuestionState(safeQuestion);

    // Answer Flow (Submission Logic)
    const { handleShowAnswer, handleSubmit } = useAnswerFlow({
        currentQuestion: safeQuestion,
        selectedOptionIndices,
        numericalAnswer,
        timeTaken,
        user,
        isLogin,
        updateStats,
        setShowAnswer,
        setResult,
        resetTimer,
        showAnswer,
    });

    // Navigation Logic
    const { isFirst, isLast, handleNext, handlePrevious } = useQuestionNav({
        filteredQuestions: questions, // TODO: Fix this
        subject: subject,
        qs,
        currentIndex, // Pass the ID here
        setCurrentIndex,
        resetQuestionState,
        questionMode: 'revision',
        revisionId: rid,
    });

    // Peer Stats
    const {
        benchmarkDetails,
        loading: statsLoading,
        message: statsMessage,
    } = usePeerBenchmark(safeQuestion.id);

    const onExplanationClick = () => {
        if (safeQuestion.explanation) {
            window.open(safeQuestion.explanation, '_blank');
        }
    };

    // Keyboard Shortcuts
    useKeyboardShortcuts(
        {
            onPrev: handlePrevious,
            onNext: handleNext,
            onShowAnswer: handleShowAnswer,
            onExplain: () => onExplanationClick(),
        },
        [safeQuestion],
    );

    // 7. Side Effects: Audio Handling
    const correctSoundRef = useRef<HTMLAudioElement | null>(null);
    const wrongSoundRef = useRef<HTMLAudioElement | null>(null);

    // Initialize Audio
    useEffect(() => {
        if (settings?.sound) {
            correctSoundRef.current = new Audio('/correct.wav');
            wrongSoundRef.current = new Audio('/wrong.wav');
        }
    }, [settings?.sound]);

    // Play Audio on Result
    useEffect(() => {
        if (showAnswer && settings?.sound && result !== 'unattempted') {
            if (result === 'correct') correctSoundRef.current?.play().catch((e) => console.warn(e));
            else if (result === 'incorrect')
                wrongSoundRef.current?.play().catch((e) => console.warn(e));
        }
    }, [showAnswer, result, settings?.sound]);

    // 8. Event Handlers
    const [showReportModal, setShowReportModal] = useState(false);

    const handleReportSubmit = async (reportType: string, reportText: string) => {
        const report = {
            user_id: user?.id,
            question_id: currentQuestion?.id,
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

    // Allow sharing question to peers
    const onShareClick = async () => {
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

    const onToggleBookmark = () => {
        handleBookmark(isLogin, safeQuestion.id, safeQuestion.subject);
    };

    const handleBack = () => {
        navigate(`/revision/${rid}?${qs}`);
    };

    // 9. Render Loading or Dumb Component
    if (!questions || !currentQuestion) {
        return (
            <div className="flex items-center justify-center h-screen">
                <ModernLoader />
            </div>
        );
    }
    return (
        <div>
            <QuestionCard
                // Data Props
                question={currentQuestion}
                totalQuestions={questions.length}
                questionNumber={
                    questions.findIndex(
                        (q: Question) => String(q.id) === String(currentQuestion.id),
                    ) + 1
                }
                // State Props
                userAnswerIndex={userAnswerIndex}
                selectedOptionIndices={selectedOptionIndices}
                numericalAnswer={numericalAnswer}
                showAnswer={showAnswer}
                result={result}
                // Timer Props
                timer={{
                    minutes,
                    seconds,
                    isActive: isTimerActive,
                    onToggle: toggleTimer,
                }}
                // Stats Props
                peerStats={{
                    loading: statsLoading,
                    message: statsMessage,
                    data: benchmarkDetails,
                }}
                // Event Handlers
                onOptionSelect={handleOptionSelect}
                onNumericalChange={handleNumericalInputChange}
                onShowAnswer={handleShowAnswer}
                handleSubmit={handleSubmit}
                onNext={handleNext}
                onPrev={handlePrevious}
                onReport={() => setShowReportModal(true)}
                onShare={onShareClick}
                onBookmark={onToggleBookmark}
                onExplanationClick={onExplanationClick}
                onBack={handleBack}
                // Navigation Flags
                isFirst={isFirst}
                isLast={isLast}
            />

            {showReportModal && (
                <ReportModal
                    show={showReportModal} // Ensure Modal accepts this prop
                    onClose={() => setShowReportModal(false)}
                    onSubmit={handleReportSubmit}
                />
            )}
        </div>
    );
};

export default SmartRevisionQuestionCard;
