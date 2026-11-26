import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { FullMockLeaderboard } from '../components/mock/leaderboard/FullMockLeaderboard';
import { TestPageShell } from '../components/TestPageShell';

const PICKER_PATH = '/topic-test-generate?tab=mocks';

export default function MockTestLeaderboard() {
    const { mockId } = useParams<{ mockId: string }>();
    const navigate = useNavigate();
    const user = useAuthStore((s) => s.user);
    const isLogin = !!user && user.id !== '1';

    if (!mockId) return <Navigate to={PICKER_PATH} replace />;
    if (!isLogin) return <Navigate to="/" replace />;

    return (
        <TestPageShell
            onBack={() => navigate(PICKER_PATH)}
            caption="Leaderboard"
        >
            <FullMockLeaderboard mockId={mockId} />
        </TestPageShell>
    );
}
