import { motion } from 'framer-motion';
import { getBackgroundColor, SubjectIconMap } from '@/shared/utils/helper.ts';
import { itemVariants } from '@/shared/utils/motionVariants.ts';
import type { SubjectStat } from '@/shared/types/Stats.ts';
import { useGoals } from '@/shared/hooks/useGoals.ts';
import type React from 'react';

type SubjectStatsPropsType = {
    subjectStats: SubjectStat[];
};

const SubjectStats = ({ subjectStats }: SubjectStatsPropsType) => {
    const { getPracticeSubjects } = useGoals();
    const subjects = getPracticeSubjects();

    return (
        <motion.div
            className="lg:col-span-2 space-y-6"
            variants={itemVariants}
            initial="initial"
            animate="animate"
        >
            <motion.div className="relative overflow-hidden rounded-2xl backdrop-blur-xl backdrop-saturate-150">
                <div className="relative overflow-x-auto no-scrollbar">
                    <div className="flex gap-3 px-1 pb-1">
                        {subjectStats?.map((subject, index) => {
                            const progress = Number(subject.progress) || 0;
                            const accuracy = Number(subject.accuracy) || 0;

                            const subjectMeta = subjects.find((s) => s.slug === subject.subject);

                            const SubjectIcon = SubjectIconMap[
                                subjectMeta?.icon_name || 'default'
                            ] as React.ElementType;

                            const questionCount =
                                subject.totalAvailable || subjectMeta?.question_count;

                            const bgClass = getBackgroundColor(subjectMeta?.theme_color as string);

                            return (
                                <motion.div
                                    key={index}
                                    transition={{
                                        type: 'spring',
                                        stiffness: 300,
                                        damping: 25,
                                    }}
                                    className="min-w-[240px] rounded-2xl border border-white/20 bg-white/20 p-4 backdrop-blur-xl shadow-[0_6px_20px_rgba(0,0,0,0.06)] dark:border-white/10 dark:bg-white/[0.05]"
                                >
                                    <div className="mb-3 flex items-center gap-3">
                                        <div
                                            className={`flex h-10 w-10 items-center justify-center rounded-xl ${bgClass}`}
                                        >
                                            <SubjectIcon className="h-5 w-5 text-white" />
                                        </div>

                                        <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">
                                            {subject.subjectName}
                                        </h3>
                                    </div>

                                    <div className="space-y-3">
                                        <div>
                                            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                                                <span>Progress</span>
                                                <span>{progress}%</span>
                                            </div>

                                            <div className="h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                                                <div
                                                    className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600"
                                                    style={{
                                                        width: `${progress}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                                                <span>Accuracy</span>
                                                <span>{accuracy}%</span>
                                            </div>

                                            <div className="h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                                                <div
                                                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                                                    style={{
                                                        width: `${accuracy}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-3 border-t border-white/10 pt-2 text-xs text-muted-foreground">
                                        <p>
                                            Attempted:{' '}
                                            <strong className="text-foreground">
                                                {subject.attempted}
                                            </strong>
                                        </p>

                                        <p>
                                            Total Questions:{' '}
                                            <strong className="text-foreground">
                                                {questionCount}
                                            </strong>
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default SubjectStats;
