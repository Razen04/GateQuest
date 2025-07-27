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
import Contact from "../pages/Contact";
import { Navigate, Route, Routes } from "react-router-dom";

export default function AppRoutes() {
    const { isLogin } = useContext(AuthContext);

    return (
        <Routes>
            {/* Landing or Redirect */}
            <Route
                path="/"
                element={
                    isLogin === undefined ? (
                        <ModernLoader />
                    ) : isLogin ? (
                        <Navigate to="/dashboard" replace />
                    ) : (
                        <LandingPage />
                    )
                }
            />

            {/* Authenticated and unauthenticated accessible pages */}
            <Route path="/" element={<Layout />}>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="practice" element={<Practice />} />
                <Route path="practice/:subject" element={<QuestionsList />} />
                <Route path="practice/:subject/:qid" element={<QuestionCard />} />
                <Route path="settings/*" element={<SettingsRoutes />} />
                <Route path="contact" element={<Contact />} />
                <Route path="*" element={<Navigate to="/" />} />
            </Route>
        </Routes>
    );
}