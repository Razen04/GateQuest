/**
 * @file AppRoutes.jsx
 * @description This file defines the main routing structure for the application using react-router-dom.
 * It handles route protection based on authentication status, ensuring that users are directed appropriately based on whether they are logged in or not. It also orchestrates the overall page layout.
 */

import { useContext } from "react";
import AuthContext from "../context/AuthContext";
import ModernLoader from "../components/ModernLoader";
import LandingPage from "../pages/LandingPage";
import Layout from "../components/Layout";
import Dashboard from "../pages/Dashboard";
import Practice from "../pages/Practice Page/Practice";
import QuestionsList from "../pages/Practice Page/QuestionList";
import QuestionCard from "../pages/Practice Page/QuestionCard";
import SettingsRoutes from "./SettingsRoutes";
import About from "../pages/About";
import { Navigate, Route, Routes } from "react-router-dom";

/**
 * @function AppRoutes
 * @description Manages the application's routing logic.
 * It consumes the AuthContext to dynamically render routes based on the user's
 * authentication state and the initial loading status.
 */
export default function AppRoutes() {
    // isLogin and loading states are consumed from the AuthContext.
    const { isLogin, loading } = useContext(AuthContext);

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
                            isLogin ? (
                            <Navigate to="/dashboard" replace />
                        ) : (
                            <LandingPage />
                        )
                        }
                    />

                    {/* All main application pages are nested within the Layout component. */}
                    {/* This provides a consistent UI shell (e.g., Navbar, Sidebar) for authenticated views. */}
                    <Route path="/" element={<Layout />}>
                        {/* The main dashboard, the first page after login. */}
                        <Route path="dashboard" element={<Dashboard />} />
                        {/* The practice section has nested routes for subjects and individual questions. */}
                        <Route path="practice" element={<Practice />} />
                        <Route path="practice/:subject" element={<QuestionsList />} />
                        <Route path="practice/:subject/:qid" element={<QuestionCard />} />
                        {/* Settings routes are modularized into their own component for clarity. */}
                        <Route path="settings/*" element={<SettingsRoutes />} />
                        {/* A static 'About' page. */}
                        <Route path="about" element={<About />} />
                        {/* A catch-all route to handle undefined paths within the app. */}
                        {/* It redirects the user to the root to prevent 404 errors. */}
                        <Route path="*" element={<Navigate to="/" />} />
                    </Route>
                </>
            )}

        </Routes>
    );
}