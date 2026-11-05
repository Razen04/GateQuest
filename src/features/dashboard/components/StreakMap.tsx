import { ResponsiveTimeRange } from '@nivo/calendar';
import { motion } from 'framer-motion';
import { useMemo } from 'react';
import type { Stats } from '@/shared/types/Stats.ts';
import { itemVariants } from '@/shared/utils/motionVariants.ts';

type StreakMapType = {
    stats: Stats;
};

// Sequential heatmap scale — matches ProfileHeatmap.
// heatmap-0 is the empty/track color; heatmap-1..5 are the 5 activity levels.
const HEATMAP_COLORS = [
    'var(--heatmap-0)',
    'var(--heatmap-1)',
    'var(--heatmap-2)',
    'var(--heatmap-3)',
    'var(--heatmap-4)',
    'var(--heatmap-5)',
] as const;

const StreakMap = ({ stats }: StreakMapType) => {
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

    const streakCards = [
        {
            label: 'Study Longest',
            value: stats.streaks?.study_longest ?? 0,
            cardClass: 'border-chart-4/30 bg-chart-4/10',
            valueClass: 'text-chart-4',
        },
        {
            label: 'Study Current',
            value: stats.streaks?.study_current ?? 0,
            cardClass: 'border-chart-2/30 bg-chart-2/10',
            valueClass: 'text-chart-2',
        },
        {
            label: 'Learning Longest',
            value: stats.streaks?.learning_longest ?? 0,
            cardClass: 'border-chart-4/30 bg-chart-4/10',
            valueClass: 'text-chart-4',
        },
        {
            label: 'Learning Current',
            value: stats.streaks?.learning_current ?? 0,
            cardClass: 'border-chart-2/30 bg-chart-2/10',
            valueClass: 'text-chart-2',
        },
    ];

    return (
        <motion.div
            variants={itemVariants}
            initial="initial"
            animate="animate"
            className="
                relative isolate overflow-visible
                border border-border
                bg-card/70 text-card-foreground
                shadow-sm backdrop-blur-2xl
                p-4 font-sans
            "
        >
            {/* Subtle glass overlay */}
            <div
                className="
                pointer-events-none absolute inset-x-0 top-0 h-24
                bg-gradient-to-b
                from-foreground/[0.04] to-transparent
            "
            />

            <div className="relative">
                {/* Header */}
                <div className="mb-3 flex items-center justify-between">
                    <div>
                        <h3
                            className="
                            text-sm font-bold
                            font-display
                            text-card-foreground
                        "
                        >
                            Activity Streak
                        </h3>

                        <p
                            className="
                            text-xs text-muted-foreground
                            tabular-nums
                        "
                        >
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
                <div
                    className="
                    mb-4 grid grid-cols-2 gap-2
                    sm:grid-cols-4
                "
                >
                    {streakCards.map((item) => (
                        <div
                            key={item.label}
                            className={`
                                border ${item.cardClass}
                                px-3 py-2 backdrop-blur-xl
                            `}
                        >
                            <p className="text-[10px] text-muted-foreground">
                                {item.label}
                            </p>

                            <p
                                className={`
                                    text-lg font-bold
                                    ${item.valueClass}
                                    font-display
                                    tabular-nums
                                `}
                            >
                                {item.value}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Activity heatmap */}
                <div
                    className="
                    relative w-full overflow-x-auto
                    overflow-y-visible pt-6
                    [scrollbar-width:none]
                    [&::-webkit-scrollbar]:hidden
                "
                >
                    <div className="h-[190px] min-w-[1200px] sm:min-w-full">
                        <ResponsiveTimeRange
                            data={bucketedData}
                            from={fromIso}
                            to={toIso}
                            emptyColor="var(--heatmap-0)"
                            colors={[...HEATMAP_COLORS]}
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
                                <div
                                    className="
                                    z-10 border border-border
                                    bg-popover text-popover-foreground
                                    shadow-xl backdrop-blur-xl
                                    px-3 py-2 text-xs
                                    font-sans
                                "
                                >
                                    <strong>{day}</strong>

                                    <div className="mt-1 text-muted-foreground">
                                        Questions solved:{' '}
                                        <strong className="text-popover-foreground">
                                            {rawLookup[day] ?? 0}
                                        </strong>
                                    </div>
                                </div>
                            )}
                            theme={{
                                background: 'transparent',
                                text: {
                                    fill: 'var(--muted-foreground)',
                                },
                                labels: {
                                    text: {
                                        fontSize: 10,
                                        fill: 'var(--muted-foreground)',
                                        fontFamily: 'Manrope, sans-serif',
                                    },
                                },
                            }}
                        />
                    </div>
                </div>

                {/* Heatmap legend */}
                <div
                    className="
                    mt-4 flex items-center justify-end
                    gap-2 text-[11px]
                    text-muted-foreground
                "
                >
                    <span>Less</span>

                    {HEATMAP_COLORS.map((color, i) => (
                        <div
                            key={i}
                            className="h-2.5 w-2.5 border border-border"
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
