/**
 * @file App.jsx
 * @description This is the root component of the GATEQuest application.
 * It sets up the global context providers and initializes the router.
 * The component ensures that all child components have access to necessary
 * contexts like authentication, application settings, stats, and theme.
 */

import { BrowserRouter as Router } from 'react-router-dom';
import AppProvider from '@/app/providers/AppProvider.tsx';
import AuthProvider from '@/app/providers/AuthProvider.tsx';
import StatsProvider from '@/app/providers/StatsProvider.tsx';
import AppRoutes from '@/app/routes/AppRoutes.tsx';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { GoalProvider } from '@/app/providers/GoalProvider.tsx';

/**
 * @function App
 * @description The main application component that orchestrates the provider hierarchy.
 * The order of providers is intentional: core functionalities like stats and auth
 * wrap feature-specific contexts.
 */
function App() {
    return (
        // Router must be at the very top so hooks like useNavigate() work inside Providers
        <Router>
            {/* GoalProvider manages user's exam goals. */}
            <GoalProvider>
                {/* StatsProvider manages user's practice statistics. */}
                <StatsProvider>
                    {/* AuthProvider handles user authentication state and logic. */}
                    <AuthProvider>
                        {/* AppProvider manages general application settings, like sound effects. */}
                        <AppProvider>
                            {/* AppRoutes contains all the defined application routes. */}
                            <AppRoutes />

                            {/* Vercel Speed Insights */}
                            <SpeedInsights />
                        </AppProvider>
                    </AuthProvider>
                </StatsProvider>
            </GoalProvider>
        </Router>
    );
}

export default App;
