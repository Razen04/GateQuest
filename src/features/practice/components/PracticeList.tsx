import { useNavigate, useParams } from 'react-router-dom';
import { useGoalStore } from '@/app/stores/useGoalStore';
import QuestionsList from '@/features/questions/components/QuestionsList/QuestionsList';
import ModernLoader from '@/shared/components/ModernLoader';
import type { Question } from '@/shared/types/storage';
import useQuestions from '../hooks/useQuestions';

const PracticeList = () => {
    const navigate = useNavigate();
    const { subject } = useParams();
    const subjects = useGoalStore((s) => s.subjects);
    const selectedSubject = subjects.filter((s) => s.slug === subject);
    const subjectId = selectedSubject[0]?.id;
    const subjectName = selectedSubject[0]?.name;

    const { questions, isLoading, error } = useQuestions(subjectId);

    const handleQuestionClick = (
        id: string,
        currentFilteredList: Question[]
    ) => {
        const currentQueryString = window.location.search;

        navigate(`/practice/${subject}/${id}${currentQueryString}`, {
            state: { questions: currentFilteredList },
        });
    };

    if (isLoading) {
        return (
            <div className="w-full pb-20 flex justify-center items-center text-gray-600">
                <ModernLoader />
            </div>
        );
    }

    if (error) {
        return (
            <div>
                Failed to load questions, please clear cache and try again, if
                this does not work, hop on Discord and I might help.
            </div>
        );
    }

    if (!subject) return;

    return (
        <QuestionsList
            questions={questions}
            title={`${subjectName} Questions`}
            onBack={() => navigate('/practice')}
            onQuestionClick={handleQuestionClick}
            subject={subject}
            mode="practice"
        />
    );
};

export default PracticeList;
