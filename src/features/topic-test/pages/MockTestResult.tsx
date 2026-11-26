import {
    ArrowsClockwiseIcon,
    ArrowUpRightIcon,
    ChartLineUpIcon,
    Clock,
    ListChecks,
    LockIcon,
    PresentationChart,
    Shapes,
    TrophyIcon,
} from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import AnimatedTabs, { type TabItem } from '@/shared/components/AnimatedTabs';
import ModernLoader from '@/shared/components/ModernLoader';
import PageHeader from '@/shared/components/PageHeader';
import { Button } from '@/shared/components/ui/button';
import type {
    MockAnalysisResponse,
    MockSummaryResponse,
} from '@/shared/types/mock';
import type { Attempt } from '@/shared/types/storage';
import { containerVariants } from '@/shared/utils/motionVariants';
import {
    getMockAnalysis,
    getMockSummary,
    practiceFromMock,
} from '../api/mockTest';
import { fetchAttemptsWithQuestions } from '../api/topicTest';
import { AttemptCountsStrip } from '../components/AttemptCountsStrip';
import { FullMockLeaderboard } from '../components/mock/leaderboard/FullMockLeaderboard';
import MockResultsEmbargo from '../components/mock/MockResultsEmbargo';
import { StatMetricCard } from '../components/StatMetricCard';
import { TestPageShell } from '../components/TestPageShell';
import {
    DifficultyAnalysis,
    OrderedQuestionGrid,
    PacingAnalysis,
    TimeSinksAndTypeAccuracy,
    TopicBreakdown,
    useTestAnalysis,
} from '../components/test-result/analysisSections';
import type { FullAttempt } from '../types/testTypes';
import { fmtNum } from '../utils/mockFormat';

const PICKER_PATH = '/topic-test-generate?tab=mocks';

type TabId =
    | 'analysis'
    | 'questions'
    | 'difficulty'
    | 'topic'
    | 'pacing'
    | 'leaderboard';

