import type { ProfileData } from '../types/profile';
import { glassPanel, eyebrow, palette } from '../styles/profileTheme';

interface ProfileSidePanelProps {
    globalStats: ProfileData['global_stats'];
}

export default function ProfileSidePanel({
    globalStats,
}: ProfileSidePanelProps) {
    const getFixedType = (type: string) => {
        if (type === 'multiple-choice') return 'MCQ';
        if (type === 'numerical') return 'NAT';
        return 'MSQ';
    };

    const typeColor = (type: string) =>
        type === 'multiple-choice'
            ? palette.photon
            : type === 'numerical'
              ? palette.violet
              : palette.ember;

    return (
        <div className="flex flex-col gap-4">
            {/* Question type breakdown */}
            {globalStats.question_types.length > 0 && (
                <div className={`${glassPanel} p-5`}>
                    <p className={`mb-5 ${eyebrow}`}>Question types</p>

                    <div className="space-y-4">
                        {globalStats.question_types.map((qt) => {
                            const pct =
                                globalStats.total_unique_solved > 0
                                    ? Math.round(
                                          (qt.solved / qt.total_available) * 100
                                      )
                                    : 0;
                            const color = typeColor(qt.type);

                            return (
                                <div key={qt.type}>
                                    <div className="mb-2 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="h-2.5 w-2.5"
                                                style={{
                                                    backgroundColor: color,
                                                }}
                                            />
                                            <span className="text-xs text-slate-600 dark:text-white/65">
                                                {getFixedType(qt.type)}
                                            </span>
                                        </div>
                                        <span className="font-['JetBrains_Mono',monospace] text-xs font-medium text-slate-700 dark:text-white/75">
                                            {qt.solved}/{qt.total_available}
                                        </span>
                                    </div>

                                    <div className="h-2 overflow-hidden bg-slate-900/5 dark:bg-white/10">
                                        <div
                                            className="h-full transition-all"
                                            style={{
                                                width: `${pct}%`,
                                                backgroundColor: color,
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
