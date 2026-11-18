import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { useGoalStore } from '@/app/stores/useGoalStore';
import { getDonorTier } from '@/shared/types/donor';
import type { MockServerEntry, ResolvedMock } from '@/shared/types/mock';
import { fetchMockCatalog } from '../api/mockTest';
import { resolveMockState } from '../utils/mockState';

interface UseMockCatalogResult {
    mocks: ResolvedMock[];
    loading: boolean;
    error: string | null;
}

export function useMockCatalog(): UseMockCatalogResult {
    const user = useAuthStore((s) => s.user);
    const userGoal = useGoalStore((s) => s.userGoal);
    const branchId = userGoal?.branch_id?.toUpperCase() ?? null;
    const userTier = getDonorTier(user?.notification_tags);
    const isAuthenticated = !!user && user.id !== '1';

    const [serverEntries, setServerEntries] = useState<MockServerEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [now, setNow] = useState(() => Date.now());

    // Fetch server catalog on mount + on branch change
    useEffect(() => {
        let cancelled = false;

        if (!branchId) {
            setServerEntries([]);
            setLoading(false);
            return;
        }

        (async () => {
            setLoading(true);
            setError(null);

            try {
                const entries = await fetchMockCatalog(branchId);

                if (!cancelled) {
                    setServerEntries(entries);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err instanceof Error ? err.message : 'Failed to load'
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [branchId]);

    // Tick every second so countdowns and live/upcoming states update live
    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(interval);
    }, []);

    // Order once per catalog fetch, not once per clock tick.
    const sortedEntries = useMemo(
        () =>
            [...serverEntries].sort(
                (a, b) =>
                    new Date(a.starts_at).getTime() -
                        new Date(b.starts_at).getTime() ||
                    (a.series_number ?? Infinity) -
                        (b.series_number ?? Infinity)
            ),
        [serverEntries]
    );

    // Server is the single source of truth for mock data and display hints.
    const mocks = useMemo<ResolvedMock[]>(() => {
        if (!branchId) return [];

        return sortedEntries.map((server) =>
            resolveMockState({
                server,
                userTier,
                isAuthenticated,
                now,
            })
        );
    }, [branchId, sortedEntries, userTier, isAuthenticated, now]);

    return { mocks, loading, error };
}
