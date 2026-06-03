import { BookOpen, Target, Fire, Lightning } from '@phosphor-icons/react';
import type { ProfileData } from '../types/profile';

interface ProfileStatsGridProps {
    globalStats: ProfileData['global_stats'];
    streaks: ProfileData['streaks'];
}

export default function ProfileStatsGrid({ globalStats, streaks }: ProfileStatsGridProps) {
    const metrics = [
        {
            icon: <BookOpen size={15} weight="duotone" />,
            label: 'Questions Solved',
            value: globalStats.total_unique_solved.toLocaleString('en-IN'),
            subtext: `Total Attempts: ${globalStats.total_attempts}`, // 👈 Utilized total_attempts
            primary: true,
        },
        {
            icon: <Target size={15} weight="duotone" />,
            label: 'Accuracy',
            value: `${globalStats.overall_accuracy}%`,
            subtext: 'Across all modules',
            primary: false,
        },
        {
            icon: <Fire size={15} weight="duotone" />,
            label: 'Study Streak',
            value: `${streaks.study_current}d`,
            subtext: `Longest: ${streaks.study_longest}d`, // 👈 Clear secondary metric row
            primary: false,
        },
        {
            icon: <Lightning size={15} weight="duotone" />, // 👈 Using Lightning for learning streak
            label: 'Learning Streak',
            value: `${streaks.learning_current}d`, // 👈 Utilized learning_current
            subtext: `Longest: ${streaks.learning_longest}d`, // 👈 Utilized learning_longest
            primary: false,
        },
    ];

    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {metrics.map(({ icon, label, value, subtext, primary }) => (
                <div
                    key={label}
                    className={`rounded-md border shadow-sm p-4 flex flex-col gap-1.5 transition-all ${
                        primary
                            ? 'bg-blue-500 dark:bg-blue-600 border-blue-400 dark:border-blue-500'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}
                >
                    <span
                        className={primary ? 'text-blue-200' : 'text-slate-400 dark:text-slate-500'}
                    >
                        {icon}
                    </span>
                    <span
                        className={`text-xl font-bold leading-none ${primary ? 'text-white' : 'text-slate-800 dark:text-slate-100'}`}
                    >
                        {value}
                    </span>
                    <div className="flex flex-col">
                        <span
                            className={`text-[10px] uppercase tracking-wider font-semibold ${primary ? 'text-blue-100' : 'text-slate-400 dark:text-slate-500'}`}
                        >
                            {label}
                        </span>
                        <span
                            className={`text-[10px] mt-0.5 font-medium ${primary ? 'text-blue-200/80' : 'text-slate-400 dark:text-slate-500'}`}
                        >
                            {subtext}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
}
