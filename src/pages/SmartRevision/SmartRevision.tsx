import { motion } from 'framer-motion';
import { ShieldCheck, Fire } from '@phosphor-icons/react';
import useSmartRevision from '../../hooks/useSmartRevision.ts';
import { containerVariants } from '../../utils/motionVariants.ts';
import ModernLoader from '../../components/ui/ModernLoader.tsx';
import InfoTab from '../../components/SmartRevision/InfoTab.tsx';
import PageHeader from '@/components/ui/PageHeader.tsx';
import { Button } from '@/components/ui/button.tsx';
import { ArrowLeft } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import useAuth from '@/hooks/useAuth.ts';

// Helper function
const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffMs = expires.getTime() - now.getTime();

    if (diffMs <= 0) return 'Expired';

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0) {
        return `${diffHours} hour${diffHours > 1 ? 's' : ''} remaining before it expires, don't procastinate!!`;
    } else if (diffMinutes > 0) {
        return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} remaining remaining before it expires, don't procastinate!!`;
    } else {
        return 'Less than a minute remaining, sayonara';
    }
};

const SmartRevision = () => {
    const navigate = useNavigate();
    const { loading, currentSet, generateSet, startSet, criticalQuestionsCount } =
        useSmartRevision();

    const { isLogin } = useAuth();
    if (!isLogin) {
        toast.error('You should be logged in to view this page.');
        navigate('/dashboard');
    }

    const isActiveSet = currentSet && currentSet.status !== 'expired';
    const isExpiredSet = currentSet && currentSet.status === 'expired';
    const hasCriticalQuestions = criticalQuestionsCount > 0;

    const onBack = () => {
        navigate('/dashboard');
    };

    // Loading state
    if (loading) {
        return <ModernLoader />;
    }

    return (
        <div className="p-6 pb-40 bg-gray-50 dark:bg-zinc-900 max-h-dvh overflow-y-scroll">
            {/* Top Back Button */}
            <div className="flex items-center mb-4 sm:mb-6 dark:text-white">
                <button
                    onClick={onBack}
                    className="flex items-center hover:text-blue-500 transition-colors cursor-pointer focus:outline-none"
                >
                    <ArrowLeft className="mr-2" />
                    <span>Back</span>
                </button>
            </div>

            <PageHeader
                primaryTitle="Smart"
                secondaryTitle="Revision"
                caption="Your personalized weekly recovery plan. Revision is must!"
            />

            {/* Action Card */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="mb-10"
            >
                <div className="bg-white dark:bg-zinc-600/5 p-8 shadow-sm border border-gray-100 dark:border-zinc-900 relative overflow-hidden">
                    <div className="relative z-10 flex flex-col items-center justify-center min-h-[140px] text-center">
                        {isActiveSet ? (
                            // STATE: Active or Pending Set
                            <div className="w-full max-w-md p-4">
                                <div className="flex flex-col mb-6">
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                        Weekly Set Active
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {currentSet?.expires_at
                                            ? getTimeRemaining(currentSet.expires_at)
                                            : 'It expires next Sunday or 24 hours after you start.'}
                                    </p>
                                </div>

                                <Button onClick={startSet} className="w-full">
                                    {currentSet?.status === 'pending'
                                        ? 'Start Revision'
                                        : 'Continue Revision'}
                                </Button>
                            </div>
                        ) : isExpiredSet ? (
                            // STATE: Finished This Week's Set
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-4">
                                    <ShieldCheck size={32} weight="duotone" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                                    This week’s set is over!
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-sm">
                                    You’ve completed this week’s revision set. Come back next week
                                    for a new one.
                                </p>
                            </div>
                        ) : hasCriticalQuestions ? (
                            // STATE: Ready to Generate
                            <div className="max-w-md">
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 text-xs font-medium mb-6">
                                    <Fire size={16} weight="fill" />
                                    {criticalQuestionsCount} critical mistakes pending review
                                </div>

                                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                                    Ready to recover marks?
                                </h2>
                                <p className="text-gray-500 dark:text-gray-400 mb-8">
                                    Generate your focused revision set for this week.
                                </p>

                                <Button disabled={loading} onClick={generateSet}>
                                    Generate Weekly Set
                                </Button>
                            </div>
                        ) : (
                            // STATE: No Critical Questions This Week
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mb-4">
                                    <ShieldCheck size={32} weight="duotone" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                                    No questions to practice this week.
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-sm">
                                    You don’t have any critical questions pending this week.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Educational Section */}
            <InfoTab />
        </div>
    );
};

export default SmartRevision;
