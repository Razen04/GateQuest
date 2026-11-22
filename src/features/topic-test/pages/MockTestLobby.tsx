import {
    ArrowLeftIcon,
    ClockIcon,
    InfoIcon,
    PlayIcon,
    QuestionIcon,
    TimerIcon,
    TrophyIcon,
} from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { useGoalStore } from '@/app/stores/useGoalStore';
import ModernLoader from '@/shared/components/ModernLoader';
import PageHeader from '@/shared/components/PageHeader';
import ToggleSwitch from '@/shared/components/ToggleSwitch';
import { Button } from '@/shared/components/ui/button';
import { getDonorTier } from '@/shared/types/donor';
import type { MockState, ResolvedMock } from '@/shared/types/mock';
import { createTestFromMock } from '../api/mockTest';
import { InstructionRuleCard } from '../components/InstructionRuleCard';
import AddToCalendarButton from '../components/mock/AddToCalendarButton';
import { TestPageShell } from '../components/TestPageShell';
import { useMockCatalog } from '../hooks/useMockCatalog';
import {
    formatCountdown,
    formatDateTime,
    formatDuration,
} from '../utils/mockFormat';
import { mockStartDelayMs } from '../utils/stagger';

const PICKER_PATH = '/topic-test-generate?tab=mocks';

