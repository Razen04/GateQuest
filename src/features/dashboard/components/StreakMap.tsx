import { ResponsiveTimeRange } from '@nivo/calendar';
import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { useSettingsStore } from '@/app/stores/useSettingsStore';
import type { Stats } from '@/shared/types/Stats.ts';
import { itemVariants } from '@/shared/utils/motionVariants.ts';

type StreakMapType = {
    stats: Stats;
};

const StreakMap = ({ stats }: StreakMapType) => {
    const isDark = useSettingsStore((s) => s.settings.darkMode);

    const heatmapObj = useMemo(() => {
        return stats.heatmapData;
    }, [stats]);

    const { fromIso, toIso, fromDate, endDate } = useMemo(() => {
        const fromStr = heatmapObj?.from_date;
        const toStr = heatmapObj?.to_date;

        if (fromStr && toStr) {
            return {
                fromIso: fromStr,
                toIso: toStr,
                fromDate: new Date(`${fromStr}T00:00:00`),
                endDate: new Date(`${toStr}T00:00:00`),
            };
        }

        const end = new Date();
        const from = new Date();
        from.setDate(end.getDate() - 52 * 7);

        return {
            fromDate: from,
            endDate: end,
            fromIso: from.toISOString().slice(0, 10),
            toIso: end.toISOString().slice(0, 10),
        };
    }, [heatmapObj]);

    const bucketedData = useMemo(() => {
        const rawData = heatmapObj?.data ?? {};

        const entries = Array.isArray(rawData)
            ? rawData.map((item) => ({
                  day: item.date ?? item.day,
                  raw: Number(item.count ?? item.value ?? 0),
              }))
            : Object.entries(rawData).map(([date, count]) => ({
                  day: date,
                  raw: Number(count),
              }));

        const max = Math.max(...entries.map((e) => e.raw), 1);

        return entries.map(({ day, raw }) => {
            const normalized = raw / max;
            let value = 0;
            if (normalized > 0.8) value = 5;
            else if (normalized > 0.6) value = 4;
            else if (normalized > 0.4) value = 3;
            else if (normalized > 0.2) value = 2;
            else if (normalized > 0) value = 1;
            return { day, value };
        });
    }, [heatmapObj]);

    const rawLookup = useMemo(() => {
        const rawData = heatmapObj?.data ?? {};
        if (Array.isArray(rawData)) {
            return Object.fromEntries(
                rawData.map((item) => [
                    item.date ?? item.day,
                    Number(item.count ?? item.value ?? 0),
                ])
            );
        }
        return Object.fromEntries(
            Object.entries(rawData).map(([date, count]) => [
                date,
                Number(count),
            ])
        );
    }, [heatmapObj]);

    const maxCount = useMemo(() => {
        if (!bucketedData.length) return 1;
        return Math.max(...bucketedData.map((d) => d.value), 1);
    }, [bucketedData]);

    const colors = isDark
        ? ['#064e3b', '#047857', '#059669', '#10b981', '#34d399']
        : ['#bbf7d0', '#86efac', '#4ade80', '#22c55e', '#16a34a'];

    const streakCards = [
        {
            label: 'Study Longest',
            value: stats.streaks?.study_longest ?? 0,
            color: 'yellow',
        },
        {
            label: 'Study Current',
            value: stats.streaks?.study_current ?? 0,
            color: 'emerald',
        },
        {
            label: 'Learning Longest',
            value: stats.streaks?.learning_longest ?? 0,
            color: 'yellow',
        },
        {
            label: 'Learning Current',
            value: stats.streaks?.learning_current ?? 0,
            color: 'emerald',
        },
    ];

    return (
        <motion.div
            variants={itemVariants}
            initial="initial"
            animate="animate"
            className="relative border border-white/20 bg-white/40 dark:bg-white/[0.06] backdrop-blur-2xl shadow-sm p-4 overflow-visible"
        >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/30 to-transparent dark:from-white/10" />

            <div className="relative">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h3 className="text-sm font-semibold text-slate-800 dark:text-white">
                            Activity Streak
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-white/50">
                            {fromDate.toLocaleDateString('en-US', {
                                month: 'short',
                                year: 'numeric',
                            })}{' '}
                            →{' '}
                            {endDate.toLocaleDateString('en-US', {
                                month: 'short',
                                year: 'numeric',
                            })}
                        </p>
                    </div>
                </div>

                {/* Streak summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                    {streakCards.map((item) => (
                        <div
                            key={item.label}
                            className={`border px-3 py-2 backdrop-blur-xl ${
                                item.color === 'yellow'
                                    ? 'border-yellow-400/20 bg-yellow-400/10'
                                    : 'border-emerald-400/20 bg-emerald-400/10'
                            }`}
                        >
                            <p className="text-[10px] text-slate-500 dark:text-white/50">
                                {item.label}
                            </p>
                            <p
                                className={`text-lg font-bold ${
                                    item.color === 'yellow'
                                        ? 'text-yellow-500'
                                        : 'text-emerald-500'
                                }`}
                            >
                                {item.value}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Chart */}
                <div className="relative w-full overflow-x-auto overflow-y-visible no-scrollbar pt-6">
                    <div className="h-[190px] min-w-[1200px] sm:min-w-full">
                        <ResponsiveTimeRange
                            data={bucketedData}
                            from={fromIso}
                            to={toIso}
                            emptyColor={
                                isDark
                                    ? 'rgba(255,255,255,0.08)'
                                    : 'rgba(15,23,42,0.06)'
                            }
                            colors={colors}
                            minValue={0}
                            maxValue={5}
                            margin={{
                                top: 25,
                                right: 15,
                                bottom: 15,
                                left: 15,
                            }}
                            daySpacing={5}
                            dayRadius={0}
                            dayBorderWidth={2}
                            dayBorderColor="transparent"
                            tooltip={({ day }) => (
                                <div className="border border-white/20 bg-white/90 dark:bg-zinc-900/95 backdrop-blur-xl shadow-xl px-3 py-2 text-xs text-slate-800 dark:text-white z-10">
                                    <strong>{day}</strong>
                                    <div className="mt-1 text-slate-500 dark:text-white/60">
                                        Questions solved:{' '}
                                        <strong>{rawLookup[day] ?? 0}</strong>
                                    </div>
                                </div>
                            )}
                            theme={{
                                background: 'transparent',
                                text: { fill: isDark ? '#CBD5E1' : '#64748B' },
                                labels: {
                                    text: {
                                        fontSize: 10,
                                        fill: isDark ? '#94A3B8' : '#64748B',
                                        fontFamily:
                                            'Plus Jakarta Sans, sans-serif',
                                    },
                                },
                            }}
                        />
                    </div>
                </div>

                <div className="mt-4 flex items-center justify-end gap-2 text-[11px] text-slate-500 dark:text-white/50">
                    <span>Less</span>
                    {colors.map((color, i) => (
                        <div
                            key={i}
                            className="h-2.5 w-2.5 border border-white/20"
                            style={{ backgroundColor: color }}
                        />
                    ))}
                    <span>More</span>
                </div>
            </div>
        </motion.div>
    );
};

export default StreakMap;
