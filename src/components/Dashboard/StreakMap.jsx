import React, { useContext } from 'react'
import { motion } from 'framer-motion';
import AppSettingContext from '../../context/AppSettingContext';
import { ResponsiveTimeRange } from '@nivo/calendar';
import { itemVariants } from '../../utils/motionVariants';

const StreakMap = ({ stats }) => {

    const { settings: { darkMode: isDark } } = useContext(AppSettingContext);
    const toDate = new Date();
    toDate.setMonth(toDate.getMonth() + 1);
    const toIso = toDate.toISOString().slice(0, 10);
    const toLabel = toDate.toLocaleDateString();

    return (
        <motion.div
            variants={itemVariants}
            initial="initial"
            animate="animate"
            className="p-6 border mb-4 shadow-sm rounded-xl border-border-primary dark:border-border-primary-dark"
        >
            <div className="mb-4">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Streak Map</h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">Feb 7, 2025 → {toLabel}</span>
                <div className='flex space-x-4'>
                    <h2>Longest Streak: <span className='font-bold text-blue-500'>{stats?.streaks.longest}</span></h2>
                    <h2>Current Streak: <span className='font-bold text-purple-500'>{stats?.streaks.current}</span></h2>
                </div>           
            </div>
            <div className='w-full overflow-x-auto sm:overflow-x-visible'>
                <div className='min-w-[860px] sm:min-w-0'>
                    <div className='h-[200px] sm:h-[200px] md:h-[210px] lg:h-[230px] xl:h-[250px] pr-2'>
                        <ResponsiveTimeRange
                            data={stats.heatmapData.map(d => ({
                                day: d.date,
                                value: d.count
                            }))}
                            from="2025-02-07"
                            to={toIso}
                            emptyColor={isDark ? '#18181B' : '#F9FAFB'}
                            colors={
                                isDark
                                    ? ['#1f2937', '#312e81', '#4338ca', '#4f46e5', '#6366f1', '#818cf8'] // no “zero” color
                                    : ['#ebedf0', '#c7d2fe', '#a5b4fc', '#818cf8', '#6366f1', '#4f46e5']
                            }
                            minValue={0} // start coloring from count=1
                            maxValue={Math.max(...stats.heatmapData.map(d => d.count))}
                            theme={{
                                text: { fill: isDark ? '#e5e7eb' : '#111827' },
                                labels: { text: { fill: isDark ? '#e5e7eb' : '#111827' } },
                                legends: { text: { fill: isDark ? '#e5e7eb' : '#111827' } },
                                tooltip: {
                                    container: {
                                        background: isDark ? '#111827' : '#ffffff',
                                        color: isDark ? '#f9fafb' : '#111827',
                                        fontSize: 12,
                                        borderRadius: 6,
                                        boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                                    }
                                }
                            }}
                            margin={{ top: 30, right: 20, bottom: 10, left: 20 }}
                            monthBorderColor={isDark ? '#18181B' : '#F9FAFB'}
                            dayBorderWidth={2}
                            dayBorderColor={isDark ? '#18181B' : '#F9FAFB'}
                            weekdayLegend={() => ''}
                            legends={[
                                {
                                    anchor: 'bottom-right',
                                    direction: 'row',
                                    translateY: 36,
                                    itemCount: 5,
                                    itemWidth: 30,
                                    itemHeight: 14,
                                    itemsSpacing: 4,
                                    itemDirection: 'right-to-left',
                                    symbolSize: 14,
                                    itemTextColor: isDark ? '#e5e7eb' : '#111827'
                                }
                            ]}
                        />
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

export default StreakMap