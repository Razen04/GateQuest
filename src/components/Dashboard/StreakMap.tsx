import { useContext, useMemo } from 'react';
import { motion } from 'framer-motion';
import AppSettingContext from '../../context/AppSettingContext.ts';
import { ResponsiveTimeRange } from '@nivo/calendar';
import { itemVariants } from '../../utils/motionVariants.ts';
import type { Stats } from '../../types/Stats.ts';

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
        ? ['#161b22', '#0e4429', '#006d32', '#26a641', '#2ea043', '#39d353']
        : ['#ebedf0', '#c6e48b', '#7bc96f', '#40c463', '#30a14e', '#216e39'];

    return (
        <motion.div
            variants={itemVariants}
            initial="initial"
            animate="animate"
            className="p-6 border mb-4 shadow-sm border-border-primary dark:border-border-primary-dark"
        >
            <div className="mb-4 text-black dark:text-white">
                <h2 className="text-2xl font-bold text-gray�[118;1:3u-800 dark:text-gray-200">
                    Streak Map
                </h2>

                <span className="text-sm text-gray-500 dark:text-gray-400">
                    Feb 8, 2026 → {toLabel}
                </span>

                <div className="flex space-x-4">
                    <h2>
                        Longest Streak:{' '}
                        <span className="font-bold text-yellow-500">{stats?.streaks.longest}</span>
                    </h2>
                    <h2>
                        Current Streak:{' '}
                        <span className="font-bold text-emerald-500">{stats?.streaks.current}</span>
                    </h2>
                </div>
            </div>

            <div className="w-full py-8 overflow-x-auto sm:overflow-x-visible">
                <div className="min-w-[860px] sm:min-w-0">
                    <div className="h-[100px] sm:h-[200px] md:h-[110px] lg:h-[100px] xl:h-[150px] pr-2">
                        <ResponsiveTimeRange
                            data={bucketedData}
                            from="2026-02-07"
                            to={toIso}
                            emptyColor={isDark ? '#161b22' : '#ebedf0'}
                            colors={colors}
                            minValue={0}
                            maxValue={5}
                            tooltip={({ day }) => {
                                const original = stats.heatmapData.find((d) => d.date === day);

                                return (
                                    <div
                                        style={{
                                            background: isDark ? '#111827' : '#ffffff',
                                            padding: '8px 10px',
                                            borderRadius: 6,
                                            fontSize: 12,
                                            color: isDark ? '#f9fafb' : '#111827',
                                            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
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
                                text: { fill: isDark ? '#e5e7eb' : '#111827' },
                                labels: { text: { fill: isDark ? '#e5e7eb' : '#111827' } },
                                legends: { text: { fill: isDark ? '#e5e7eb' : '#111827' } },
                            }}
                            dayBorderWidth={2}
                            dayBorderColor={isDark ? '#18181B' : '#F9FAFB'}
                        />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default StreakMap;