export default function MockTestLobby() {
    const { mockId } = useParams<{ mockId: string }>();
    const navigate = useNavigate();
    const user = useAuthStore((s) => s.user);
    const userGoal = useGoalStore((s) => s.userGoal);
    const branchId = userGoal?.branch_id?.toUpperCase() ?? null;
    const { mocks, loading, error: catalogError } = useMockCatalog();

    const userTier = getDonorTier(user?.notification_tags);
    const isDonor = userTier > 0;

    const [starting, setStarting] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);
    const [recordActivity, setRecordActivity] = useState(false);
    const [queueUntil, setQueueUntil] = useState<number | null>(null);
    const [queueSeconds, setQueueSeconds] = useState(0);

    // Countdown shown while the start request is deliberately
    // staggered. Kept separate from `starting` so the button can
    // explain the wait instead of looking frozen.
    useEffect(() => {
        if (queueUntil == null) return;

        const tick = () =>
            setQueueSeconds(
                Math.max(0, Math.ceil((queueUntil - Date.now()) / 1000))
            );
        tick();
        const interval = window.setInterval(tick, 250);
        return () => window.clearInterval(interval);
    }, [queueUntil]);

    const mock = useMemo<ResolvedMock | null>(
        () =>
            mockId ? (mocks.find((m) => m.mockId === mockId) ?? null) : null,
        [mocks, mockId]
    );

    // Allowed for all users on Beta mocks, or donors on non-Beta mocks
    const canRecordActivity = Boolean(mock?.isBeta || isDonor);

    // Auto-redirect for states that shouldn't render the lobby body.
    useEffect(() => {
        if (!mock) return;
        switch (mock.state) {
            case 'login_required':
                navigate('/', { replace: true });
                return;
            case 'resumable':
                if (mock.sessionId) {
                    navigate(`/mock-tests/attempt/${mock.sessionId}`, {
                        replace: true,
                    });
                }
                return;
            case 'attempted':
            case 'embargoed':
            case 'donor_locked':
                if (mock.sessionId) {
                    navigate(`/mock-tests/result/${mock.sessionId}`, {
                        replace: true,
                    });
                }
                return;
        }
    }, [mock, navigate]);

    const handleStart = async () => {
        if (!mockId || !branchId || !mock || starting) return;
        setStarting(true);
        setActionError(null);

        try {
            // Spread the start burst. 500 users clicking at once would
            // insert ~32,500 attempt rows in the same second; a short
            // deterministic per-user delay keeps the connection pool
            // and shared CPU comfortable. Practice runs outside the
            // live window are not time-boxed and skip the queue.
            const delayMs =
                mock.state === 'live'
                    ? mockStartDelayMs(user?.id, mockId, mock.secondsUntilEnd)
                    : 0;
            if (delayMs > 0) {
                setQueueUntil(Date.now() + delayMs);
                await new Promise((resolve) => setTimeout(resolve, delayMs));
                setQueueUntil(null);
            }

            const shouldRecord = canRecordActivity && recordActivity;
            const res = await createTestFromMock(
                mockId,
                branchId,
                shouldRecord
            );

            if ('error' in res) {
                setActionError(res.error);
                return;
            }

            switch (res.status) {
                case 'created':
                case 'already_attempted':
                    navigate(`/mock-tests/attempt/${res.test_id}`, {
                        replace: true,
                    });
                    return;
                case 'active_exists':
                    setActionError(
                        'You have an ongoing test. Finish it before starting this mock.'
                    );
                    return;
                case 'not_live':
                    setActionError(
                        `Not live yet — starts ${formatDateTime(res.starts_at)}.`
                    );
                    return;
                case 'attempt_gated':
                    setActionError(
                        `This mock requires tier ${res.min_tier}+. You are currently tier ${res.my_tier}.`
                    );
                    return;
                case 're_attempt_gated':
                    setActionError(
                        `Re-attempts require tier ${res.min_tier}+.`
                    );
                    return;
                case 'window_closing':
                    setActionError(
                        `Only ${res.seconds_left}s left in the window — not enough time to start.`
                    );
                    return;
            }
        } catch (err) {
            console.error('[MockTestLobby] start failed:', err);
            setActionError('Something went wrong. Please try again.');
        } finally {
            setQueueUntil(null);
            setStarting(false);
        }
    };

    // ── Loading / error states ───────────────────────────────────
    if (loading && !mock) return <ModernLoader />;

    if (catalogError) {
        return (
            <ErrorState
                title="Could not load mock"
                message={catalogError}
                onBack={() => navigate(PICKER_PATH)}
            />
        );
    }

    if (!branchId) {
        return (
            <ErrorState
                title="Set your exam goal"
                message="Mock tests are shown per branch. Set your branch in your profile to continue."
                onBack={() => navigate('/dashboard')}
            />
        );
    }

    if (!mock) {
        return (
            <ErrorState
                title="Mock not found"
                message={`No mock with ID "${mockId}" is available for your branch.`}
                onBack={() => navigate(PICKER_PATH)}
            />
        );
    }

    if (
        mock.state === 'login_required' ||
        mock.state === 'resumable' ||
        mock.state === 'attempted' ||
        mock.state === 'embargoed' ||
        mock.state === 'donor_locked'
    ) {
        return <ModernLoader />;
    }

    const isUpcoming = mock.state === 'upcoming';
    const isOpen = mock.state === 'open';
    const startLabel = isUpcoming
        ? 'Not Yet Live'
        : isOpen
          ? 'Start Practice Attempt'
          : 'Start Test Now';

    return (
        <div className="max-w-7xl mx-auto flex flex-col text-foreground pb-36 min-h-screen">
            <div className="p-6 pb-2">
                <button
                    onClick={() => navigate(PICKER_PATH)}
                    className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-chart-1 mb-4 transition-colors"
                >
                    <ArrowLeftIcon className="mr-2 h-4 w-4" />
                    Back to Mock Tests
                </button>

                <PageHeader
                    primaryTitle="Quest"
                    secondaryTitle="Mock Test"
                    caption={
                        mock.blurb ||
                        'Verify test configuration and instructions before beginning.'
                    }
                />
            </div>

            <main className="px-6 flex-1 flex flex-col gap-6 mt-4">
                {/* Overview card */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-border bg-card/60 backdrop-blur-2xl shadow-xl p-6"
                >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                {mock.seriesNumber != null &&
                                    mock.seriesNumber < 9000 && (
                                        <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 bg-chart-1/10 text-chart-1 border border-chart-1/20">
                                            Series {mock.seriesNumber}
                                        </span>
                                    )}
                                {mock.isBeta ? (
                                    <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 bg-chart-2/10 text-chart-2 border border-chart-2/20">
                                        Beta — free analysis
                                    </span>
                                ) : (
                                    <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 bg-chart-4/10 text-chart-4 border border-chart-4/20">
                                        Analysis tier {mock.postMinTier}+
                                    </span>
                                )}
                                <StateChip state={mock.state} />
                            </div>
                            <h2 className="text-xl font-bold tracking-tight text-foreground">
                                {mock.label}
                            </h2>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2 border border-chart-1/30 bg-chart-1/10 px-3.5 py-1.5 text-sm font-semibold text-chart-1">
                                <QuestionIcon size={18} weight="bold" />
                                <span>{mock.questionCount} Questions</span>
                            </div>
                            <div className="flex items-center gap-2 border border-chart-4/30 bg-chart-4/10 px-3.5 py-1.5 text-sm font-semibold text-chart-4">
                                <TimerIcon size={18} weight="bold" />
                                <span>
                                    {formatDuration(mock.durationSeconds)}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 border border-chart-2/30 bg-chart-2/10 px-3.5 py-1.5 text-sm font-semibold text-chart-2">
                                <TrophyIcon size={18} weight="bold" />
                                <span>{mock.totalMarks} Marks</span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start gap-2 text-sm">
                            <ClockIcon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                            <div className="min-w-0">
                                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                                    Window
                                </span>
                                <span className="text-foreground">
                                    {formatDateTime(
                                        new Date(mock.startsAt).toISOString()
                                    )}{' '}
                                    —{' '}
                                    {formatDateTime(
                                        new Date(mock.endsAt).toISOString()
                                    )}
                                </span>
                            </div>
                        </div>

                        {isUpcoming && mock.secondsUntilStart != null && (
                            <div className="flex items-start gap-2 text-sm">
                                <InfoIcon className="h-4 w-4 text-chart-1 mt-0.5 shrink-0" />
                                <div>
                                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                                        Starts in
                                    </span>
                                    <span className="text-chart-1 font-mono font-bold block">
                                        {formatCountdown(
                                            mock.secondsUntilStart
                                        )}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {formatDateTime(
                                            new Date(
                                                mock.startsAt
                                            ).toISOString()
                                        )}
                                    </span>
                                    <div className="pt-1">
                                        <AddToCalendarButton
                                            mock={mock}
                                            compact={false}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {mock.state === 'live' &&
                            mock.secondsUntilEnd != null && (
                                <div className="flex items-start gap-2 text-sm">
                                    <InfoIcon className="h-4 w-4 text-chart-2 mt-0.5 shrink-0" />
                                    <div>
                                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                                            Window closes in
                                        </span>
                                        <span className="text-chart-2 font-mono font-bold">
                                            {formatCountdown(
                                                mock.secondsUntilEnd
                                            )}
                                        </span>
                                    </div>
                                </div>
                            )}
                    </div>
                </motion.div>

                {/* Record Mock Activity: Available for all on Beta mocks, and donors on regular mocks */}
                {canRecordActivity && (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="border border-border bg-card/60 backdrop-blur-2xl p-4 flex items-center justify-between"
                    >
                        <div>
                            <h3 className="text-sm font-bold text-foreground">
                                Record Mock Activity
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Include this test in your dashboard stats.
                            </p>
                        </div>
                        <ToggleSwitch
                            isOn={recordActivity}
                            onToggle={() => setRecordActivity((v) => !v)}
                        />
                    </motion.div>
                )}

                {/* Instructions using InstructionRuleCard */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 }}
                    className="space-y-3"
                >
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        <InfoIcon size={16} />
                        <span>Instructions & Guidelines</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <InstructionRuleCard
                            tone="warning"
                            text="This mock runs in fullscreen. Exiting fullscreen 3 times will auto-submit your attempt."
                        />
                        <InstructionRuleCard
                            tone="info"
                            text="The timer starts the moment you click Start. Your attempt auto-submits when the timer or window runs out."
                        />
                        <InstructionRuleCard
                            tone="info"
                            text="Navigate freely between questions using the question palette or control bar."
                        />
                        {isOpen ? (
                            <InstructionRuleCard
                                tone="warning"
                                text="The live window has closed. This attempt is a practice run outside the live window."
                            />
                        ) : (
                            <InstructionRuleCard
                                tone="warning"
                                text={`Your attempt auto-submits at the window close${
                                    mock.state === 'live' &&
                                    mock.secondsUntilEnd != null
                                        ? ` (in ${formatCountdown(
                                              mock.secondsUntilEnd
                                          )})`
                                        : ''
                                }.`}
                            />
                        )}
                        {mock.isBeta ? (
                            <InstructionRuleCard
                                tone="info"
                                text="This is a beta mock — full analysis and leaderboard are free for all participants."
                            />
                        ) : (
                            <InstructionRuleCard
                                tone="warning"
                                text={`Score is free after the window. Analysis, rank, and review require tier ${mock.postMinTier}+.`}
                            />
                        )}
                    </div>
                </motion.div>
            </main>

            {/* Action bar */}
            <div className="fixed bottom-0 inset-x-0 z-30 bg-background/90 backdrop-blur-xl border-t border-border p-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                    <div className="min-w-0">
                        {actionError ? (
                            <p className="text-sm text-destructive">
                                {actionError}
                            </p>
                        ) : queueSeconds > 0 ? (
                            <p className="text-sm text-chart-1">
                                Spreading mock load — your session starts in{' '}
                                <span className="font-mono font-bold">
                                    {queueSeconds}s
                                </span>
                                .
                            </p>
                        ) : (
                            <p className="hidden sm:block text-xs text-muted-foreground">
                                {isUpcoming
                                    ? 'The Start button enables when the window opens.'
                                    : 'Ensure a stable connection before starting.'}
                            </p>
                        )}
                    </div>

                    <Button
                        onClick={handleStart}
                        disabled={starting || isUpcoming}
                        size="lg"
                        className="rounded-none bg-chart-1 text-white hover:bg-chart-1/90 min-w-[220px] h-11 text-sm font-semibold tracking-wide shadow-lg"
                    >
                        {starting ? (
                            <span>
                                {queueSeconds > 0
                                    ? `Starting in ${queueSeconds}s…`
                                    : 'Preparing…'}
                            </span>
                        ) : (
                            <>
                                <PlayIcon
                                    className="mr-2 h-4 w-4"
                                    weight="fill"
                                />
                                {startLabel}
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ─── Sub-components ──────────────────────────────────────────────

function StateChip({ state }: { state: MockState }) {
    if (state === 'live') {
        return (
            <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 bg-chart-2/10 text-chart-2 border border-chart-2/20">
                Live
            </span>
        );
    }
    if (state === 'upcoming') {
        return (
            <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 bg-muted text-muted-foreground border border-border">
                Upcoming
            </span>
        );
    }
    if (state === 'open') {
        return (
            <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 bg-muted text-muted-foreground border border-border">
                Window Closed
            </span>
        );
    }
    return null;
}

function ErrorState({
    title,
    message,
    onBack,
}: {
    title: string;
    message: string;
    onBack: () => void;
}) {
    return (
        <TestPageShell onBack={onBack} backLabel="Back" maxWidth="max-w-3xl">
            <div className="border border-border bg-card/50 p-8 text-center">
                <h1 className="text-xl font-bold mb-2 text-foreground">
                    {title}
                </h1>
                <p className="text-sm text-muted-foreground mb-6">{message}</p>
                <Button
                    variant="outline"
                    onClick={onBack}
                    className="rounded-none"
                >
                    Go Back
                </Button>
            </div>
        </TestPageShell>
    );
}
