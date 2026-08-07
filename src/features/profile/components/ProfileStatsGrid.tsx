import { BookOpen, Fire, Lightning, Target } from '@phosphor-icons/react';
import { glassPanel, palette } from '../styles/profileTheme';
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
            color: palette.photon,
            label: 'Solved',
            value: globalStats.total_unique_solved.toLocaleString('en-IN'),
            subtext: `${globalStats.total_attempts} attempts`,
        },
        {
            icon: <Target size={17} weight="duotone" />,
            color: palette.mint,
            label: 'Accuracy',
            value: `${globalStats.overall_accuracy}%`,
            subtext: 'all modules',
        },
        {
            icon: <Fire size={17} weight="duotone" />,
            color: palette.ember,
            label: 'Study streak',
            value: `${streaks.study_current}d`,
            subtext: `best ${streaks.study_longest}d`,
        },
        {
            icon: <Lightning size={17} weight="duotone" />,
            color: palette.violet,
            label: 'Learning streak',
            value: `${streaks.learning_current}d`,
            subtext: `best ${streaks.learning_longest}d`,
        },
    ];

    return (
        <div className={glassPanel}>
            <div className="divide-y divide-slate-900/5 dark:divide-white/10">
                {metrics.map(({ icon, color, label, value, subtext }) => (
                    <div
                        key={label}
                        className="flex items-center gap-3 px-5 py-4"
                    >
                        <div
                            className="flex h-9 w-9 shrink-0 items-center justify-center"
                            style={{ backgroundColor: `${color}1A`, color }}
                        >
                            {icon}
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-white/45">
                                {label}
                            </p>
                            <p className="mt-0.5 font-['JetBrains_Mono',monospace] text-sm text-slate-400 dark:text-white/35">
                                {subtext}
                            </p>
                        </div>

                        <span className="font-['Sora',sans-serif] text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                            {value}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
