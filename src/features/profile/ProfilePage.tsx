import { useParams } from 'react-router-dom';
import ModernLoader from '@/shared/components/ModernLoader';
import { useProfile } from './hooks/useProfile';

import ProfileHero from './components/ProfileHero';
import ProfileSidePanel from './components/ProfileSidePanel';
import ProfileStatsGrid from './components/ProfileStatsGrid';
import ProfileHeatmap from './components/ProfileHeatmap';
import ProfileActivityTabs from './components/ProfileActivityTabs';
import ProfileError from './components/ProfileError';

import { motion } from 'framer-motion';
import { containerVariants } from '@/shared/utils/motionVariants';

export default function ProfilePage() {
    const { username } = useParams<{ username: string }>();
    const { data, loading, error } = useProfile(username);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-[#09090B]">
                <ModernLoader />
            </div>
        );
    }

    if (error || !data) {
        return <ProfileError message={error} />;
    }

    return (
        <motion.div variants={containerVariants} initial="initial" animate="animate">
            <div className="relative min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-white pb-30 font-['Plus_Jakarta_Sans',sans-serif] text-slate-800 transition-colors duration-500 dark:from-[#06070A] dark:via-[#0A0D12] dark:to-[#0F1218] dark:text-slate-200">
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute left-1/2 -top-32 h-[500px] w-[500px] -translate-x-1/2 bg-[#3E8EFF]/10 blur-3xl" />
                </div>

                <div className="relative z-10 mx-auto max-w-6xl px-4 pt-6 sm:px-6">
                    <div className="flex flex-col gap-6">
                        {/* Hero: the thesis statement — who this is */}
                        <ProfileHero profile={data.profile} />

                        {/* Below: "your numbers" (left rail) vs "your activity" (main) —
                        a deliberate split instead of a stacked checklist */}
                        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[300px_1fr]">
                            <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
                                <ProfileStatsGrid
                                    globalStats={data.global_stats}
                                    streaks={data.streaks}
                                />
                                <ProfileSidePanel globalStats={data.global_stats} />
                            </aside>

                            <main className="flex min-w-0 flex-col gap-6">
                                <ProfileHeatmap heatmapData={data.heatmap} />
                                <ProfileActivityTabs
                                    recentHistory={data.recent_history}
                                    examStats={data.exam_stats}
                                />
                            </main>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
