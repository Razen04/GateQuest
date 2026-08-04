import { motion } from 'framer-motion';
import type React from 'react';
import { useGoals } from '@/shared/hooks/useGoals';
import { getBackgroundColor, SubjectIconMap } from '@/shared/utils/helper.ts';
import { itemVariants } from '@/shared/utils/motionVariants.ts';

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
    const { getPracticeSubjects } = useGoals();
    const subjects = getPracticeSubjects();

    return (
        <motion.div
            className="lg:col-span-2 space-y-6"
            variants={itemVariants}
            initial="initial"
            animate="animate"
        >
            <motion.div className="relative overflow-hidden">
                <div className="relative overflow-x-auto no-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                        {subjectStats?.map((subject, index) => {
                            const progress = Number(subject.progress) || 0;
                            const accuracy = Number(subject.accuracy) || 0;

                            const subjectMeta = subjects.find(
                                (s) => s.slug === subject.subject_slug
                            );

                            const SubjectIcon = SubjectIconMap[
                                subjectMeta?.icon_name || 'default'
                            ] as React.ElementType;

                            const questionCount =
                                subject.total_available ||
                                subjectMeta?.question_count;

                            const bgClass = getBackgroundColor(
                                subjectMeta?.theme_color as string
                            );

                            return (
                                <motion.div
                                    key={index}
                                    transition={{
                                        type: 'spring',
                                        stiffness: 300,
                                        damping: 25,
                                    }}
                                    className="w-full border border-black/10 bg-white/40 backdrop-blue-2xl shadow-sm p-4 dark:border-white/10 dark:bg-white/[0.05]"
                                >
                                    <div className="mb-3 flex items-center gap-3">
                                        <div
                                            className={`flex h-10 w-10 items-center justify-center ${bgClass}`}
                                        >
                                            <SubjectIcon className="h-5 w-5 dark:text-white text-black" />
                                        </div>

                                        <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">
                                            {subject.subject_name}
                                        </h3>
                                    </div>

                                    <div className="space-y-3">
                                        <div>
                                            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                                                <span>Progress</span>
                                                <span>{progress}%</span>
                                            </div>

                                            <div className="h-2 overflow-hidden bg-black/10 dark:bg-white/10">
                                                <div
                                                    className="h-full bg-gradient-to-r from-blue-400 to-blue-600"
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

                                            <div className="h-2 overflow-hidden bg-black/10 dark:bg-white/10">
                                                <div
                                                    className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600"
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
