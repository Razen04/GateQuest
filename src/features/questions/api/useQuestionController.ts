import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { handleBookmark } from '@/features/questions/utils/questionUtils';

import useQuestionNav from '@/features/questions/hooks/useQuestionNav';
import { usePeerBenchmark } from '@/features/questions/hooks/usePeerBenchmark';
import useKeyboardShortcuts from '@/shared/hooks/useKeyboardShortcuts';
import useAnswerFlow from '@/features/questions/hooks/useAnswerFlow';
import useAuth from '@/shared/hooks/useAuth';
import useSettings from '@/features/settings/hooks/useSettings';
import type { Question } from '@/shared/types/storage';
import { handleReport } from './quesitons';
import { useQuestionState } from '../hooks/useQuestionState';
import { useQuestionTimer } from '../hooks/useQuestionTimer';

interface UseQuestionControllerProps {
    questions: Question[];
    mode: 'practice' | 'revision';
    subjectSlug?: string | undefined;
    revisionId?: string | undefined;
    qid?: string | undefined;
}

export const useQuestionController = ({
    questions,
    mode,
    subjectSlug,
    revisionId,
    qid,
}: UseQuestionControllerProps) => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const qs = searchParams.toString();

    const { user, isLogin } = useAuth();
    const { settings } = useSettings();

    const [currentIndex, setCurrentIndex] = useState<string | number>(qid || 0);

    const currentQuestion = useMemo(() => {
        if (!questions || questions.length === 0) return null;
        return (
            questions.find((q: Question) => String(q.id) === String(currentIndex)) || questions[0]
        );
    }, [questions, currentIndex]);

    const safeQuestion = useMemo(
        () => currentQuestion || ({ id: '0', options: [], correct_answer: [], subject: '' } as any),
        [currentQuestion],
    );

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

    const {
        time: timeTaken,
        minutes,
        seconds,
        isActive: isTimerActive,
        toggle: toggleTimer,
        stop: stopTimer,
    } = useQuestionTimer(settings?.autoTimer, safeQuestion, showAnswer);

    const { handleShowAnswer, handleSubmit } = useAnswerFlow({
        currentQuestion: safeQuestion,
        selectedOptionIndices,
        numericalAnswer,
        timeTaken,
        user,
        isLogin,
        setShowAnswer,
        setResult,
        stop: stopTimer,
        showAnswer,
    });

    const { isFirst, isLast, handleNext, handlePrevious } = useQuestionNav({
        filteredQuestions: questions,
        subject: subjectSlug,
        qs,
        currentIndex,
        setCurrentIndex,
        resetQuestionState,
        questionMode: mode,
        revisionId: revisionId,
    });

    const {
        benchmarkDetails,
        loading: statsLoading,
        message: statsMessage,
    } = usePeerBenchmark(safeQuestion.id);

    const correctSoundRef = useRef<HTMLAudioElement | null>(null);
    const wrongSoundRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (settings?.sound) {
            correctSoundRef.current = new Audio('/audio/correct.wav');
            wrongSoundRef.current = new Audio('/audio/wrong.wav');
        }
        return () => {
            correctSoundRef.current?.pause();
            wrongSoundRef.current?.pause();
        };
    }, [settings?.sound]);

    useEffect(() => {
        if (showAnswer && settings?.sound && result !== 'unattempted') {
            if (result === 'correct') correctSoundRef.current?.play().catch((e) => console.warn(e));
            else if (result === 'incorrect')
                wrongSoundRef.current?.play().catch((e) => console.warn(e));
        }
    }, [showAnswer, result, settings?.sound]);

    const [showReportModal, setShowReportModal] = useState(false);
    const [reportSubmitting, setReportSubmitting] = useState(false);

    const handleReportSubmit = async (reportType: string, reportText: string) => {
        setReportSubmitting(true);

        if (!user?.id) {
            toast.error('You must be logged in to report a question.');
            return;
        }
        const report = {
            user_id: user.id,
            question_id: safeQuestion.id,
            report_type: reportType,
            report_text: reportText,
        };

        try {
            const { error } = await handleReport(report);
            if (error) {
                if (error.code === '23505') toast.error('Already reported by you.');
                else toast.error('Error submitting report.');
            } else {
                toast.success('Thank you for the report! ❤️');
                setShowReportModal(false);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setReportSubmitting(false);
        }
    };

    const onShareClick = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'GATEQuest PYQ question',
                    url: window.location.href,
                });
            } catch (err) {
                console.error(err);
            }
        } else {
            await navigator.clipboard.writeText(window.location.href);
            toast.message('Link copied.');
        }
    };

    const onToggleBookmark = () => {
        handleBookmark(isLogin, safeQuestion.id, safeQuestion.subject);
    };

    const onExplanationClick = () => {
        const url = mode === 'practice' ? safeQuestion.source_url : safeQuestion.explanation;
        if (url) window.open(url, '_blank');
    };

    const handleBack = () => {
        const path = mode === 'practice' ? `/practice/${subjectSlug}` : `/revision/${revisionId}`;
        navigate(`${path}?${qs}`);
    };

    useKeyboardShortcuts(
        {
            onPrev: handlePrevious,
            onNext: handleNext,
            onShowAnswer: handleShowAnswer,
            onExplain: onExplanationClick,
        },
        [safeQuestion],
    );

    return {
        currentQuestion,
        isLoading: !currentQuestion,
        // Props for QuestionCard component
        cardProps: {
            question: currentQuestion!,
            totalQuestions: questions.length,
            questionNumber:
                questions.findIndex((q) => String(q.id) === String(safeQuestion.id)) + 1,
            userAnswerIndex,
            selectedOptionIndices,
            numericalAnswer,
            showAnswer,
            result,
            timer: {
                minutes,
                seconds,
                isActive: isTimerActive,
                onToggle: toggleTimer,
            },
            peerStats: {
                loading: statsLoading,
                message: statsMessage,
                data: benchmarkDetails,
            },
            onOptionSelect: handleOptionSelect,
            onNumericalChange: handleNumericalInputChange,
            onShowAnswer: handleShowAnswer,
            handleSubmit,
            onNext: handleNext,
            onPrev: handlePrevious,
            onReport: () => setShowReportModal(true),
            onShare: onShareClick,
            onBookmark: onToggleBookmark,
            onExplanationClick,
            onBack: handleBack,
            isFirst,
            isLast,
        },
        // Props for ReportModal
        modalProps: {
            show: showReportModal,
            onClose: () => setShowReportModal(false),
            onSubmit: handleReportSubmit,
            reportSubmitting,
        },
    };
};
