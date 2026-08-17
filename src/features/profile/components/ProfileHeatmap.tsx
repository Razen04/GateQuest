import { ResponsiveTimeRange } from '@nivo/calendar';
import { ChartBar } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { useContext, useMemo } from 'react';
import AppSettingContext from '@/app/providers/AppSettingContext.ts';
import { itemVariants } from '@/shared/utils/motionVariants.ts';
import { eyebrow, glassPanel } from '../styles/profileTheme';
import type { ProfileData } from '../types/profile';

interface ProfileHeatmapProps {
    heatmapData: ProfileData['heatmap'];
}

export default function ProfileHeatmap({ heatmapData }: ProfileHeatmapProps) {
    const context = useContext(AppSettingContext);
    const isDark = context?.settings?.darkMode ?? false;

    // Calculate exactly 26 weeks leading up to today (CURRENT_DATE)
    const dateBounds = useMemo(() => {
        const to = new Date();
        to.setDate(to.getDate() + 30);

        const from = new Date(to);
        from.setDate(to.getDate() - 26 * 7); // Subtract 182 days (26 weeks)

        return {
            from: from.toISOString().slice(0, 10),
            to: to.toISOString().slice(0, 10),
        };
    }, []);

    // Determine max value for level normalization
    const maxCount = useMemo(() => {
        const values = Object.values(heatmapData?.data ?? {}).map(Number);
        if (values.length === 0) return 1;
        return Math.max(...values, 1);
    }, [heatmapData]);

    // Map counts into 5 activity level tiers
    const bucketedData = useMemo(() => {
        return Object.entries(heatmapData?.data ?? {}).map(([date, count]) => {
            const numericCount = Number(count);
            const normalized = numericCount / maxCount;

            let level = 0;
            if (normalized > 0.8) level = 5;
            else if (normalized > 0.6) level = 4;
            else if (normalized > 0.4) level = 3;
            else if (normalized > 0.2) level = 2;
            else if (normalized > 0) level = 1;

            return {
                day: date,
                value: level,
            };
        });
    }, [heatmapData, maxCount]);

    const heatmapLookup = heatmapData?.data ?? {};

    if (!heatmapData || Object.keys(heatmapData.data ?? {}).length === 0) {
        return (
            <div
                className={`${glassPanel} p-5 text-center text-xs text-slate-400`}
            >
                No activity data available.
            </div>
        );
    }

    const colors = isDark
        ? ['#1B2230', '#1E3A63', '#245490', '#2E70C4', '#3E8EFF', '#8AB9FF']
        : ['#E7ECF6', '#C7D9F5', '#9EBFEF', '#6FA0E8', '#3E8EFF', '#1F5FCC'];

    return (
        <motion.div variants={itemVariants} initial="initial" animate="animate">
            <div className={`${glassPanel} p-5`}>
                <div className="mb-5 flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center border border-white/60 bg-white/50 dark:border-white/10 dark:bg-white/[0.05]">
                        <ChartBar size={14} className="text-[#3E8EFF]" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            Daily activity
                        </p>
                        <p className={eyebrow}>Last 26 weeks</p>
                    </div>
                </div>

                <div className="relative w-full overflow-x-auto overflow-y-visible no-scrollbar pt-6">
                    <div className="h-[210px] min-w-[850px] sm:min-w-full pr-2">
                        <ResponsiveTimeRange
                            data={bucketedData}
                            from={dateBounds.from}
                            to={dateBounds.to}
                            emptyColor={isDark ? '#1B2230' : '#E7ECF6'}
                            colors={colors}
                            minValue={0}
                            maxValue={5}
                            margin={{
                                top: 25,
                                right: 15,
                                bottom: 15,
                                left: 15,
                            }}
                            dayBorderWidth={2}
                            dayRadius={0}
                            daySpacing={5}
                            dayBorderColor="transparent"
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
                            tooltip={({ day }) => {
                                const attempts = heatmapLookup[day] ?? 0;
                                return (
                                    <div className="border border-white/60 bg-white/70 px-3 py-2 text-xs backdrop-blur-2xl shadow-xl dark:border-white/10 dark:bg-slate-900/80 rounded-md">
                                        <div className="font-semibold">
                                            {day}
                                        </div>
                                        <div className="mt-1 text-slate-600 dark:text-white/60">
                                            Attempts{' '}
                                            <span className="font-semibold text-[#3E8EFF]">
                                                {attempts}
                                            </span>
                                        </div>
                                    </div>
                                );
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
}
