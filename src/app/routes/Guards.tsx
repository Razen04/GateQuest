import type React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/app/stores/useAuthStore';

// Guests have no account, so they never onboard.
const isGuest = (user: ReturnType<typeof useAuthStore.getState>['user']) =>
    !user || user.id === '1';

type GuardProps = { children: React.ReactNode };

/**
 * Wraps /onboarding. Redirects users who have already completed onboarding
 * back into the app, and redirects guests to the dashboard (they skip
 * onboarding entirely).
 */
export function RequireOnboarding({ children }: GuardProps) {
    const loading = useAuthStore((s) => s.loading);
    const user = useAuthStore((s) => s.user);

    if (loading) return null; // wait for session to resolve
    if (isGuest(user)) return <Navigate to="/dashboard" replace />;
    if (user?.onboarding_completed) return <Navigate to="/dashboard" replace />;

    return <>{children}</>;
}

/**
 * Wraps the main app (Layout). Redirects authenticated users who have not
 * completed onboarding to /onboarding. Guests pass through untouched.
 */
export function RequireCompletedSetup({ children }: GuardProps) {
    const loading = useAuthStore((s) => s.loading);
    const user = useAuthStore((s) => s.user);

    if (loading) return null;
    if (isGuest(user)) return <>{children}</>;
    if (!user?.onboarding_completed) {
        return <Navigate to="/onboarding" replace />;
    }

    return <>{children}</>;
}
