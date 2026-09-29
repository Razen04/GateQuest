import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

vi.mock('@/shared/utils/helper', () => ({
    getUserProfile: vi.fn(),
}));

vi.mock('@/shared/utils/supabaseClient', () => ({
    supabase: { rpc: vi.fn() },
}));

import { getUserProfile } from '@/shared/utils/helper';
import { supabase } from '@/shared/utils/supabaseClient';
import { useGoalStore } from '../useGoalStore';
import { useStatsStore } from '../useStatsStore';

const makeExamStats = (over: Record<string, unknown> = {}) => ({
    overall_accuracy: 0,
    overall_attempted: 0,
    total_available: 0,
    subjects: [],
    ...over,
});

const makeDashboard = (over: Record<string, unknown> = {}) => ({
    exam_stats: {},
    dashboard_stats: {},
    streaks: {},
    heatmap: [],
    ...over,
});

const signedInProfile = { id: 'u1', version_number: 1 };

// --- reset -----------------------------------------------------------------
// Capture the store's initial data once, restore it before every test.
// The `false` second argument to setState is critical: it means "merge",
// not "replace". If you pass `true`, you wipe the action functions and
// every subsequent test crashes with "updateStats is not a function".

const initialStats = useStatsStore.getState().stats;

beforeEach(() => {
    vi.clearAllMocks();
    (getUserProfile as Mock).mockReturnValue(null);

    useStatsStore.setState({ stats: initialStats, loading: true }, false);

    useGoalStore.setState({ userGoal: null }, false);
});

