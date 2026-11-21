import { useCallback, useEffect, useRef, useState } from 'react';
import {
    cacheTestSessions,
    getCompletedTestSessions,
    getOngoingTestSession,
    pruneLocalHistory,
} from '@/features/topic-test/services/testSession';
import type { DonorTier } from '@/shared/types/donor';
import type { TestSession } from '@/shared/types/storage';
import {
    fetchTestHistory,
    getActiveTest,
    TEST_HISTORY_PAGE_SIZE,
} from '../api/topicTest';
import { syncTestFromSupabaseToDexie } from '../services/testSyncService';
import { isMockSessionEmbargoed } from '../utils/mockState';

const completedAt = (session: TestSession) =>
    new Date(session.completed_at || 0).getTime();

const byCompletedAtDesc = (a: TestSession, b: TestSession) =>
    completedAt(b) - completedAt(a);

const dedupeById = (rows: TestSession[]) => {
    const seen = new Set<string>();
    return rows.filter((row) => {
        if (seen.has(row.id)) return false;
        seen.add(row.id);
        return true;
    });
};

const visibleHistory = (rows: TestSession[], now: number) =>
    rows.filter((row) => !isMockSessionEmbargoed(row, now));

const useTopicTestHubData = (
    userId: string | undefined,
    branchId: string | undefined,
    donorTier: DonorTier = 0
) => {
    const isDonor = donorTier >= 1;

    const [activeTest, setActiveTest] = useState<TestSession | null>(null);
    const [history, setHistory] = useState<TestSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(false);

    // Number of server rows already consumed by the current list.
    const offsetRef = useRef(0);
    // Stops late responses from a previous branch/tier from landing.
    const requestRef = useRef(0);

    useEffect(() => {
        const requestId = ++requestRef.current;
        offsetRef.current = 0;
        setActiveTest(null);
        setHistory([]);
        setHasMore(false);
        setLoading(true);
        setLoadingMore(false);

        const isCurrent = () => requestRef.current === requestId;

        const loadData = async () => {
            if (!userId || !branchId) return;

            try {
                // ─── Active test resolution ────────────────────
                // Query Supabase first — it's authoritative and it
                // includes mock sessions, which never enter Dexie.
                const { data: supaActive } = await getActiveTest(
                    userId,
                    branchId
                );
                if (!isCurrent()) return;

                if (supaActive) {
                    const paperId =
                        (supaActive as unknown as TestSession).paper_id ?? '';
                    const isMock =
                        paperId.startsWith('mock-') &&
                        !paperId.includes('-practice-');

                    if (isMock) {
                        // Mock — display directly from Supabase row.
                        // Don't cache to Dexie (security boundary).
                        setActiveTest(supaActive as unknown as TestSession);
                    } else {
                        // Topic test — sync to Dexie so the topic-test
                        // engine can read it, then display from Dexie.
                        await syncTestFromSupabaseToDexie(userId, branchId);
                        const local = await getOngoingTestSession(branchId);
                        if (!isCurrent()) return;
                        setActiveTest(local[0] || null);
                    }
                } else {
                    // No active in Supabase — try Dexie (offline case).
                    const local = await getOngoingTestSession(branchId);
                    if (!isCurrent()) return;
                    setActiveTest(local[0] || null);
                }

                // ─── History ──────────────────────────────────
                // Embargoed mock attempts must not leak into history:
                // the row would expose the score before the official
                // window closes. Filter before caching too, so the
                // score never lands in IndexedDB.
                //
                // Free users get exactly one page; donors fetch one
                // extra row so we know whether "Load more" is needed.
                const now = Date.now();
                const { data: supaSessions, error: supaError } =
                    await fetchTestHistory(userId, branchId, {
                        limit: isDonor
                            ? TEST_HISTORY_PAGE_SIZE + 1
                            : TEST_HISTORY_PAGE_SIZE,
                        offset: 0,
                    });
                if (!isCurrent()) return;

                if (supaError) {
                    console.error('Error fetching test history', supaError);
                    const localFallback =
                        (await getCompletedTestSessions(branchId)) ?? [];
                    if (!isCurrent()) return;

                    const rows = visibleHistory(localFallback, now).sort(
                        byCompletedAtDesc
                    );
                    setHistory(
                        isDonor ? rows : rows.slice(0, TEST_HISTORY_PAGE_SIZE)
                    );
                    setHasMore(false);
                    return;
                }

                const serverRows = (supaSessions ??
                    []) as unknown as TestSession[];
                const page = visibleHistory(
                    serverRows.slice(0, TEST_HISTORY_PAGE_SIZE),
                    now
                );

                await cacheTestSessions(page);
                // Keep the offline copy in sync with server retention.
                // Donors are unlimited, so their cache is never pruned.
                await pruneLocalHistory(
                    branchId,
                    isDonor ? null : TEST_HISTORY_PAGE_SIZE
                );
                if (!isCurrent()) return;

                const localRows = visibleHistory(
                    (await getCompletedTestSessions(branchId)) ?? [],
                    now
                );
                if (!isCurrent()) return;

                // Donors paginate from the server, so only unsynced
                // local sessions are merged into every page. Free users
                // mirror the server retention locally, so the whole
                // (already bounded) local set can be merged.
                const localExtras = isDonor
                    ? localRows.filter((row) => row.is_synced === 0)
                    : localRows;
                const merged = dedupeById([...page, ...localExtras]).sort(
                    byCompletedAtDesc
                );

                setHistory(
                    isDonor ? merged : merged.slice(0, TEST_HISTORY_PAGE_SIZE)
                );
                setHasMore(
                    isDonor && serverRows.length > TEST_HISTORY_PAGE_SIZE
                );
                offsetRef.current = Math.min(
                    serverRows.length,
                    TEST_HISTORY_PAGE_SIZE
                );
            } catch (error) {
                console.error('Failed to load topic test hub data:', error);
            } finally {
                if (isCurrent()) setLoading(false);
            }
        };

        loadData();
    }, [userId, branchId, isDonor]);

    const loadMore = useCallback(async () => {
        if (!isDonor || !userId || !branchId || loadingMore || !hasMore) {
            return;
        }

        const requestId = requestRef.current;
        setLoadingMore(true);

        try {
            const now = Date.now();
            const { data, error } = await fetchTestHistory(userId, branchId, {
                limit: TEST_HISTORY_PAGE_SIZE + 1,
                offset: offsetRef.current,
            });
            if (requestRef.current !== requestId) return;

            if (error) {
                console.error('Error loading more test history', error);
                return;
            }

            const serverRows = (data ?? []) as unknown as TestSession[];
            const page = visibleHistory(
                serverRows.slice(0, TEST_HISTORY_PAGE_SIZE),
                now
            );

            if (page.length) {
                await cacheTestSessions(page);
            }
            if (requestRef.current !== requestId) return;

            offsetRef.current += Math.min(
                serverRows.length,
                TEST_HISTORY_PAGE_SIZE
            );

            setHistory((prev) =>
                dedupeById([...prev, ...page]).sort(byCompletedAtDesc)
            );
            setHasMore(serverRows.length > TEST_HISTORY_PAGE_SIZE);
        } catch (error) {
            console.error('Failed to load more test history:', error);
        } finally {
            if (requestRef.current === requestId) setLoadingMore(false);
        }
    }, [branchId, hasMore, isDonor, loadingMore, userId]);

    return { loading, loadingMore, hasMore, activeTest, history, loadMore };
};

export default useTopicTestHubData;
