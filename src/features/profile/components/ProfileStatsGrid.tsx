import { BookOpen, Fire, Lightning, Target } from '@phosphor-icons/react';
import { glassPanel } from '../styles/profileTheme';
import type { ProfileData } from '../types/profile';

interface ProfileStatsGridProps {
    globalStats: ProfileData['global_stats'];
    streaks: ProfileData['streaks'];
}

export default function ProfileStatsGrid({
    globalStats,
    streaks,
}: ProfileStatsGridProps) {
    const metrics = [
        {
            icon: <BookOpen size={17} weight="duotone" />,
            iconClassName: 'bg-chart-1/10 text-chart-1',
            label: 'Solved',
            value: globalStats.total_unique_solved.toLocaleString('en-IN'),
            subtext: `${globalStats.total_attempts} attempts`,
        },
        {
            icon: <Target size={17} weight="duotone" />,
            iconClassName: 'bg-chart-2/10 text-chart-2',
            label: 'Accuracy',
            value: `${globalStats.overall_accuracy}%`,
            subtext: 'all modules',
        },
        {
            icon: <Fire size={17} weight="duotone" />,
            iconClassName: 'bg-chart-5/10 text-chart-5',
            label: 'Study streak',
            value: `${streaks.study_current}d`,
            subtext: `best ${streaks.study_longest}d`,
        },
        {
            icon: <Lightning size={17} weight="duotone" />,
            iconClassName: 'bg-chart-6/10 text-chart-6',
            label: 'Learning streak',
            value: `${streaks.learning_current}d`,
            subtext: `best ${streaks.learning_longest}d`,
        },
    ];

    return (
        <div className={glassPanel}>
            <div className="divide-y divide-border">
                {metrics.map(
                    ({ icon, iconClassName, label, value, subtext }) => (
                        <div
                            key={label}
                            className="flex items-center gap-3 px-5 py-4"
                        >
                            <div
                                className={`flex h-9 w-9 shrink-0 items-center justify-center ${iconClassName}`}
                            >
                                {icon}
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                    {label}
                                </p>
                                <p className="mt-0.5 font-['JetBrains_Mono',monospace] text-sm text-muted-foreground/70">
                                    {subtext}
                                </p>
                            </div>

                            <span className="font-['Sora',sans-serif] text-xl font-bold tracking-tight text-foreground">
                                {value}
                            </span>
                        </div>
                    )
                )}
            </div>
        </div>
    );
}
