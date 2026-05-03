import { useLocation, useParams } from 'react-router-dom';
import { useGoals } from '@/shared/hooks/useGoals';

import ModernLoader from '@/shared/components/ModernLoader';
import QuestionCard from '@/features/questions/components/QuestionCard/QuestionCard';
import ReportModal from '@/shared/components/ReportModal';
import useQuestions from '../hooks/useQuestions';
import { useQuestionController } from '@/features/questions/api/useQuestionController';

const PracticeCard = () => {
    const { subject, qid } = useParams();
    const location = useLocation();
    const { subjects } = useGoals();

    const subjectId = subjects.find((s) => s.slug === subject)?.id;

    const { questions: fetchedQuestions, isLoading: isQuestionsLoading } = useQuestions(
        subjectId,
        false,
    );

    const passed = location.state?.questions;
    const questions = Array.isArray(passed) && passed.length ? passed : fetchedQuestions;

    const {
        currentQuestion,
        isLoading: isControllerLoading,
        cardProps,
        modalProps,
    } = useQuestionController({
        questions,
        mode: 'practice',
        subjectSlug: subject,
        qid,
    });

    if (isQuestionsLoading || isControllerLoading || !currentQuestion) {
        return (
            <div className="flex items-center justify-center h-screen">
                <ModernLoader />
            </div>
        );
    }

    return (
        <>
            <QuestionCard {...cardProps} />

            <ReportModal {...modalProps} />
        </>
    );
};

export default PracticeCard;
