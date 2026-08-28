/**
 * @file AppRoutes.jsx
 * @description Main routing structure with optimized code-splitting.
 */

import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ModernLoader from '@/shared/components/ModernLoader.js';
import useAuth from '@/shared/hooks/useAuth';

// Shell & Nested Routers (Lazy Loaded)
const Layout = lazy(() => import('@/app/layout/Layout.jsx'));
const SettingsRoutes = lazy(() => import('@/app/routes/SettingsRoutes'));

// Feature Pages (Lazy Loaded)
const LandingPage = lazy(
    () => import('@/features/landing/pages/LandingPage.tsx')
);
const Dashboard = lazy(
    () => import('@/features/dashboard/pages/DashboardPage')
);
const Practice = lazy(() => import('@/features/practice/pages/PracticePage'));
const PracticeList = lazy(
    () => import('@/features/practice/components/PracticeList')
);
const PracticeCard = lazy(
    () => import('@/features/practice/components/PracticeCard')
);
const About = lazy(() => import('@/features/about/pages/AboutPage'));
const DonationPage = lazy(
    () => import('@/features/donations/pages/DonationsPage')
);
const ProfilePage = lazy(() => import('@/features/profile/ProfilePage'));
const SmartRevision = lazy(
    () => import('@/features/smart-revision/pages/SmartRevisionPage')
);
const SmartRevisionQuestionList = lazy(
    () =>
        import('@/features/smart-revision/components/SmartRevisionQuestionList')
);
const SmartRevisionQuestionCard = lazy(
    () =>
        import('@/features/smart-revision/components/SmartRevisionQuestionCard')
);
const TopicTest = lazy(() => import('@/features/topic-test/pages/TopicTest'));
const TopicTestGeneratePage = lazy(
    () =>
        import(
            '@/features/topic-test/components/topic-test-generator/TopicTestGenerate'
        )
);
const TopicTestLobby = lazy(
    () => import('@/features/topic-test/pages/TopicTestLobby')
);
const TopicTestSessionPage = lazy(
    () => import('@/features/topic-test/pages/TopicTestSession')
);
const TopicTestResult = lazy(
    () => import('@/features/topic-test/pages/TopicTestResult')
);
const TestSolutionView = lazy(
    () => import('@/features/topic-test/components/TestSolutionView')
);
const TopicReviewLayout = lazy(
    () => import('@/features/topic-test/components/TopicReviewLayout')
);

export default function AppRoutes() {
    const { isLogin, loading } = useAuth();

    if (loading) {
        return <ModernLoader />;
    }

    return (
        <Suspense fallback={<ModernLoader />}>
            <Routes>
                {/* Public / Landing Entry Point */}
                <Route
                    path="/"
                    element={
                        isLogin ? (
                            <Navigate to="/dashboard" replace />
                        ) : (
                            <LandingPage />
                        )
                    }
                />

                {/* Authenticated Layout Wrapper */}
                <Route path="/" element={<Layout />}>
                    <Route path="dashboard" element={<Dashboard />} />

                    {/* Practice */}
                    <Route path="practice" element={<Practice />} />
                    <Route
                        path="practice/:subject"
                        element={<PracticeList />}
                    />
                    <Route
                        path="practice/:subject/:qid"
                        element={<PracticeCard />}
                    />

                    {/* Settings Sub-router */}
                    <Route path="settings/*" element={<SettingsRoutes />} />

                    {/* Miscellaneous */}
                    <Route path="about" element={<About landing={false} />} />
                    <Route path="donate" element={<DonationPage />} />

                    {/* Revision */}
                    <Route path="revision" element={<SmartRevision />} />
                    <Route
                        path="revision/:rid"
                        element={<SmartRevisionQuestionList />}
                    />
                    <Route
                        path="revision/:rid/:subject/:qid"
                        element={<SmartRevisionQuestionCard />}
                    />

                    {/* Topic Test */}
                    <Route path="topic-test" element={<TopicTest />} />
                    <Route
                        path="topic-test-generate"
                        element={<TopicTestGeneratePage />}
                    />
                    <Route
                        path="topic-test/:testId"
                        element={<TopicTestLobby />}
                    />
                    <Route
                        path="topic-test/:testId/attempt"
                        element={<TopicTestSessionPage />}
                    />

                    <Route element={<TopicReviewLayout />}>
                        <Route
                            path="topic-test-result/:testId"
                            element={<TopicTestResult />}
                        />
                        <Route
                            path="topic-test-review/:testId/:questionIndex"
                            element={<TestSolutionView />}
                        />
                    </Route>

                    <Route path="/u/:username" element={<ProfilePage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
            </Routes>
        </Suspense>
    );
}
