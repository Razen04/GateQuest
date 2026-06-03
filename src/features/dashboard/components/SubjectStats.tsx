import { motion } from 'framer-motion';
import { getBackgroundColor, SubjectIconMap } from '@/shared/utils/helper.ts';
import { itemVariants } from '@/shared/utils/motionVariants.ts';
import type React from 'react';

// Using the exact structure returned by your new RPC
type SubjectStat = {
    subject_name: string;
    subject_slug: string;
    icon_name: string;
    theme_color: string;
    attempted: number;
    accuracy: number;
    total_available: number;
    progress: number;
};

type SubjectStatsPropsType = {
    subjectStats: SubjectStat[];
};

const SubjectStats = ({ subjectStats }: SubjectStatsPropsType) => {
    return (
        <motion.div
            className="lg:col-span-2 space-y-8"
            variants={itemVariants}
            initial="initial"
            animate="animate"
        >
            <motion.div className="p-6 shadow-sm border border-border-primary dark:border-border-primary-dark rounded-2xl bg-white dark:bg-zinc-900">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                        Subject Stats
                    </h2>
                </div>

                <div className="space-y-4 flex justify-around">
                    <div className="overflow-x-auto">
                        <div className="flex gap-4 sm:gap-6 md:gap-8 px-2 py-4 w-full">
                            {subjectStats?.map((subject, index) => {
                                // 1. Map directly from backend properties!
                                const progress = subject.progress || 0;
                                const accuracy = subject.accuracy || 0;
                                const questionCount = subject.total_available || 0;
                                const attempted = subject.attempted || 0;

                                // 2. Safely map the icon and colors
                                const SubjectIcon = (SubjectIconMap[
                                    subject.icon_name || 'default'
                                ] || SubjectIconMap['default']) as React.ElementType;
                                const bgClass = getBackgroundColor(subject.theme_color || 'blue');

                                return (
                                    <motion.div
                                        key={subject.subject_slug || index}
                                        className="min-w-[250px] sm:min-w-[280px] md:min-w-[300px] shadow-sm border border-gray-100 dark:border-zinc-800 p-5 flex flex-col justify-between hover:shadow-md hover:bg-blue-50/50 dark:hover:bg-zinc-800/50 transition-all cursor-pointer rounded-2xl"
                                        whileHover={{ scale: 1.02 }}
                                    >
                                        <div className="flex items-center mb-4">
                                            <div
                                                className={`p-3 ${bgClass} rounded-xl text-white mr-3 shadow-sm`}
                                            >
                                                <SubjectIcon className="h-6 w-6" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 leading-tight">
                                                {subject.subject_name}
                                            </h3>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="mb-3">
                                            <div className="flex justify-between items-end mb-1">
                                                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                                    Progress
                                                </span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400 font-['JetBrains_Mono',monospace]">
                                                    {progress}%
                                                </span>
                                            </div>
                                            <div className="w-full h-2 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-500 rounded-full transition-all duration-500 ease-out"
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Accuracy */}
                                        <div className="mb-4">
                                            <div className="flex justify-between items-end mb-1">
                                                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                                    Accuracy
                                                </span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400 font-['JetBrains_Mono',monospace]">
                                                    {accuracy}%
                                                </span>
                                            </div>
                                            <div className="w-full h-2 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-green-500 rounded-full transition-all duration-500 ease-out"
                                                    style={{ width: `${accuracy}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Subject Info */}
                                        <div className="mt-auto pt-4 border-t border-gray-50 dark:border-zinc-800 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                                            <span>
                                                Attempted:{' '}
                                                <strong className="text-gray-700 dark:text-gray-300 font-['JetBrains_Mono',monospace]">
                                                    {attempted}
                                                </strong>
                                            </span>
                                            <span>
                                                Total:{' '}
                                                <strong className="text-gray-700 dark:text-gray-300 font-['JetBrains_Mono',monospace]">
                                                    {questionCount}
                                                </strong>
                                            </span>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default SubjectStats;
