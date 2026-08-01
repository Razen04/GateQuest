import { useContext, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChartBar } from '@phosphor-icons/react';
import { ResponsiveTimeRange } from '@nivo/calendar';
import AppSettingContext from '@/app/providers/AppSettingContext.ts';
import { itemVariants } from '@/shared/utils/motionVariants.ts';
import { Card, CardContent } from '@/shared/components/ui/card';
import type { ProfileData } from '../types/profile';

interface ProfileHeatmapProps {
    heatmapData: ProfileData['heatmap'];
}

export default function ProfileHeatmap({ heatmapData }: ProfileHeatmapProps) {
    const context = useContext(AppSettingContext);
    const isDark = context?.settings?.darkMode ?? false;

    // ── 🔥 HOOKS MOVED UNCONDITIONALLY TO THE TOP ──
    const maxCount = useMemo(() => {
        if (!heatmapData || heatmapData.length === 0) return 1;
        return Math.max(...heatmapData.map((d) => d.count), 1);
    }, [heatmapData]);

    const bucketedData = useMemo(() => {
        if (!heatmapData || heatmapData.length === 0) return [];
        return heatmapData.map((d) => {
            const dayStr = d.date.split('T')[0];
            const normalized = d.count / maxCount;

            let level = 0;
            if (normalized > 0.8) level = 5;
            else if (normalized > 0.6) level = 4;
            else if (normalized > 0.4) level = 3;
            else if (normalized > 0.2) level = 2;
            else if (normalized > 0) level = 1;

            return {
                day: dayStr,
                value: level,
            };
        });
    }, [heatmapData, maxCount]);

    const dateBounds = useMemo(() => {
        if (bucketedData.length === 0) return { from: '', to: '' };
        const sortedDays = bucketedData.map((d) => d.day).sort();
        return {
            from: sortedDays[0],
            to: sortedDays[sortedDays.length - 1],
        };
    }, [bucketedData]);

    // ── 🛡️ EARLY RETURN SAFE BELOW HOOKS ──
    if (!heatmapData || heatmapData.length === 0) {
        return (
            <Card className="border-slate-200 dark:border-slate-700">
                <CardContent className="p-5 text-center text-xs text-slate-400">
                    No activity data available.
                </CardContent>
            </Card>
        );
    }

    // High contrast theme adjustments
    const colors = isDark
        ? ['#334155', '#0e4429', '#006d32', '#26a641', '#2ea043', '#39d353'] // Swapped index 0 to visible Slate-700
        : ['#ebedf0', '#c6e48b', '#7bc96f', '#40c463', '#30a14e', '#216e39'];

    return (
        <motion.div variants={itemVariants} initial="initial" animate="animate" className="w-full">
            <Card className="shadow-sm rounded-md">
                <CardContent className="p-5">
                    {/* Header Row */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <ChartBar size={14} className="text-slate-400 dark:text-slate-500" />
                            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                Daily Activity
                            </span>
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-['JetBrains_Mono',monospace]">
                            Last 26 weeks
                        </span>
                    </div>

                    {/* Nivo Chart Container — Height expanded to fix clipping */}
                    <div className="h-[160px] w-full overflow-x-auto overflow-y-hidden">
                        <div className="h-full min-w-[720px] pr-2">
                            <ResponsiveTimeRange
                                data={bucketedData}
                                from={dateBounds.from}
                                to={dateBounds.to}
                                emptyColor={isDark ? '#334155' : '#ebedf0'} // High contrast empty blocks
                                colors={colors}
                                minValue={0}
                                maxValue={5}
                                margin={{ top: 40, right: 10, bottom: 10, left: 10 }} // Pushed chart down for tooltip breathing room
                                dayBorderWidth={3} // Wider gaps
                                dayBorderColor={isDark ? '#1e2937' : '#ffffff'} // Gaps match Card Background perfectly!
                                weekdayLegendFormat=""
                                dayRadius={2}
                                theme={{
                                    text: { fill: isDark ? '#94a3b8' : '#64748b' },
                                    labels: {
                                        text: {
                                            fontSize: 10,
                                            fill: isDark ? '#94a3b8' : '#64748b',
                                            fontFamily: 'Plus Jakarta Sans, sans-serif',
                                        },
                                    },
                                }}
                                tooltip={({ day }) => {
                                    const original = heatmapData.find(
                                        (d) => d.date.split('T')[0] === day,
                                    );

                                    return (
                                        <div
                                            className="border rounded-lg px-2.5 py-1.5 shadow-md text-xs font-medium animate-in fade-in-50 duration-100 z-50"
                                            style={{
                                                background: isDark ? '#111827' : '#ffffff',
                                                borderColor: isDark ? '#1f2937' : '#e2e8f0',
                                                color: isDark ? '#f9fafb' : '#111827',
                                            }}
                                        >
                                            <div>
                                                <strong>{day}</strong>
                                            </div>
                                            <div className="mt-0.5 text-slate-500 dark:text-slate-400">
                                                Attempts:{' '}
                                                <strong className="text-blue-500 dark:text-blue-400">
                                                    {original?.count ?? 0}
                                                </strong>
                                            </div>
                                        </div>
                                    );
                                }}
                            />
                        </div>
                    </div>

                    {/* Custom Legend Tracker */}
                    <div className="flex items-center gap-1.5 mt-2 justify-end text-[10px] text-slate-400 dark:text-slate-500">
                        <span>Less</span>
                        {colors.map((colorHex, i) => (
                            <div
                                key={i}
                                className="w-2.5 h-2.5 rounded-[2px]"
                                style={{ backgroundColor: colorHex }}
                            />
                        ))}
                        <span>More</span>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
