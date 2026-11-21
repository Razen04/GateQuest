import { eyebrow, glassPanel } from '../styles/profileTheme';
import type { ProfileData } from '../types/profile';

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
            ? 'bg-chart-1'
            : type === 'numerical'
              ? 'bg-chart-6'
              : 'bg-chart-5';

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
                            const colorClass = typeColor(qt.type);

                            return (
                                <div key={qt.type}>
                                    <div className="mb-2 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className={`h-2.5 w-2.5 ${colorClass}`}
                                            />
                                            <span className="text-xs text-muted-foreground">
                                                {getFixedType(qt.type)}
                                            </span>
                                        </div>
                                        <span className="font-['JetBrains_Mono',monospace] text-xs font-medium text-foreground">
                                            {qt.solved}/{qt.total_available}
                                        </span>
                                    </div>

                                    <div className="h-2 overflow-hidden bg-muted">
                                        <div
                                            className={`h-full transition-all ${colorClass}`}
                                            style={{ width: `${pct}%` }}
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
