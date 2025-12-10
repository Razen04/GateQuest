import React from 'react';
import { motion } from 'framer-motion';
import { getBackgroundColor } from '../../helper.ts';
import { Laptop } from '@phosphor-icons/react';
import subjects from '../../data/subjects.ts';
import { itemVariants } from '../../utils/motionVariants.ts';
import type { SubjectStat } from '../../types/Stats.ts';

type SubjectStatsPropsType = {
    subjectStats: SubjectStat[];
};

type subjectMetaType = {
    id: number;
    name: string;
    apiName: string;
    icon: React.ElementType;
    questions: number;
    difficulty: string;
    category: string;
    color: string;
};

const SubjectStats = ({ subjectStats }: SubjectStatsPropsType) => {
    return (
        <motion.div
            className="lg:col-span-2 space-y-8"
            variants={itemVariants}
            initial="initial"
            animate="animate"
        >
            <motion.div className="p-6 shadow-sm border border-border-primary dark:border-border-primary-dark">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                        Subject Stats
                    </h2>
                </div>

                <div className="space-y-4 flex justify-around">
                    {/* Courses */}
                    <div className="overflow-x-auto">
                        <div className="flex gap-4 sm:gap-6 md:gap-8 px-2 py-4 w-full">
                            {subjectStats?.map((subject, index) => {
                                const progress = Number(subject.progress) || 0;
                                const accuracy = Number(subject.accuracy) || 0;

                                // Find the subject meta info
                                const subjectMeta: subjectMetaType | undefined = subjects.find(
                                    (s) => s.apiName === subject.subject,
                                );
                                const Icon = subjectMeta?.icon || Laptop; // fallback icon
                                const questionCount = subjectMeta?.questions;
                                const subjectColor = subjectMeta?.color;
                                const bgClass = getBackgroundColor(subjectColor as string);

                                return (
                                    <motion.div
                                        key={index}
                                        className="min-w-[250px] sm:min-w-[280px] md:min-w-[300px] shadow-md border border-gray-100 dark:border-zinc-800 p-5 flex flex-col justify-between hover:shadow-lg hover:bg-blue-50 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                                        whileHover={{ scale: 1.03 }}
                                    >
                                        <div className="flex items-center mb-4">
                                            <div className={`p-3 ${bgClass} text-white mr-3`}>
                                                <Icon className={`h-6 w-6 ${bgClass}`} />
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                                                {subject.subject}
                                            </h3>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="mb-2">
                                            <span className="text-sm text-gray-600 dark:text-gray-300">
                                                Progress
                                            </span>
                                            <div className="w-full h-2 bg-gray-200 rounded-full mt-1 overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-500 rounded-full transition-all duration-300 ease-out"
                                                    style={{
                                                        width: `${progress}%`,
                                                    }}
                                                ></div>
                                            </div>
                                            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 inline-block">
                                                {progress}% complete
                                            </span>
                                        </div>

                                        {/* Accuracy */}
                                        <div className="mb-2">
                                            <span className="text-sm text-gray-600 dark:text-gray-300">
                                                Accuracy
                                            </span>
                                            <div className="w-full h-2 bg-gray-200 rounded-full mt-1 overflow-hidden">
                                                <div
                                                    className="h-full bg-green-500 rounded-full transition-all duration-300 ease-out"
                                                    style={{
                                                        width: `${accuracy}%`,
                                                    }}
                                                ></div>
                                            </div>
                                            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 inline-block">
                                                {accuracy}% correct
                                            </span>
                                        </div>

                                        {/* Subject Info */}
                                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                            <p>
                                                Attempted: <strong>{subject.attempted}</strong>
                                            </p>
                                            <p>
                                                Total Questions: <strong>{questionCount}</strong>
                                            </p>
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
