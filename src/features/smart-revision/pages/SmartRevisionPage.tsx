import {
    ArrowLeft,
    CheckCircle,
    Clock,
    Fire,
    Lightning,
    ShieldCheck,
    Sparkle,
} from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '@/app/stores/useAuthStore';
import ModernLoader from '@/shared/components/ModernLoader';
import PageHeader from '@/shared/components/PageHeader';
import { Button } from '@/shared/components/ui/button';
import InfoTab from '../components/InfoTab';
import useSmartRevision from '../hooks/useSmartRevision';

const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffMs = expires.getTime() - now.getTime();

    if (diffMs <= 0) return 'Expired';

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0) {
        return `${diffHours}h ${diffMinutes}m remaining before expiry`;
    }

    if (diffMinutes > 0) {
        return `${diffMinutes}m remaining before expiry`;
    }

    return 'Less than 1 minute remaining';
};

const SmartRevision = () => {
    const navigate = useNavigate();
    const {
        loading,
        currentSet,
        generateSet,
        startSet,
        criticalQuestionsCount,
    } = useSmartRevision();
    const isLogin = useAuthStore((s) => s.user !== null && s.user.id !== '1');

    // Fix: Move navigation & toast side-effects into useEffect
    useEffect(() => {
        if (!isLogin) {
            toast.error('Please log in to access Smart Revision.');
            navigate('/dashboard', { replace: true });
        }
    }, [isLogin, navigate]);

    if (!isLogin || loading) return <ModernLoader />;

    const isActiveSet = currentSet && currentSet.status !== 'completed';
    const isExpiredSet = currentSet && currentSet.status === 'completed';
    const hasCriticalQuestions = criticalQuestionsCount > 0;

    return (
        <div className="relative min-h-dvh overflow-y-auto max-w-7xl mx-auto bg-background px-4 py-6 pb-32 sm:px-8">
            {/* Ambient Background Glows */}
            <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[500px] w-full max-w-7xl -translate-x-1/2 overflow-hidden opacity-40 dark:opacity-20">
                <div className="absolute -left-20 -top-20 h-96 w-96 bg-chart-1/30 blur-[120px]" />
                <div className="absolute right-0 top-32 h-96 w-96 bg-chart-6/20 blur-[120px]" />
            </div>

            <div className="space-y-8">
                {/* Top Navigation */}
                <motion.button
                    whileHover={{ x: -4 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => navigate('/dashboard')}
                    className="group inline-flex items-center gap-2 border border-border bg-card/60 px-3.5 py-2 font-grotesk text-xs font-bold text-foreground shadow-sm backdrop-blur-md transition-colors hover:border-chart-1/30 hover:text-chart-1"
                >
                    <ArrowLeft
                        size={16}
                        className="transition-transform group-hover:-translate-x-0.5"
                    />
                    <span>Back to Dashboard</span>
                </motion.button>

                {/* Page Header */}
                <PageHeader
                    primaryTitle="Smart"
                    secondaryTitle="Revision"
                    caption="Your dynamic targeted weakness engine. Eliminate critical errors."
                />

                {/* Main Hero Focus Card */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="group relative overflow-hidden border border-border bg-card/70 p-8 shadow-2xl backdrop-blur-2xl sm:p-12"
                >
                    {/* Top Right Grid Overlay Effect */}
                    <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 bg-[radial-gradient(var(--chart-1)_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />

                    <div className="relative z-10 flex flex-col items-center text-center">
                        <AnimatePresence mode="wait">
                            {isActiveSet ? (
                                <motion.div
                                    key="active"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="w-full max-w-lg space-y-6"
                                >
                                    <div className="inline-flex items-center gap-2 border border-chart-1/20 bg-chart-1/10 px-4 py-1.5 font-mono text-xs font-bold text-chart-1">
                                        <Clock
                                            size={16}
                                            className="animate-spin-slow"
                                            weight="bold"
                                        />
                                        <span>ACTIVE REVISION SESSION</span>
                                    </div>

                                    <div className="space-y-2">
                                        <h3 className="font-grotesk text-2xl font-black text-foreground sm:text-3xl">
                                            Weekly Set in Progress
                                        </h3>
                                        <p className="font-serif text-sm text-muted-foreground">
                                            {currentSet?.expires_at
                                                ? getTimeRemaining(
                                                      currentSet.expires_at
                                                  )
                                                : 'Expires next Sunday or 24 hours after launch.'}
                                        </p>
                                    </div>

                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <Button
                                            onClick={startSet}
                                            className="rounded-none h-12 w-full gap-2 bg-chart-1 font-grotesk text-sm font-bold text-white shadow-lg shadow-chart-1/25 transition-all hover:bg-chart-1/90"
                                        >
                                            <Lightning
                                                size={18}
                                                weight="fill"
                                            />
                                            {currentSet?.status === 'pending'
                                                ? 'Launch Revision Session'
                                                : 'Resume Revision Session'}
                                        </Button>
                                    </motion.div>
                                </motion.div>
                            ) : isExpiredSet ? (
                                <motion.div
                                    key="expired"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="max-w-md space-y-4"
                                >
                                    <div className="mx-auto flex h-16 w-16 items-center justify-center bg-muted text-muted-foreground">
                                        <ShieldCheck
                                            size={36}
                                            weight="duotone"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <h3 className="font-grotesk text-2xl font-black text-foreground">
                                            Weekly Set Concluded
                                        </h3>
                                        <p className="font-serif text-sm text-muted-foreground">
                                            You've finished this week's smart
                                            recovery sequence. Next set unlocks
                                            next week.
                                        </p>
                                    </div>
                                </motion.div>
                            ) : hasCriticalQuestions ? (
                                <motion.div
                                    key="critical"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="max-w-md space-y-6"
                                >
                                    <div className="inline-flex items-center gap-2 border border-chart-5/20 bg-chart-5/10 px-4 py-1.5 font-mono text-xs font-bold text-chart-5">
                                        <Fire
                                            size={16}
                                            weight="fill"
                                            className="animate-pulse"
                                        />
                                        <span>
                                            {criticalQuestionsCount} CRITICAL
                                            ERROR(S) DETECTED
                                        </span>
                                    </div>

                                    <div className="space-y-2">
                                        <h3 className="font-grotesk text-2xl font-black text-foreground sm:text-3xl">
                                            Ready to Recover Marks?
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            Generate an algorithmic revision
                                            queue targeted specifically at your
                                            recent missteps.
                                        </p>
                                    </div>

                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <Button
                                            disabled={loading}
                                            onClick={generateSet}
                                            className="h-12 w-full rounded-none gap-2 bg-chart-1 font-grotesk text-sm font-bold text-white shadow-lg shadow-chart-1/25 transition-all hover:bg-chart-1/90"
                                        >
                                            <Sparkle size={18} weight="fill" />
                                            Generate Focused Set
                                        </Button>
                                    </motion.div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="clear"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="max-w-md space-y-4"
                                >
                                    <div className="mx-auto flex h-16 w-16 items-center justify-center bg-chart-2/10 text-chart-2">
                                        <CheckCircle
                                            size={36}
                                            weight="duotone"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <h3 className="font-grotesk text-2xl font-black text-foreground">
                                            All Clear This Week!
                                        </h3>
                                        <p className="font-serif text-sm text-muted-foreground">
                                            No pending critical questions
                                            detected. Great job keeping your
                                            retention rate high!
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>

                {/* Info Tab Section */}
                <InfoTab />
            </div>
        </div>
    );
};

export default SmartRevision;
