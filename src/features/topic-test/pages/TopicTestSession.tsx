import { Navigate, useParams } from 'react-router-dom';
import ActiveTest from '../components/active-test/ActiveTest';
import { TestSessionProvider } from '@/features/topic-test/context/TestSessionProvider';

const TopicTestSessionPage = () => {
    const { testId } = useParams();
    // If no ID, go back to dashboard
    if (!testId) return <Navigate to="/dashboard" />;

    return (
        <TestSessionProvider testId={testId}>
            <ActiveTest />
        </TestSessionProvider>
    );
};

export default TopicTestSessionPage;
