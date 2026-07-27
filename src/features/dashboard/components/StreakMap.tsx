import { useContext, useMemo } from 'react';
import { motion } from 'framer-motion';
import AppSettingContext from '@/app/providers/AppSettingContext.ts';
import { ResponsiveTimeRange } from '@nivo/calendar';
import { itemVariants } from '@/shared/utils/motionVariants.ts';
import type { Stats } from '@/shared/types/Stats.ts';

type StreakMapType = {
    stats: Stats;
};

const StreakMap = ({ stats }: StreakMapType) => {
    const {
        settings: { darkMode: isDark },
    } = useContext(AppSettingContext)!;

    const toDate = new Date('2027-02-08');
    const toIso = toDate.toISOString().slice(0, 10);
    const toLabel = toDate.toLocaleDateString();

    const maxCount = useMemo(
        () => Math.max(...stats.heatmapData.map((d) => d.count), 1),
        [stats.heatmapData],
    );

    const bucketedData = useMemo(() => {
        return stats.heatmapData.map((d) => {
            const normalized = d.count / maxCount;

            let level = 0;
            if (normalized > 0.8) level = 5;
            else if (normalized > 0.6) level = 4;
            else if (normalized > 0.4) level = 3;
            else if (normalized > 0.2) level = 2;
            else if (normalized > 0) level = 1;

            return {
                day: d.date,
                value: level,
            };
        });
    }, [stats.heatmapData, maxCount]);

    const colors = isDark
        ? ['rgba(255,255,255,0.06)', '#064e3b', '#047857', '#10b981', '#34d399', '#6ee7b7']
        : ['#ebedf0', '#c6e48b', '#7bc96f', '#40c463', '#30a14e', '#216e39'];

    return (
        <motion.div
            variants={itemVariants}
            initial="initial"
            animate="animate"
            className="relative mb-4 overflow-hidden rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-xl backdrop-saturate-150 shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:border-white/10 dark:bg-white/[0.06]"
        >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/10 to-transparent dark:from-white/5" />

            <div className="relative mb-4">
                <span className="text-sm text-muted-foreground">Feb 8, 2026 → {toLabel}</span>

                <div className="mt-3 flex flex-wrap gap-2">
                    <div className="rounded-xl border border-yellow-400/20 bg-yellow-500/10 px-3 py-1.5 text-sm backdrop-blur-md">
                        <span className="text-muted-foreground">Longest:</span>{' '}
                        <span className="font-bold text-yellow-500">{stats?.streaks.longest}</span>
                    </div>

                    <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-1.5 text-sm backdrop-blur-md">
                        <span className="text-muted-foreground">Current:</span>{' '}
                        <span className="font-bold text-emerald-500">{stats?.streaks.current}</span>
                    </div>
                </div>
            </div>

            <div className="relative w-full overflow-x-auto no-scrollbar">
                <div className="min-w-[860px] sm:min-w-0">
                    <div className="h-[110px] sm:h-[150px] pr-2">
                        <ResponsiveTimeRange
                            data={bucketedData}
                            from="2026-02-07"
                            to={toIso}
                            emptyColor={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}
                            colors={colors}
                            minValue={0}
                            maxValue={5}
                            tooltip={({ day }) => {
                                const original = stats.heatmapData.find((d) => d.date === day);

                                return (
                                    <div
                                        style={{
                                            background: isDark
                                                ? 'rgba(24,24,27,0.3)'
                                                : 'rgba(255,255,255,0.8)',
                                            backdropFilter: 'blur(20px)',
                                            padding: '8px 10px',
                                            borderRadius: 12,
                                            fontSize: 12,
                                            color: isDark ? '#f9fafb' : '#111827',
                                            border: '1px solid rgba(255,255,255,0.2)',
                                            boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                                        }}
                                    >
                                        <div>
                                            <strong>{day}</strong>
                                        </div>

                                        <div>
                                            Questions solved:{' '}
                                            <strong>{original?.count ?? 0}</strong>
                                        </div>
                                    </div>
                                );
                            }}
                            theme={{
                                text: {
                                    fill: isDark ? '#e5e7eb' : '#111827',
                                },
                                labels: {
                                    text: {
                                        fill: isDark ? '#e5e7eb' : '#111827',
                                    },
                                },
                                legends: {
                                    text: {
                                        fill: isDark ? '#e5e7eb' : '#111827',
                                    },
                                },
                            }}
                            dayBorderWidth={2}
                            dayBorderColor={isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}
                        />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default StreakMap;
