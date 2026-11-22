import {
    ArrowClockwiseIcon,
    ArrowRightIcon,
    ArrowUpRightIcon,
    ChartLine,
    ClipboardTextIcon,
    ClockIcon,
    Compass,
    LightningIcon,
    Medal,
    PlayIcon,
    TrophyIcon,
} from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { useStatsStore } from '@/app/stores/useStatsStore';
// UI Components
import Login from '@/features/auth/components/Login';
import AddToCalendarButton from '@/features/topic-test/components/mock/AddToCalendarButton';
import { useMockCatalog } from '@/features/topic-test/hooks/useMockCatalog';
import {
    formatCountdown,
    formatDateTime,
} from '@/features/topic-test/utils/mockFormat';
import { pickHeroMock } from '@/features/topic-test/utils/mockState';
import Branding from '@/shared/components/Branding';
import ModernLoader from '@/shared/components/ModernLoader';
import { Button } from '@/shared/components/ui/button';
// Hooks & Utilities
import { containerVariants, itemVariants } from '@/shared/utils/motionVariants';
import { ContinueSessionWidget } from '../components/ContinueSessionWidget';
import StatCard from '../components/StatCard';
import StreakMap from '../components/StreakMap';
import StudyPlan from '../components/StudyPlan';
import { WebNotificationToggle } from '../components/WebNotificationToggle';

