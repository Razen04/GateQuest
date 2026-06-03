import { useParams } from 'react-router-dom';
import ModernLoader from '@/shared/components/ModernLoader';
import { useProfile } from './hooks/useProfile';

// Feature Components Imports
import ProfileHero from './components/ProfileHero';
import ProfileSidePanel from './components/ProfileSidePanel';
import ProfileStatsGrid from './components/ProfileStatsGrid';
import ProfileHeatmap from './components/ProfileHeatmap';
import ProfileActivityTabs from './components/ProfileActivityTabs';
import ProfileError from './components/ProfileError';

export default function ProfilePage() {
    const { username } = useParams<{ username: string }>();
    const { data, loading, error } = useProfile(username);

    console.log(data);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-slate-900">
                <ModernLoader />
            </div>
        );
    }

    if (error || !data) {
        return <ProfileError message={error} />;
    }

    // Safely extract the variable subject key for the active tabs
    const primaryExamKey = Object.keys(data.exam_stats)[0] || 'gate';
    const subjects = data.exam_stats[primaryExamKey]?.subjects || [];

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-zinc-900 text-slate-800 dark:text-slate-200 font-['Plus_Jakarta_Sans',sans-serif] transition-colors duration-200 pb-20">
            {/* 1. Top Banner Profile Visuals Header */}
            <ProfileHero profile={data.profile} />

            {/* Layout Grid Alignment Column Wrappers */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-8 pb-12">
                <div className="grid grid-cols-1 lg:grid-cols-[256px_1fr] gap-5">
                    {/* 2. Side Panel Metadata column */}
                    <ProfileSidePanel profile={data.profile} globalStats={data.global_stats} />

                    {/* Main metric summary block data feed columns */}
                    <main className="flex flex-col gap-5 min-w-0">
                        {/* 3. Stat counters grid blocks */}
                        <ProfileStatsGrid globalStats={data.global_stats} streaks={data.streaks} />

                        {/* 4. Interactive Activity Heatmap calendar matrix */}
                        <ProfileHeatmap heatmapData={data.heatmap} />

                        {/* 5. Custom History items lists & itemized progress charts */}
                        <ProfileActivityTabs
                            recentHistory={data.recent_history}
                            subjects={subjects}
                        />
                    </main>
                </div>
            </div>
        </div>
    );
}