/** Locked tab body — the lock icon itself links to the donate page. */
function LockedTab() {
    return (
        <div className="border border-chart-4/30 bg-chart-4/5 p-8 text-center">
            <Link
                to="/donate"
                className="inline-flex flex-col items-center gap-3 group"
            >
                <LockIcon
                    size={32}
                    weight="fill"
                    className="text-chart-4 transition-transform group-hover:scale-110"
                />
                <span className="text-sm font-bold uppercase tracking-wider text-chart-4">
                    This section is locked
                </span>
                <span className="text-xs text-muted-foreground group-hover:text-foreground">
                    Unlock it with a supporter tier — beta mocks are free.
                </span>
            </Link>
        </div>
    );
}

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

    const [startingPractice, setStartingPractice] = useState(false);
    const [practiceError, setPracticeError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabId>('analysis');

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

    // The server folds beta mocks (post_min_tier = 0) and donor tiers into
    // this flag, so it is the single source of truth for tab gating.
    const analysisUnlocked =
        summary !== null &&
        !('error' in summary) &&
        summary.results_released === true &&
        summary.analysis_unlocked === true;
    const tabsLocked = !analysisUnlocked;

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

    const handlePractice = useCallback(async () => {
        if (
            !summary ||
            !('results_released' in summary) ||
            !summary.results_released ||
            !summary.mock_id
        )
            return;
        setStartingPractice(true);
        setPracticeError(null);

        const res = await practiceFromMock(summary.mock_id);
        setStartingPractice(false);

        if ('error' in res) {
            const messages: Record<string, string> = {
                must_complete_first: 'Complete the mock before practicing it.',
                tier_required: 'Practice requires a donor tier.',
                active_exists:
                    'You have an ongoing test. Finish it before starting this practice.',
                mock_not_found: 'This mock is no longer available.',
            };
            setPracticeError(
                messages[res.error] ?? 'Could not start practice.'
            );
            return;
        }

        if (res.status === 'created') {
            navigate(`/topic-test/${res.test_id}/attempt`);
        }
    }, [summary, navigate]);

    const orderedAttempts = useMemo(
        () =>
            [...attempts].sort(
                (a, b) => (a.attempt_order ?? 0) - (b.attempt_order ?? 0)
            ),
        [attempts]
    );
    const analysisData = useTestAnalysis(orderedAttempts as FullAttempt[]);

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

    const result =
        analysis && !('error' in analysis) && analysis.results_released === true
            ? analysis
            : null;
    const rank = result?.rank ?? null;
    const percentile = result?.percentile ?? null;
    const totalParticipants = result?.total_participants ?? null;

    const lock = () => (
        <LockIcon size={15} className="text-chart-4" weight="fill" />
    );

    const tabs: TabItem[] = [
        {
            id: 'analysis',
            label: 'Analysis',
            icon: <ChartLineUpIcon size={15} />,
            activeIcon: <ChartLineUpIcon size={15} weight="fill" />,
        },
        {
            id: 'questions',
            label: 'Questions',
            icon: tabsLocked ? lock() : <ListChecks size={15} />,
            activeIcon: tabsLocked ? (
                lock()
            ) : (
                <ListChecks size={15} weight="fill" />
            ),
        },
        {
            id: 'difficulty',
            label: 'Difficulty Analysis',
            icon: tabsLocked ? lock() : <PresentationChart size={15} />,
            activeIcon: tabsLocked ? (
                lock()
            ) : (
                <PresentationChart size={15} weight="fill" />
            ),
        },
        {
            id: 'topic',
            label: 'Topic Breakdown',
            icon: tabsLocked ? lock() : <Shapes size={15} />,
            activeIcon: tabsLocked ? (
                lock()
            ) : (
                <Shapes size={15} weight="fill" />
            ),
        },
        {
            id: 'pacing',
            label: 'Pacing, Time Sinks & Accuracy',
            icon: tabsLocked ? lock() : <Clock size={15} />,
            activeIcon: tabsLocked ? lock() : <Clock size={15} weight="fill" />,
        },
        {
            id: 'leaderboard',
            label: 'Leaderboard',
            icon: tabsLocked ? lock() : <TrophyIcon size={15} />,
            activeIcon: tabsLocked ? (
                lock()
            ) : (
                <TrophyIcon size={15} weight="fill" />
            ),
        },
    ];

    const handleTabChange = (id: string) => {
        if (tabsLocked && id !== 'analysis') {
            navigate('/donate');
            return;
        }
        setActiveTab(id as TabId);
    };

    const renderTabContent = () => {
        if (tabsLocked && activeTab !== 'analysis') return <LockedTab />;

        switch (activeTab) {
            case 'analysis':
                return (
                    <div className="space-y-6">
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="grid grid-cols-1 sm:grid-cols-3 gap-3"
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

                        <AttemptCountsStrip
                            attempted={summary.attempted_count}
                            correct={summary.correct_count}
                            incorrect={summary.incorrect_count}
                        />

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

                        {result && (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                                                ? percentile.toFixed(1)
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
                                {result.note && (
                                    <p className="text-xs text-muted-foreground">
                                        {result.note}
                                    </p>
                                )}
                            </>
                        )}

                        <div className="flex flex-wrap items-center gap-2">
                            {analysisUnlocked ? (
                                <>
                                    <Button
                                        onClick={() =>
                                            navigate(
                                                `/topic-test-review/${testId}/0`
                                            )
                                        }
                                        className="rounded-none"
                                    >
                                        Review Solutions
                                        <ArrowUpRightIcon
                                            size={14}
                                            className="ml-1.5"
                                        />
                                    </Button>
                                    {summary.mock_id && (
                                        <Button
                                            variant="outline"
                                            onClick={() =>
                                                void handlePractice()
                                            }
                                            disabled={startingPractice}
                                            className="rounded-none"
                                        >
                                            <ArrowsClockwiseIcon
                                                size={14}
                                                className="mr-1.5"
                                            />
                                            {startingPractice
                                                ? 'Starting…'
                                                : 'Practice This Mock'}
                                        </Button>
                                    )}
                                </>
                            ) : (
                                <>
                                    <Link
                                        to="/donate"
                                        className="inline-flex items-center gap-2 border border-chart-4/40 bg-chart-4/5 px-4 py-2 text-sm font-bold text-chart-4 hover:bg-chart-4/10"
                                    >
                                        <LockIcon size={15} weight="fill" />
                                        Review Solutions
                                    </Link>
                                    <Link
                                        to="/donate"
                                        className="inline-flex items-center gap-2 border border-chart-4/40 bg-chart-4/5 px-4 py-2 text-sm font-bold text-chart-4 hover:bg-chart-4/10"
                                    >
                                        <LockIcon size={15} weight="fill" />
                                        Practice This Mock
                                    </Link>
                                </>
                            )}
                        </div>

                        {practiceError && (
                            <p className="text-xs text-destructive">
                                {practiceError}
                            </p>
                        )}

                        {tabsLocked && (
                            <div className="flex flex-wrap items-center gap-2 border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                                <LockIcon size={14} className="text-chart-4" />
                                Questions, breakdowns and the leaderboard are
                                supporter perks.{' '}
                                <Link
                                    to="/donate"
                                    className="font-bold text-chart-4 underline"
                                >
                                    Unlock them
                                </Link>
                            </div>
                        )}
                    </div>
                );

            case 'questions':
                return attemptsLoading ? (
                    <div className="border border-border bg-card/60 p-6 text-sm text-muted-foreground">
                        Loading questions…
                    </div>
                ) : orderedAttempts.length > 0 ? (
                    <OrderedQuestionGrid
                        attempts={orderedAttempts as FullAttempt[]}
                        testId={testId}
                    />
                ) : (
                    <p className="text-sm text-muted-foreground">
                        No attempts recorded yet.
                    </p>
                );

            case 'difficulty':
                return analysisData ? (
                    <DifficultyAnalysis
                        analysis={analysisData}
                        testId={testId}
                    />
                ) : (
                    <p className="text-sm text-muted-foreground">
                        Difficulty analysis unavailable.
                    </p>
                );

            case 'topic':
                return analysisData ? (
                    <TopicBreakdown analysis={analysisData} testId={testId} />
                ) : (
                    <p className="text-sm text-muted-foreground">
                        Topic breakdown unavailable.
                    </p>
                );

            case 'pacing':
                return analysisData ? (
                    <div className="space-y-12">
                        <PacingAnalysis analysis={analysisData} />
                        <TimeSinksAndTypeAccuracy analysis={analysisData} />
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">
                        Pacing analysis unavailable.
                    </p>
                );

            case 'leaderboard':
                return summary.mock_id ? (
                    <FullMockLeaderboard mockId={summary.mock_id} embedded />
                ) : (
                    <p className="text-sm text-muted-foreground">
                        Leaderboard unavailable for this attempt.
                    </p>
                );
        }
    };

    return (
        <TestPageShell
            onBack={() => navigate(PICKER_PATH)}
            backLabel="Back to Mock Tests"
            maxWidth="max-w-7xl"
        >
            <div className="mb-6 flex flex-wrap items-center gap-2">
                <PageHeader primaryTitle="Quest" secondaryTitle="Mock Result" />
                {summary.is_re_attempt && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-muted text-muted-foreground border border-border">
                        Re-attempt
                    </span>
                )}
            </div>

            <AnimatedTabs
                tabs={tabs}
                activeTab={activeTab}
                onChange={handleTabChange}
                className="mb-6"
            />

            <motion.div
                key={activeTab}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {renderTabContent()}
            </motion.div>
        </TestPageShell>
    );
}
