/**
 * @file AppRoutes.jsx
 * @description This file defines the main routing structure for the application using react-router-dom.
 * It handles route protection based on authentication status, ensuring that users are directed appropriately based on whether they are logged in or not. It also orchestrates the overall page layout.
 */

import ModernLoader from '@/shared/components/ModernLoader.js';
import LandingPage from '@/features/landing/pages/LandingPage.tsx';
import Layout from '@/app/layout/Layout.jsx';
import Dashboard from '@/features/dashboard/pages/DashboardPage';
import SettingsRoutes from '@/app/routes/SettingsRoutes';
import About from '@/features/about/pages/AboutPage';
import { Navigate, Route, Routes } from 'react-router-dom';
import useAuth from '@/shared/hooks/useAuth';
import DonationPage from '@/features/donations/pages/DonationsPage';
import PracticeList from '@/features/practice/components/PracticeList';
import SmartRevision from '@/features/smart-revision/pages/SmartRevisionPage';
import SmartRevisionQuestionList from '@/features/smart-revision/components/SmartRevisionQuestionList';
import PracticeCard from '@/features/practice/components/PracticeCard';
import SmartRevisionQuestionCard from '@/features/smart-revision/components/SmartRevisionQuestionCard';
import TopicTest from '@/features/topic-test/pages/TopicTest';
import TopicTestGeneratePage from '@/features/topic-test/components/topic-test-generator/TopicTestGenerate';
import TopicTestLobby from '@/features/topic-test/pages/TopicTestLobby';
import TopicTestSessionPage from '@/features/topic-test/pages/TopicTestSession';
import TopicTestResult from '@/features/topic-test/pages/TopicTestResult';
import TestSolutionView from '@/features/topic-test/components/TestSolutionView';
import TopicReviewLayout from '@/features/topic-test/components/TopicReviewLayout';
import Practice from '@/features/practice/pages/PracticePage';

/**
 * @function AppRoutes
 * @description Manages the application's routing logic.
 * It consumes the AuthContext to dynamically render routes based on the user's
 * authentication state and the initial loading status.
 */
export default function AppRoutes() {
    // isLogin and loading states are consumed from the AuthContext.
    const { isLogin, loading } = useAuth();

    return (
        <Routes>
            {/* While authentication status is being determined, a loader is shown. */}
            {/* This prevents a flash of the landing page for an already authenticated user. */}
            {loading ? (
                <Route path="*" element={<ModernLoader />} />
            ) : (
                <>
                    {/* This route handles the initial entry point of the application. */}
                    <Route
                        path="/"
                        element={
                            // If the user is logged in, redirect them to the dashboard.
                            // Otherwise, show the public landing page.
                            isLogin ? <Navigate to="/dashboard" replace /> : <LandingPage />
                        }
                    />

                    {/* All main application pages are nested within the Layout component. */}
                    {/* This provides a consistent UI shell (e.g., Navbar, Sidebar) for authenticated views. */}
                    <Route path="/" element={<Layout />}>
                        {/* The main dashboard, the first page after login. */}
                        <Route path="dashboard" element={<Dashboard />} />
                        {/* The practice section has nested routes for subjects and individual questions. */}
                        <Route path="practice" element={<Practice />} />
                        <Route path="practice/:subject" element={<PracticeList />} />
                        <Route path="practice/:subject/:qid" element={<PracticeCard />} />
                        {/* Settings routes are modularized into their own component for clarity. */}
                        <Route path="settings/*" element={<SettingsRoutes />} />
                        {/* A static 'About' page. */}
                        <Route path="about" element={<About landing={false} />} />
                        <Route path="donate" element={<DonationPage />} />
                        {/* The revision section has nested routes for revision list and individual questions. */}
                        <Route path="revision" element={<SmartRevision />} />
                        <Route path="revision/:rid" element={<SmartRevisionQuestionList />} />
                        <Route
                            path="revision/:rid/:subject/:qid"
                            element={<SmartRevisionQuestionCard />}
                        />

                        {/* Topic Test */}
                        <Route path="topic-test" element={<TopicTest />} />
                        <Route path="topic-test-generate" element={<TopicTestGeneratePage />} />
                        <Route path="topic-test/:testId" element={<TopicTestLobby />} />
                        <Route
                            path="topic-test/:testId/attempt"
                            element={<TopicTestSessionPage />}
                        />
                        <Route element={<TopicReviewLayout />}>
                            <Route path="topic-test-result/:testId" element={<TopicTestResult />} />
                            <Route
                                path="topic-test-review/:testId/:questionIndex"
                                element={<TestSolutionView />}
                            />
                        </Route>
                        {/* A catch-all route to handle undefined paths within the app. */}
                        {/* It redirects the user to the root to prevent 404 errors. */}
                        <Route path="*" element={<Navigate to="/" />} />
                    </Route>
                </>
            )}
        </Routes>
    );
}
