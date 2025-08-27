/**
 * @file App.jsx
 * @description This is the root component of the GATEQuest application.
 * It sets up the global context providers and initializes the router.
 * The component ensures that all child components have access to necessary
 * contexts like authentication, application settings, stats, and theme.
 */

import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppProvider from './context/AppProvider.tsx';
import AuthProvider from './context/AuthProvider.tsx';
import StatsProvider from './context/StatsProvider.tsx';
import AppRoutes from './routes/AppRoutes.tsx';

/**
 * @function App
 * @description The main application component that orchestrates the provider hierarchy.
 * The order of providers is intentional: core functionalities like stats and auth
 * wrap feature-specific contexts.
 */
function App() {
    return (
        // StatsProvider manages user's practice statistics.
        <StatsProvider>
            {/* AuthProvider handles user authentication state and logic. */}
            <AuthProvider>
                {/* AppProvider manages general application settings, like sound effects. */}
                <AppProvider>
                    {/* Router provides the client-side routing functionality. */}
                    <Router>
                        {/* AppRoutes contains all the defined application routes. */}
                        <AppRoutes />
                    </Router>
                </AppProvider>
            </AuthProvider>
        </StatsProvider>
    );
}

export default App;
