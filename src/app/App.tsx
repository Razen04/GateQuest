/**
 * @file App.jsx
 * @description This is the root component of the GATEQuest application.
 * It sets up the global context providers and initializes the router.
 * The component ensures that all child components have access to necessary
 * contexts like authentication, application settings, stats, and theme.
 */

import { SpeedInsights } from '@vercel/speed-insights/react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from '@/app/routes/AppRoutes.tsx';
import { OfflineBanner } from '@/shared/components/OfflineBanner';
import { useAuthEffects } from './effects/useAuthEffects';
import { useGoalEffects } from './effects/useGoalEffects';
import { useOfflineEffects } from './effects/useOfflineEffects';
import { useSettingsEffects } from './effects/useSettingsEffects';
import { useStatsEffects } from './effects/useStatsEffects';

function AppContent() {
    useSettingsEffects();
    useAuthEffects();
    useGoalEffects();
    useStatsEffects();
    useOfflineEffects();

    return <AppRoutes />;
}

function App() {
    return (
        <Router>
            <AppContent />
            <SpeedInsights />
            <OfflineBanner />
        </Router>
    );
}

export default App;
