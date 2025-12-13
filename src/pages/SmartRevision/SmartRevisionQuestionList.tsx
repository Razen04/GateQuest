import { useNavigate, useParams } from 'react-router-dom';
import { decompress } from 'lz-string';
import QuestionsList from '../../components/QuestionsList/QuestionsList.tsx';
import type { Question } from '@/types/question.ts';

const SmartRevisionQuestionList = () => {
    const stored = localStorage.getItem('weekly_set_info');

    const questions = stored ? JSON.parse(decompress(stored)).questions : null;

    const navigate = useNavigate();
    // Get the revision id from the url
    const { rid } = useParams();

    const handleBack = () => {
        navigate('/revision');
    };

    // This is the crucial navigation step to the QuestionCard.
    const handleQuestionClick = (id: string, currentFilteredList: Question[]) => {
        console.log('currentFilteredList: ', currentFilteredList);
        const subject = currentFilteredList.find((q) => q.id === id)?.subject;

        const currentQueryString = window.location.search;
        // Navigate to the specific question URL, making sure to include the current filter query string.
        navigate(`/revision/${rid}/${subject}/${id}?${currentQueryString}`, {
            // This is the most important part: we pass the entire filtered list in the route's state.
            // This allows the QuestionCard to render instantly without re-fetching or re-filtering.
            state: { questions: currentFilteredList },
        });
    };

    return (
        <QuestionsList
            questions={questions}
            title="Revision Questions"
            onQuestionClick={handleQuestionClick}
            onBack={handleBack}
        />
    );
};

export default SmartRevisionQuestionList;
