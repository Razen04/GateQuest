// 1. Core and external library imports
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

// 2. Custom hook imports - This is where we abstract all the heavy lifting.
import useQuestions from '../../hooks/useQuestions.ts'; // Fetches the raw question data.

// 3. Component imports - Breaking the UI into smaller, manageable pieces.
import ModernLoader from '../../components/ui/ModernLoader.js';
import QuestionsList from '@/components/QuestionsList/QuestionsList.tsx';
import type { Question } from '@/types/question.ts';

// This component is the main hub for showing list of questions. It's responsible for:
// - Fetching all questions for a subject.
// - Providing UI for searching, filtering, and sorting.
// - Displaying the filtered list of questions, with pagination.
// - Navigating to the detailed QuestionCard view.
const PracticeList = () => {
    // --- Initial Setup & Data Sourcing ---

    // Standard React Router hooks to get our bearings.
    const navigate = useNavigate();
    const { subject } = useParams(); // e.g., 'Aptitude', 'Data Structures' from the URL /practice/:subject

    // We need to read URL params to initialize our state.
    const [searchParams] = useSearchParams();
    // Specifically pulling 'bookmarked' here because the initial data fetch depends on it.
    // The other params are handled by the useUrlFilters hook.
    const bookmarked = searchParams.get('bookmarked') === 'true';

    // Fetch the questions. This hook handles the loading and error states for us.
    // It takes the subject and the bookmarked flag to get the base dataset.
    const { questions, isLoading, error } = useQuestions(subject, bookmarked);

    // --- Event Handlers ---

    // This is the crucial navigation step to the QuestionCard.
    const handleQuestionClick = (id: string, currentFilteredList: Question[]) => {
        const currentQueryString = window.location.search;
        // Navigate to the specific question URL, making sure to include the current filter query string.
        navigate(`/practice/${subject}/${id}?${currentQueryString}`, {
            // This is the most important part: we pass the entire filtered list in the route's state.
            // This allows the QuestionCard to render instantly without re-fetching or re-filtering.
            state: { questions: currentFilteredList },
        });
    };

    // --- Render Logic ---

    // Handle the loading state while we're fetching questions.
    if (isLoading) {
        return (
            <div className="w-full pb-20 flex justify-center items-center text-gray-600">
                <ModernLoader />
            </div>
        );
    }

    // Handle any errors during the fetch.
    if (error) {
        return <div>Failed to load questions, try again later.</div>;
    }

    if (!subject) return;

    return (
        <QuestionsList
            questions={questions}
            title={`${subject} Questions`}
            onBack={() => navigate('/practice')}
            onQuestionClick={handleQuestionClick}
            subject={subject}
            mode="practice"
        />
    );
};

export default PracticeList;
