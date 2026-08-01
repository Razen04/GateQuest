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

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    const fromDate = new Date(endDate);
    fromDate.setDate(endDate.getDate() - 52 * 7);

    const fromIso = fromDate.toISOString().slice(0, 10);
    const toIso = endDate.toISOString().slice(0, 10);

    const heatmapLookup = useMemo(
        () => Object.fromEntries(stats.heatmapData.map((item) => [item.date, item])),
        [stats.heatmapData],
    );

    const maxCount = useMemo(
        () => Math.max(...stats.heatmapData.map((d) => d.count), 1),
        [stats.heatmapData],
    );

    const bucketedData = useMemo(
        () =>
            stats.heatmapData.map((item) => {
                const ratio = item.count / maxCount;

                return {
                    day: item.date,
                    value:
                        ratio > 0.8
                            ? 5
                            : ratio > 0.6
                              ? 4
                              : ratio > 0.4
                                ? 3
                                : ratio > 0.2
                                  ? 2
                                  : ratio > 0
                                    ? 1
                                    : 0,
                };
            }),
        [stats.heatmapData, maxCount],
    );

    const colors = isDark
        ? ['rgba(255,255,255,0.06)', '#064e3b', '#047857', '#059669', '#10b981', '#34d399']
        : ['rgba(15,23,42,0.06)', '#bbf7d0', '#86efac', '#4ade80', '#22c55e', '#16a34a'];

    const streakCards = [
        {
            label: 'Study Longest',
            value: stats.streaks.study_longest,
            color: 'yellow',
        },
        {
            label: 'Study Current',
            value: stats.streaks.study_current,
            color: 'emerald',
        },
        {
            label: 'Learning Longest',
            value: stats.streaks.learning_longest,
            color: 'yellow',
        },
        {
            label: 'Learning Current',
            value: stats.streaks.learning_current,
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
                            className={`
                                border px-3 py-2
                                backdrop-blur-xl
                                ${
                                    item.color === 'yellow'
                                        ? 'border-yellow-400/20 bg-yellow-400/10'
                                        : 'border-emerald-400/20 bg-emerald-400/10'
                                }
                            `}
                        >
                            <p className="text-[10px] text-slate-500 dark:text-white/50">
                                {item.label}
                            </p>

                            <p
                                className={`
                                    text-lg font-bold
                                    ${
                                        item.color === 'yellow'
                                            ? 'text-yellow-500'
                                            : 'text-emerald-500'
                                    }
                                `}
                            >
                                {item.value}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Chart */}
                <div className="relative w-full overflow-x-auto overflow-y-visible no-scrollbar pt-6">
                    <div className="h-[190px] min-w-[720px] sm:min-w-full">
                        <ResponsiveTimeRange
                            data={bucketedData}
                            from={fromIso}
                            to={toIso}
                            emptyColor={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)'}
                            colors={colors}
                            minValue={0}
                            maxValue={5}
                            margin={{
                                top: 25,
                                right: 10,
                                bottom: 10,
                                left: 10,
                            }}
                            daySpacing={5}
                            dayRadius={4}
                            dayBorderWidth={2}
                            dayBorderColor={
                                isDark ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.05)'
                            }
                            tooltip={({ day }) => {
                                const item = heatmapLookup[day];

                                return (
                                    <div className="border border-white/20 bg-white/90 dark:bg-zinc-900/95 backdrop-blur-xl shadow-xl px-3 py-2 text-xs text-slate-800 dark:text-white">
                                        <strong>{day}</strong>

                                        <div className="mt-1 text-slate-500 dark:text-white/60">
                                            Questions solved: <strong>{item?.count ?? 0}</strong>
                                        </div>
                                    </div>
                                );
                            }}
                            theme={{
                                text: {
                                    fill: isDark ? '#cbd5e1' : '#64748b',
                                },
                                labels: {
                                    text: {
                                        fill: isDark ? '#cbd5e1' : '#64748b',
                                    },
                                },
                            }}
                        />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default StreakMap;