describe('updateStats', () => {
    describe('early exits', () => {
        it.each([
            ['no profile at all', null],
            ['guest user (id === "1")', { id: '1', version_number: 1 }],
            ['missing version_number', { id: 'u1' }],
        ])('skips the RPC when %s', async (_, profile) => {
            (getUserProfile as Mock).mockReturnValue(profile);

            await useStatsStore.getState().updateStats();

            expect(supabase.rpc).not.toHaveBeenCalled();
            expect(useStatsStore.getState().loading).toBe(false);
        });
    });

    describe('error paths', () => {
        it('leaves stats untouched when the RPC returns an error', async () => {
            (getUserProfile as Mock).mockReturnValue(signedInProfile);
            (supabase.rpc as Mock).mockResolvedValue({
                data: null,
                error: { message: 'boom' },
            });

            const before = useStatsStore.getState().stats;
            await useStatsStore.getState().updateStats();

            expect(supabase.rpc).toHaveBeenCalledWith('get_my_dashboard');
            // The store must not have replaced the object.
            expect(useStatsStore.getState().stats).toBe(before);
        });

        it('leaves stats untouched when the RPC returns null data', async () => {
            (getUserProfile as Mock).mockReturnValue(signedInProfile);
            (supabase.rpc as Mock).mockResolvedValue({
                data: null,
                error: null,
            });

            const before = useStatsStore.getState().stats;
            await useStatsStore.getState().updateStats();

            expect(supabase.rpc).toHaveBeenCalledWith('get_my_dashboard');
            expect(useStatsStore.getState().stats).toBe(before);
        });

        it('swallows a rejected RPC call and leaves stats untouched', async () => {
            (getUserProfile as Mock).mockReturnValue(signedInProfile);
            (supabase.rpc as Mock).mockRejectedValue(new Error('network'));

            const before = useStatsStore.getState().stats;

            await expect(
                useStatsStore.getState().updateStats()
            ).resolves.toBeUndefined();

            expect(useStatsStore.getState().stats).toBe(before);
        });
    });

    describe('success paths', () => {
        it('applies defaults when the RPC returns an empty dashboard', async () => {
            (getUserProfile as Mock).mockReturnValue(signedInProfile);
            (supabase.rpc as Mock).mockResolvedValue({
                data: makeDashboard(),
                error: null,
            });

            await useStatsStore.getState().updateStats();

            const { stats } = useStatsStore.getState();
            expect(stats.progress).toBe(0);
            expect(stats.accuracy).toBe(0);
            expect(stats.subjectStats).toEqual([]);
            expect(stats.studyPlan.totalQuestions).toBe(0);
            expect(stats.studyPlan.remainingQuestions).toBe(0);
            expect(stats.studyPlan.progressPercent).toBe(0);
        });

        it('computes progress, streaks, and study plan from the RPC response', async () => {
            (getUserProfile as Mock).mockReturnValue(signedInProfile);
            (supabase.rpc as Mock).mockResolvedValue({
                data: makeDashboard({
                    exam_stats: {
                        GATE: makeExamStats({
                            overall_accuracy: 75,
                            overall_attempted: 40,
                            total_available: 100,
                            subjects: [{ id: 's1' }, { id: 's2' }],
                        }),
                    },
                    dashboard_stats: {
                        days_left: 30,
                        daily_question_target: 5,
                        today_unique_attempt_count: 3,
                        today_progress_percent: 60,
                        is_target_met_today: true,
                    },
                    streaks: {
                        study_current: 7,
                        study_longest: 14,
                        learning_current: 2,
                        learning_longest: 5,
                    },
                    heatmap: [{ date: '2025-01-01', count: 5 }],
                }),
                error: null,
            });

            await useStatsStore.getState().updateStats();

            const { stats } = useStatsStore.getState();
            expect(stats.progress).toBe(40); // 40 / 100
            expect(stats.accuracy).toBe(75);
            expect(stats.subjectStats).toEqual([{ id: 's1' }, { id: 's2' }]);
            expect(stats.subjectStatsMap).toEqual({
                GATE: [{ id: 's1' }, { id: 's2' }],
            });
            expect(stats.heatmapData).toEqual([
                { date: '2025-01-01', count: 5 },
            ]);
            expect(stats.streaks).toEqual({
                study_current: 7,
                study_longest: 14,
                learning_current: 2,
                learning_longest: 5,
            });
            expect(stats.studyPlan).toEqual({
                totalQuestions: 100,
                uniqueAttemptCount: 40,
                remainingQuestions: 60,
                daysLeft: 30,
                dailyQuestionTarget: 5,
                todayUniqueAttemptCount: 3,
                progressPercent: 40,
                todayProgressPercent: 60,
                isTargetMetToday: true,
            });
        });

        it('rounds progress to the nearest integer', async () => {
            (getUserProfile as Mock).mockReturnValue(signedInProfile);
            (supabase.rpc as Mock).mockResolvedValue({
                data: makeDashboard({
                    exam_stats: {
                        // 1/3 * 100 = 33.33…
                        GATE: makeExamStats({
                            overall_attempted: 1,
                            total_available: 3,
                        }),
                    },
                }),
                error: null,
            });

            await useStatsStore.getState().updateStats();

            expect(useStatsStore.getState().stats.progress).toBe(33);
        });

        it('uses the user goal target exams to pick the primary exam', async () => {
            (getUserProfile as Mock).mockReturnValue(signedInProfile);
            useGoalStore.setState({
                userGoal: { target_exams: ['ese'], branch_id: 'cs' } as never,
            });
            (supabase.rpc as Mock).mockResolvedValue({
                data: makeDashboard({
                    exam_stats: {
                        GATE: makeExamStats({
                            overall_accuracy: 10,
                            subjects: [{ id: 'gate-algo' }],
                        }),
                        ESE: makeExamStats({
                            overall_accuracy: 90,
                            subjects: [{ id: 'ese-algo' }],
                        }),
                    },
                }),
                error: null,
            });

            await useStatsStore.getState().updateStats();

            const { stats } = useStatsStore.getState();
            expect(stats.accuracy).toBe(90);
            expect(stats.subjectStats).toEqual([{ id: 'ese-algo' }]);
            expect(stats.subjectStatsMap).toEqual({
                ESE: [{ id: 'ese-algo' }],
            });
        });

        it('falls back to GATE when there is no user goal', async () => {
            (getUserProfile as Mock).mockReturnValue(signedInProfile);
            (supabase.rpc as Mock).mockResolvedValue({
                data: makeDashboard({
                    exam_stats: {
                        GATE: makeExamStats({ overall_accuracy: 33 }),
                    },
                }),
                error: null,
            });

            await useStatsStore.getState().updateStats();

            expect(useStatsStore.getState().stats.accuracy).toBe(33);
        });

        it('falls back to GATE when target_exams is not an array', async () => {
            (getUserProfile as Mock).mockReturnValue(signedInProfile);
            useGoalStore.setState({
                userGoal: {
                    target_exams: 'not-an-array',
                    branch_id: 'cs',
                } as never,
            });
            (supabase.rpc as Mock).mockResolvedValue({
                data: makeDashboard({
                    exam_stats: {
                        GATE: makeExamStats({ overall_accuracy: 42 }),
                    },
                }),
                error: null,
            });

            await useStatsStore.getState().updateStats();

            expect(useStatsStore.getState().stats.accuracy).toBe(42);
        });
    });
});
