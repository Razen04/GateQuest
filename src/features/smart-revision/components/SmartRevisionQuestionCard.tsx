import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';

import type { Question } from '@/shared/types/storage';

import QuestionCard from '@/features/questions/components/QuestionCard/QuestionCard';
import ReportModal from '@/shared/components/ReportModal';
import ModernLoader from '@/shared/components/ModernLoader';
import { useQuestionController } from '@/features/questions/api/useQuestionController';
import { decompress } from 'lz-string';

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

        const lastSavedSession = localStorage.getItem('gatequest_last_active_session') || '';
        const isMyOwnRevisionSession = rid && lastSavedSession.includes(`/revision/${rid}`);

        if (isMyOwnRevisionSession) {
            try {
                const stored = localStorage.getItem('weekly_set_info');
                const recoveredQuestions = stored ? JSON.parse(decompress(stored)).questions : [];

                if (Array.isArray(recoveredQuestions) && recoveredQuestions.length > 0) {
                    setQuestions(recoveredQuestions);
                }
            } catch (err) {
                console.error('Error recovering questions on resume context:', err);
            }
            return;
        }

        navigate(`/practice/${subject}/${qid}?${qs}`, {
            replace: true,
        });
    }, [location.state, qs, navigate, qid, subject, rid]);

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
