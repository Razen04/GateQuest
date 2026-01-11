/**
 * @file AppRoutes.jsx
 * @description This file defines the main routing structure for the application using react-router-dom.
 * It handles route protection based on authentication status, ensuring that users are directed appropriately based on whether they are logged in or not. It also orchestrates the overall page layout.
 */

import ModernLoader from '../components/ui/ModernLoader.js';
import LandingPage from '../pages/LandingPage.jsx';
import Layout from '../components/Layout.jsx';
import Dashboard from '../pages/Dashboard.jsx';
import Practice from '../pages/Practice/Practice.js';

import SettingsRoutes from './SettingsRoutes.js';
import About from '../pages/About.jsx';
import { Navigate, Route, Routes } from 'react-router-dom';
import useAuth from '../hooks/useAuth.ts';
import DonationPage from '../pages/Donations.tsx';
import PracticeList from '@/pages/Practice/PracticeList.tsx';
import SmartRevision from '@/pages/SmartRevision/SmartRevision.tsx';
import SmartRevisionQuestionList from '@/pages/SmartRevision/SmartRevisionQuestionList.tsx';
import PracticeCard from '../pages/Practice/PracticeCard.js';
import SmartRevisionQuestionCard from '@/pages/SmartRevision/SmartRevisionQuestionCard.tsx';
import TopicTest from '@/pages/TopicTest/TopicTest.tsx';
import TopicTestGeneratePage from '@/pages/TopicTest/topic-test-generator/TopicTestGenerate.tsx';
import TopicTestLobby from '@/pages/TopicTest/TopicTestLobby.tsx';
import TopicTestSessionPage from '@/pages/TopicTest/TopicTestSession.tsx';
import TopicTestResult from '@/pages/TopicTest/TopicTestResult.tsx';
import TestSolutionView from '@/pages/TopicTest/TestSolutionView.tsx';
import TopicReviewLayout from '@/pages/TopicTest/TopicReviewLayout.tsx';

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
