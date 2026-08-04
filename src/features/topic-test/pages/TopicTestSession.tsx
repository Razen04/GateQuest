import { Navigate, useParams } from 'react-router-dom';
import { TestSessionProvider } from '@/features/topic-test/context/TestSessionProvider';
import ActiveTest from '../components/active-test/ActiveTest';

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