const Dashboard = () => {
    const isLogin = useAuthStore((s) => s.user !== null && s.user.id !== '1');

    const loading = useAuthStore((s) => s.loading);
    const stats = useStatsStore((s) => s.stats);
    const statsLoading = useStatsStore((s) => s.loading);
    const user = useAuthStore((s) => s.user);

    const navigate = useNavigate();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    // A live / resumable / imminent mock takes over the greeting card.
    // The catalog ticks once a second, so countdowns stay accurate.
    const { mocks: mockCatalog } = useMockCatalog();
    const heroMock = useMemo(() => pickHeroMock(mockCatalog), [mockCatalog]);
    const heroMockId = heroMock?.mockId ?? null;

    const prefersReducedMotion = useMemo(() => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }, []);

    // Slide 2 only exists while a hero mock is pinned. Reset back to
    // the greeting when it disappears so a later rotation is valid.
    useEffect(() => {
        if (!heroMockId) {
            setCurrentSlide((prev) => (prev === 2 ? 0 : prev));
        }
    }, [heroMockId]);

    // Auto-advance every 5s. Resets whenever slide changes (manual or
    // auto), pauses on hover, is skipped entirely for reduced-motion
    // users, and stops while a mock is pinned.
    useEffect(() => {
        if (heroMockId || isPaused || prefersReducedMotion) return;
        const t = setTimeout(() => {
            setCurrentSlide((prev) => (prev + 1) % 2);
        }, 5000);
        return () => clearTimeout(t);
    }, [heroMockId, currentSlide, isPaused, prefersReducedMotion]);

    useEffect(() => {
        useStatsStore.getState().updateStats();
    }, []);

    if (loading) {
        return (
            <div className="flex h-dvh w-full items-center justify-center bg-background">
                <ModernLoader />
            </div>
        );
    }

    if (!isLogin) {
        return (
            <div className="flex min-h-dvh w-full items-center justify-center bg-background">
                <div className="flex flex-1 items-center justify-center p-4">
                    <Login canClose={false} />
                </div>
            </div>
        );
    }

    const userProgress = stats?.progress || 0;
    const userAccuracy = stats?.accuracy || 0;

    // A pinned mock always renders as slide 2, regardless of the last
    // manual slide. No fade-in delay — the hero should read instantly.
    const activeSlide = heroMockId ? 2 : currentSlide;
    const heroIsLive =
        heroMock?.state === 'live' || heroMock?.state === 'resumable';
    const heroIsResumable = heroMock?.state === 'resumable';

    const handleHeroAction = () => {
        if (!heroMock) return;

        if (heroIsResumable && heroMock.sessionId) {
            navigate(`/mock-tests/attempt/${heroMock.sessionId}`);
            return;
        }

        navigate(`/mock-tests/${heroMock.mockId}`);
    };

    return (
        <div className="mx-auto min-h-dvh max-w-7xl space-y-8 px-4 pt-6 pb-32 select-none sm:px-8">
            <WebNotificationToggle />

            {/* HERO BENTO ROW */}
            <motion.div
                variants={containerVariants}
                initial="initial"
                animate="animate"
                className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-12"
            >
                {/* ── Rotating Hero Card (Greeting ↔ Quest Mocks promo) ── */}
                <motion.div
                    variants={itemVariants}
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                    className="relative grid grid-rows-1 overflow-hidden border border-border bg-card shadow-sm lg:col-span-8"
                >
                    {/* Subtle Top Inner Glow */}
                    <div className="pointer-events-none absolute -top-24 -right-24 z-0 h-60 w-60 bg-primary/10 blur-3xl" />

                    {/* Slide indicators — top right. Hidden while a
                        mock is pinned: the hero stays on it. */}
                    {!heroMockId && (
                        <div className="absolute right-4 top-4 z-20 flex items-center gap-1.5">
                            {[0, 1].map((i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentSlide(i)}
                                    aria-label={`Go to slide ${i + 1}`}
                                    className={`h-1.5 transition-all ${
                                        activeSlide === i
                                            ? 'w-6 bg-sidebar-primary'
                                            : 'w-1.5 bg-muted-foreground/40 hover:bg-muted-foreground/70'
                                    }`}
                                />
                            ))}
                        </div>
                    )}

                    {/* ── Slide 0: Greeting ───────────────────────────────── */}
                    <motion.div
                        animate={{
                            opacity: activeSlide === 0 ? 1 : 0,
                            x: activeSlide === 0 ? 0 : -20,
                        }}
                        transition={{ duration: 0.45, ease: 'easeOut' }}
                        aria-hidden={activeSlide !== 0}
                        style={{
                            pointerEvents: activeSlide === 0 ? 'auto' : 'none',
                        }}
                        className="col-start-1 row-start-1 flex flex-col justify-between p-6 sm:p-8"
                    >
                        <div className="relative z-10 space-y-2">
                            <h1 className="font-['Sora',sans-serif] text-2xl font-extrabold tracking-tight text-card-foreground sm:text-4xl">
                                Welcome back,{' '}
                                <span className="text-sidebar-primary">
                                    {user?.name || 'Scholar'}
                                </span>
                            </h1>

                            <p className="max-w-xl text-sm leading-relaxed font-normal text-muted-foreground sm:text-base">
                                You've completed{' '}
                                <span className="font-semibold text-primary">
                                    {userProgress}%
                                </span>{' '}
                                of your target syllabus. Stay focused on your
                                weak areas today.
                            </p>
                        </div>

                        <div className="relative z-10 mt-6 flex items-center gap-4 border-t border-border pt-6">
                            <div className="flex-1 space-y-1.5">
                                <div className="flex justify-between font-mono text-xs font-medium text-muted-foreground">
                                    <span>SYLLABUS COVERAGE</span>
                                    <span>{userProgress}%</span>
                                </div>

                                <div className="h-2 w-full overflow-hidden bg-muted">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${userProgress}%` }}
                                        transition={{
                                            duration: 1.2,
                                            ease: 'easeOut',
                                        }}
                                        className="h-full bg-primary"
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* ── Slide 1: Quest Mocks promo ──────────────────────── */}
                    <motion.div
                        animate={{
                            opacity: activeSlide === 1 ? 1 : 0,
                            x: activeSlide === 1 ? 0 : 20,
                        }}
                        transition={{ duration: 0.45, ease: 'easeOut' }}
                        aria-hidden={activeSlide !== 1}
                        style={{
                            pointerEvents: activeSlide === 1 ? 'auto' : 'none',
                        }}
                        className="col-start-1 row-start-1 flex flex-col justify-between p-6 sm:p-8"
                    >
                        <div className="relative z-10 space-y-2">
                            <span className="inline-flex items-center gap-1.5 bg-sidebar-primary/10 px-2 py-0.5 font-mono text-xs font-bold tracking-wider text-sidebar-primary uppercase">
                                <TrophyIcon size={12} weight="fill" />
                                New
                            </span>

                            <h1 className="font-['Sora',sans-serif] text-2xl font-extrabold tracking-tight text-card-foreground sm:text-4xl">
                                <span className="text-sidebar-primary">
                                    Quest{' '}
                                </span>
                                Mocks are live
                            </h1>

                            <p className="max-w-xl text-sm leading-relaxed font-normal text-muted-foreground sm:text-base">
                                Instant scores, leaderboards, and donor-tier
                                analysis the moment the window closes.
                            </p>
                        </div>

                        <div className="relative z-10 mt-6 flex flex-wrap items-center gap-3 border-t border-border pt-6">
                            <Button
                                onClick={() =>
                                    navigate('/topic-test-generate?tab=mocks')
                                }
                                className="font-semibold rounded-none"
                            >
                                Explore
                                <ArrowRightIcon size={16} className="ml-1.5" />
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => setCurrentSlide(0)}
                                className="rounded-none font-medium text-muted-foreground hover:text-foreground"
                            >
                                Back to overview
                            </Button>
                        </div>
                    </motion.div>

                    {/* ── Slide 2: Pinned live / upcoming mock ────────────── */}
                    {heroMock && (
                        <motion.div
                            animate={{
                                opacity: activeSlide === 2 ? 1 : 0,
                                x: activeSlide === 2 ? 0 : 20,
                            }}
                            transition={{ duration: 0.35, ease: 'easeOut' }}
                            aria-hidden={activeSlide !== 2}
                            style={{
                                pointerEvents:
                                    activeSlide === 2 ? 'auto' : 'none',
                            }}
                            className="col-start-1 row-start-1 flex flex-col justify-between p-6 sm:p-8"
                        >
                            <div className="relative z-10 space-y-2">
                                <span
                                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 font-mono text-xs font-bold tracking-wider uppercase ${
                                        heroIsLive
                                            ? 'bg-chart-2/10 text-chart-2'
                                            : 'bg-sidebar-primary/10 text-sidebar-primary'
                                    }`}
                                >
                                    {heroIsLive ? (
                                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-chart-2" />
                                    ) : (
                                        <ClockIcon size={12} weight="bold" />
                                    )}
                                    {heroIsResumable
                                        ? 'In progress'
                                        : heroIsLive
                                          ? 'Live now'
                                          : 'Upcoming mock'}
                                </span>

                                <h1 className="font-['Sora',sans-serif] text-2xl font-extrabold tracking-tight text-card-foreground sm:text-4xl">
                                    {heroMock.label}
                                </h1>

                                <p className="max-w-xl text-sm leading-relaxed font-normal text-muted-foreground sm:text-base">
                                    {heroIsLive
                                        ? 'Window closes in '
                                        : 'Starts in '}
                                    <span className="font-mono font-semibold text-foreground">
                                        {formatCountdown(
                                            heroIsLive
                                                ? heroMock.secondsUntilEnd
                                                : heroMock.secondsUntilStart
                                        )}
                                    </span>
                                    {' · '}
                                    {heroMock.questionCount} questions ·{' '}
                                    {heroMock.totalMarks} marks
                                </p>

                                {(heroMock.blurb || heroMock.announcement) && (
                                    <p className="max-w-xl text-xs leading-relaxed text-muted-foreground sm:text-sm">
                                        {heroMock.blurb ||
                                            heroMock.announcement}
                                    </p>
                                )}

                                {heroMock.state === 'upcoming' && (
                                    <p className="font-mono text-xs text-muted-foreground">
                                        {formatDateTime(
                                            new Date(
                                                heroMock.startsAt
                                            ).toISOString()
                                        )}
                                    </p>
                                )}
                            </div>

                            <div className="relative z-10 mt-6 flex flex-wrap items-center gap-3 border-t border-border pt-6">
                                <Button
                                    onClick={handleHeroAction}
                                    className="font-semibold rounded-none"
                                >
                                    {heroIsResumable
                                        ? 'Resume attempt'
                                        : heroIsLive
                                          ? 'Enter mock'
                                          : 'View mock'}
                                    {heroIsLive ? (
                                        <PlayIcon
                                            size={16}
                                            className="ml-1.5"
                                            weight="fill"
                                        />
                                    ) : (
                                        <ArrowRightIcon
                                            size={16}
                                            className="ml-1.5"
                                        />
                                    )}
                                </Button>

                                <Button
                                    variant="ghost"
                                    onClick={() =>
                                        navigate(
                                            '/topic-test-generate?tab=mocks'
                                        )
                                    }
                                    className="rounded-none font-medium text-muted-foreground hover:text-foreground"
                                >
                                    All mocks
                                </Button>

                                {heroMock.state === 'upcoming' && (
                                    <AddToCalendarButton mock={heroMock} />
                                )}
                            </div>
                        </motion.div>
                    )}
                </motion.div>

                {/* Stat Highlights Bento — unchanged */}
                <motion.div
                    variants={itemVariants}
                    className="grid grid-cols-1 gap-4 lg:col-span-4"
                >
                    <StatCard
                        icon={ChartLine}
                        title="Overall Progress"
                        value={`${userProgress}%`}
                        iconColor="text-primary"
                        bgColor="bg-primary/10"
                    />

                    <StatCard
                        icon={Medal}
                        title="Accuracy Rate"
                        value={`${userAccuracy}%`}
                        iconColor="text-chart-3"
                        bgColor="bg-chart-3/10"
                    />
                </motion.div>
            </motion.div>

            {/* SMART ACTIONS SECTION */}
            <section className="space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="flex items-center gap-2 font-mono text-xs font-bold tracking-wider text-muted-foreground uppercase">
                        <Compass size={14} weight="bold" />
                        <span>Smart Actions</span>
                    </h2>
                </div>

                <ContinueSessionWidget />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Mock Tests */}
                    <motion.div
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.99 }}
                        className="group relative flex cursor-pointer items-center justify-between overflow-hidden border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:border-primary/40 hover:shadow-md"
                        onClick={() =>
                            navigate('/topic-test-generate?tab=mocks')
                        }
                    >
                        {/* New Badge */}
                        <span className="absolute right-0 top-0 bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                            New
                        </span>

                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center bg-chart-2/10 text-chart-2 transition-transform group-hover:scale-105">
                                <ClipboardTextIcon size={24} weight="bold" />
                            </div>

                            <div>
                                <h3 className="font-['Sora',sans-serif] text-base font-bold text-card-foreground">
                                    Mock Tests
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    Experience actual exam setting.
                                </p>
                            </div>
                        </div>

                        <ArrowUpRightIcon />
                    </motion.div>

                    {/* Topic Test */}
                    <motion.div
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.99 }}
                        className="group relative flex cursor-pointer items-center justify-between overflow-hidden border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:border-primary/40 hover:shadow-md"
                        onClick={() => navigate('/topic-test')}
                    >
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center bg-primary/10 text-primary transition-transform group-hover:scale-105">
                                <LightningIcon size={24} weight="bold" />
                            </div>

                            <div>
                                <h3 className="font-['Sora',sans-serif] text-base font-bold text-card-foreground">
                                    Custom Test
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    Design your own tests with your own flavor.
                                </p>
                            </div>
                        </div>

                        <ArrowUpRightIcon />
                    </motion.div>

                    {/* Smart Revision */}
                    <motion.div
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.99 }}
                        className="group relative flex cursor-pointer items-center justify-between overflow-hidden border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:border-primary/40 hover:shadow-md"
                        onClick={() => navigate('/revision')}
                    >
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center bg-chart-3/10 text-chart-3 transition-transform group-hover:scale-105">
                                <ArrowClockwiseIcon size={24} weight="bold" />
                            </div>

                            <div>
                                <h3 className="font-['Sora',sans-serif] text-base font-bold text-card-foreground">
                                    Smart Revision
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    Practice your weak areas, very important.
                                </p>
                            </div>
                        </div>

                        <ArrowUpRightIcon />
                    </motion.div>
                </div>
            </section>

            {/* STUDY PLAN SECTION */}
            <section className="space-y-3">
                <h2 className="font-mono text-xs font-bold tracking-wider text-muted-foreground uppercase">
                    Target Study Roadmap
                </h2>

                <StudyPlan />
            </section>

            {/* STREAK MAP SECTION */}
            {!statsLoading && stats?.heatmapData && (
                <section className="space-y-3">
                    <h2 className="font-mono text-xs font-bold tracking-wider text-muted-foreground uppercase">
                        Consistency & Activity Heatmap
                    </h2>

                    <StreakMap stats={stats} />
                </section>
            )}

            {/* Branding Footer */}
            <Branding className="w-full opacity-60 transition-opacity hover:opacity-100" />
        </div>
    );
};

export default Dashboard;
