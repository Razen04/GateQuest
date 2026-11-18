import {
    ArrowRightIcon,
    ArrowUpRightIcon,
    ChartLineUpIcon,
    LockIcon,
    TrophyIcon,
} from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import ModernLoader from '@/shared/components/ModernLoader';
import PageHeader from '@/shared/components/PageHeader';
import { Button } from '@/shared/components/ui/button';
import type {
    MockAnalysisResponse,
    MockSummaryResponse,
} from '@/shared/types/mock';
import type { Attempt } from '@/shared/types/storage';
import { getMockAnalysis, getMockSummary } from '../api/mockTest';
import { fetchAttemptsWithQuestions } from '../api/topicTest';
import MockLeaderboardSection from '../components/mock/MockLeaderboardSection';
import MockResultsEmbargo from '../components/mock/MockResultsEmbargo';
import { StatMetricCard } from '../components/StatMetricCard';
import { TestPageShell } from '../components/TestPageShell';
import TestAnalysisBody from '../components/test-result/TestAnalysisBody';
import type { FullAttempt } from '../types/testTypes';
import { fmtNum } from '../utils/mockFormat';

const PICKER_PATH = '/topic-test-generate?tab=mocks';

export default function MockTestResult() {
    const { testId } = useParams<{ testId: string }>();
    const navigate = useNavigate();

    const [summary, setSummary] = useState<
        MockSummaryResponse | { error: string } | null
    >(null);
    const [summaryLoading, setSummaryLoading] = useState(true);

    const [analysis, setAnalysis] = useState<
        MockAnalysisResponse | { error: string } | null
    >(null);
    const [analysisLoading, setAnalysisLoading] = useState(false);

    const [attempts, setAttempts] = useState<Attempt[]>([]);
    const [attemptsLoading, setAttemptsLoading] = useState(false);

    const fetchSummary = useCallback(async () => {
        if (!testId) return;
        setSummaryLoading(true);
        const res = await getMockSummary(testId);
        setSummary(res);
        setSummaryLoading(false);
    }, [testId]);

    useEffect(() => {
        void fetchSummary();
    }, [fetchSummary]);

    // Fetch analysis once the summary tells us it's unlocked
    const analysisUnlocked =
        summary !== null &&
        !('error' in summary) &&
        summary.results_released === true &&
        summary.analysis_unlocked === true;

    useEffect(() => {
        if (!analysisUnlocked || !testId || analysis) return;
        let cancelled = false;
        (async () => {
            setAnalysisLoading(true);
            const res = await getMockAnalysis(testId);
            if (!cancelled) setAnalysis(res);
            setAnalysisLoading(false);
        })();
        return () => {
            cancelled = true;
        };
    }, [analysisUnlocked, testId, analysis]);

    useEffect(() => {
        if (!analysisUnlocked || !testId || attempts.length > 0) return;
        let cancelled = false;
        (async () => {
            setAttemptsLoading(true);
            const { data } = await fetchAttemptsWithQuestions(testId);
            if (!cancelled) {
                // Supabase rows carry the same attempt fields, but the
                // generated type widens nullable columns. Downstream
                // views already normalise what they read.
                setAttempts((data ?? []) as unknown as Attempt[]);
                setAttemptsLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [analysisUnlocked, testId, attempts.length]);

    if (!testId) return <Navigate to={PICKER_PATH} replace />;

    if (summaryLoading && !summary) {
        return <ModernLoader />;
    }

    if (!summary) {
        return (
            <TestPageShell
                onBack={() => navigate(PICKER_PATH)}
                backLabel="Back to Mock Tests"
                maxWidth="max-w-7xl"
            >
                <div className="text-center py-12">
                    <p className="text-sm text-destructive mb-4">
                        Failed to load result.
                    </p>
                    <Button
                        variant="outline"
                        onClick={() => void fetchSummary()}
                        className="rounded-none"
                    >
                        Retry
                    </Button>
                </div>
            </TestPageShell>
        );
    }

    if ('error' in summary && summary.error === 'not_a_mock_attempt') {
        return <Navigate to={`/topic-test-result/${testId}`} replace />;
    }

    // ── Not completed / not found ──────────────────────────
    if ('error' in summary) {
        return (
            <TestPageShell
                onBack={() => navigate(PICKER_PATH)}
                backLabel="Back to Mock Tests"
                maxWidth="max-w-7xl"
            >
                <div className="border border-border bg-card/60 p-8 text-center">
                    <h1 className="text-xl font-bold text-foreground mb-2">
                        {summary.error === 'not_completed'
                            ? 'Attempt not completed'
                            : summary.error === 'not_found'
                              ? 'Attempt not found'
                              : 'Result unavailable'}
                    </h1>
                    <p className="text-sm text-muted-foreground mb-6">
                        {summary.error === 'not_completed'
                            ? 'Resume your attempt to finish it.'
                            : "We couldn't find that attempt. It may have been deleted."}
                    </p>
                    {summary.error === 'not_completed' ? (
                        <Button
                            onClick={() =>
                                navigate(`/mock-tests/attempt/${testId}`)
                            }
                            className="rounded-none bg-chart-1 text-white hover:bg-chart-1/90"
                        >
                            Resume Attempt
                        </Button>
                    ) : (
                        <Button
                            variant="outline"
                            onClick={() => navigate(PICKER_PATH)}
                            className="rounded-none"
                        >
                            Back to Mock Tests
                        </Button>
                    )}
                </div>
            </TestPageShell>
        );
    }

    if (summary.results_released === false) {
        return (
            <TestPageShell
                onBack={() => navigate(PICKER_PATH)}
                backLabel="Back to Mock Tests"
                maxWidth="max-w-7xl"
            >
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-foreground">
                        Mock Result
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Submitted. Waiting for the window to close.
                    </p>
                </div>
                <MockResultsEmbargo
                    resultsAt={summary.results_at}
                    onReleased={() => void fetchSummary()}
                />
            </TestPageShell>
        );
    }

    const isReAttempt = summary.is_re_attempt;
    const analysisSuccess =
        analysis &&
        !('error' in analysis) &&
        analysis.results_released === true;
    const rank = analysisSuccess ? analysis.rank : null;
    const percentile = analysisSuccess ? analysis.percentile : null;
    const totalParticipants = analysisSuccess
        ? analysis.total_participants
        : null;
    const analysisNote = analysisSuccess ? analysis.note : undefined;

    return (
        <TestPageShell
            onBack={() => navigate(PICKER_PATH)}
            backLabel="Back to Mock Tests"
            maxWidth="max-w-7xl"
        >
            <div className="mb-6 flex flex-wrap items-center gap-2">
                <PageHeader primaryTitle="Quest" secondaryTitle="Mock Result" />
                {isReAttempt && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-muted text-muted-foreground border border-border">
                        Re-attempt
                    </span>
                )}
            </div>

            {/* Three free numbers using StatMetricCard */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6"
            >
                <StatMetricCard
                    label="Total Score"
                    value={`${fmtNum(summary.total_score)}/${summary.total_marks}`}
                    accent="text-chart-1"
                    icon={TrophyIcon}
                />
                <StatMetricCard
                    label="Positive"
                    value={`+${fmtNum(summary.positive_score)}`}
                    accent="text-chart-2"
                />
                <StatMetricCard
                    label="Negative"
                    value={`-${fmtNum(Math.abs(summary.negative_score))}`}
                    accent="text-destructive"
                />
            </motion.div>

            <p className="text-xs text-muted-foreground mb-6">
                Attempted {summary.attempted_count} questions.
            </p>

            {/* Analysis (donor / beta) */}
            {analysisUnlocked ? (
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 }}
                    className="backdrop-blur-2xl mb-6"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <ChartLineUpIcon
                            size={18}
                            className="text-chart-1"
                            weight="duotone"
                        />
                        <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                            Analysis
                        </h2>
                    </div>

                    {analysisLoading && !analysis && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {[0, 1, 2].map((i) => (
                                <div
                                    key={i}
                                    className="h-20 border border-border bg-muted/20 animate-pulse"
                                />
                            ))}
                        </div>
                    )}

                    {analysis && 'error' in analysis && (
                        <p className="text-sm text-muted-foreground">
                            {analysis.error === 'embargoed'
                                ? 'Analysis unlocks when the window closes.'
                                : analysis.error === 'tier_required' &&
                                    'min_tier' in analysis
                                  ? `Analysis requires tier ${analysis.min_tier ?? 1}+.`
                                  : 'Analysis unavailable.'}
                        </p>
                    )}

                    {analysisSuccess && (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                                <StatMetricCard
                                    label="Rank"
                                    value={rank != null ? `#${rank}` : '—'}
                                    sub={
                                        totalParticipants != null
                                            ? `of ${totalParticipants}`
                                            : undefined
                                    }
                                />
                                <StatMetricCard
                                    label="Percentile"
                                    value={
                                        percentile != null
                                            ? `${percentile.toFixed(1)}`
                                            : '—'
                                    }
                                />
                                <StatMetricCard
                                    label="Participants"
                                    value={
                                        totalParticipants != null
                                            ? String(totalParticipants)
                                            : '—'
                                    }
                                />
                            </div>
                            {analysisNote && (
                                <p className="text-xs text-muted-foreground mb-3">
                                    {analysisNote}
                                </p>
                            )}
                            <Button
                                onClick={() =>
                                    navigate(`/topic-test-review/${testId}/0`)
                                }
                                className="rounded-none"
                            >
                                Review Solutions
                                <ArrowUpRightIcon
                                    size={14}
                                    className="ml-1.5"
                                />
                            </Button>
                        </>
                    )}

                    {summary.mock_id && (
                        <div className="my-4">
                            <MockLeaderboardSection
                                mockId={summary.mock_id}
                                isReAttempt={isReAttempt}
                            />
                        </div>
                    )}

                    {attemptsLoading ? (
                        <div className="border border-border bg-card/60 p-6 text-sm text-muted-foreground">
                            Loading question-by-question analysis…
                        </div>
                    ) : attempts.length > 0 ? (
                        <TestAnalysisBody
                            attempts={attempts as FullAttempt[]}
                            testId={testId}
                        />
                    ) : null}
                </motion.div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 }}
                    className="border border-chart-4/30 bg-chart-4/5 p-6 mb-6"
                >
                    <div className="flex items-center gap-2 mb-3">
                        <LockIcon
                            size={20}
                            className="text-chart-4"
                            weight="fill"
                        />
                        <h2 className="text-sm font-bold uppercase tracking-wider text-chart-4">
                            Analysis Locked
                        </h2>
                    </div>
                    <p className="text-sm text-foreground mb-4">
                        Unlock rank, percentile, per-question review, and
                        practice from this mock by upgrading to tier 1+ (₹50
                        cumulative). Beta mocks are free.
                    </p>
                    <Button
                        onClick={() => navigate('/donate')}
                        className="rounded-none bg-chart-4 text-white hover:bg-chart-4/90"
                    >
                        Learn About Supporter Perks
                        <ArrowRightIcon size={14} className="ml-1.5" />
                    </Button>
                </motion.div>
            )}
        </TestPageShell>
    );
}
