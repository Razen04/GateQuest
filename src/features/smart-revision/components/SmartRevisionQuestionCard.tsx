import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';

import type { Question } from '@/shared/types/storage';

import QuestionCard from '@/features/questions/components/QuestionCard/QuestionCard';
import ReportModal from '@/shared/components/ReportModal';
import ModernLoader from '@/shared/components/ModernLoader';
import { useQuestionController } from '@/features/questions/api/useQuestionController';

const SmartRevisionQuestionCard = () => {
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

    const {
        currentQuestion,
        isLoading: isControllerLoading,
        cardProps,
        modalProps,
    } = useQuestionController({
        questions,
        mode: 'revision',
        revisionId: rid,
        subjectSlug: subject,
        qid,
    });

    if (!questions.length || isControllerLoading || !currentQuestion) {
        return (
            <div className="flex items-center justify-center h-screen">
                <ModernLoader />
            </div>
        );
    }

    return (
        <div>
            <QuestionCard {...cardProps} />

            <ReportModal {...modalProps} />
        </div>
    );
};

export default SmartRevisionQuestionCard;
