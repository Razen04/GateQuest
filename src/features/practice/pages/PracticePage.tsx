import { motion } from 'framer-motion';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { useGoalStore } from '@/app/stores/useGoalStore';
import { useStatsStore } from '@/app/stores/useStatsStore';
import AnimatedTabs from '@/shared/components/AnimatedTabs';
import PageHeader from '@/shared/components/PageHeader';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import {
    Card,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/shared/components/ui/card';
import { Progress } from '@/shared/components/ui/progress';
import useGoal from '@/shared/hooks/useGoal';
import type { SubjectStat } from '@/shared/types/Stats';
import { getBackgroundColor, SubjectIconMap } from '@/shared/utils/helper';
import { fadeInUp, stagger } from '@/shared/utils/motionVariants';

const ExamStatTile = ({ exam, stat }: { exam: string; stat: SubjectStat }) => {
    const progress = stat.progress ?? 0;
    const accuracy = stat.accuracy ?? 0;
    const attempted = stat.attempted ?? 0;
    const total = stat.total_available ?? 0;

    return (
        <div className="flex flex-col gap-1.5 min-w-0">
            <div className="flex items-baseline justify-between gap-1 font-mono text-[10px] tabular-nums">
                <span className="font-bold text-[11px] text-slate-900 dark:text-white">
                    {progress}%
                </span>
                <span className="text-slate-400 dark:text-zinc-500 truncate">
                    {attempted}/{total}
                </span>
            </div>

            <Progress value={progress} className="h-1 w-full rounded-none" />

            <div className="flex items-baseline justify-between gap-1 font-mono text-[9px]">
                <span className="font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                    {exam}
                </span>
                <span className="text-slate-400 dark:text-zinc-500 tabular-nums">
                    {accuracy}% accuracy
                </span>
            </div>
        </div>
    );
};

const Practice = () => {
    const navigate = useNavigate();
    const [activeFilter, setActiveFilter] = useState('all');

    // User profile
    const user = useAuthStore((s) => s.user);
    // Get the subjects of the branch and exams selected by the user
    const userGoal = useGoalStore((s) => s.userGoal);
    const loading = useGoalStore((s) => s.loading);
    const { getPracticeSubjects } = useGoal();
    const [showGoalAlert, setShowGoalAlert] = useState(user === null);

    const subjects = getPracticeSubjects();
    const subjectStatsMap = useStatsStore((s) => s.stats.subjectStatsMap);

    const activeExams = (userGoal?.target_exams as string[] | undefined) ?? [];

    useEffect(() => {
        if (!loading && subjects.length === 0) {
            setShowGoalAlert(true);
        }
    }, [loading, subjects]);

    // Tab Reference
    const filterRefs = useRef<Record<string, HTMLButtonElement>>({});

    // Auto-scroll tab into view on overflow
    useEffect(() => {
        const activeEl = filterRefs.current[activeFilter];
        if (activeEl) {
            activeEl.scrollIntoView({
                behavior: 'smooth',
                inline: 'center',
                block: 'nearest',
            });
        }
    }, [activeFilter]);

    // Filter Tabs Configuration
    const filterTabs = [
        {
            label: 'All Subjects',
            id: 'all',
        },
        {
            label: `Core ${userGoal?.branch_id ? userGoal.branch_id.toUpperCase() : ''}`,
            id: 'core',
        },
        ...(userGoal?.branch_id !== 'xl'
            ? [
                  {
                      label: 'Mathematics',
                      id: 'math',
                  },
              ]
            : []),
        {
            label: 'Aptitude',
            id: 'aptitude',
        },
    ];

    // Filter subjects based on active tab
    const filteredSubjects = subjects.filter((subject) => {
        if (activeFilter === 'all') return true;
        return subject.category === activeFilter;
    });

    // Handle subject selection
    const handleSubjectSelect = (slug: string) => {
        navigate(`${slug}`);
    };

    const rowsForSubject = (slug: string) =>
        activeExams
            .map((exam) => ({
                exam,
                stat: (subjectStatsMap?.[exam.toUpperCase()] ?? []).find(
                    (s) => s.subject_slug === slug
                ),
            }))
            .filter(
                (row): row is { exam: string; stat: SubjectStat } =>
                    row.stat !== undefined
            );

    return (
        <div className="relative min-h-dvh flex flex-col select-none">
            {/* Goal Modal Alert */}
            <AlertDialog open={showGoalAlert} onOpenChange={setShowGoalAlert}>
                <AlertDialogContent className="rounded-none">
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Set your goal first.
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {user === null
                                ? 'You need to login first.'
                                : 'You need to select a branch and target exam to view relevant subjects for your practice session.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-none">
                            Cancel
                        </AlertDialogCancel>
                        {user === null ? (
                            <AlertDialogAction
                                onClick={() => navigate('/dashboard')}
                                className="rounded-none"
                            >
                                Go to Dashboard
                            </AlertDialogAction>
                        ) : (
                            <AlertDialogAction
                                onClick={() => navigate('/settings/account')}
                                className="rounded-none"
                            >
                                Account Settings
                            </AlertDialogAction>
                        )}
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Main Content Layout */}
            <div className="max-w-7xl mx-auto w-full px-4 sm:px-8 pt-6 pb-24 flex-1 flex flex-col">
                {/* HEADER */}
                <PageHeader
                    primaryTitle="Practice by"
                    secondaryTitle="Subject"
                    caption="Select a subject and start practicing."
                />

                {/* STICKY SUB-HEADER FILTER TABS */}
                <div className="top-14">
                    <AnimatedTabs
                        tabs={filterTabs}
                        activeTab={activeFilter}
                        onChange={setActiveFilter}
                    />
                </div>

                {/* SUBJECT GRID */}
                <motion.div
                    initial="initial"
                    animate="animate"
                    variants={stagger}
                    viewport={{ once: true, amount: 0.2 }}
                    className="flex-1 mt-4"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-16">
                        {filteredSubjects.map((subject) => {
                            const rows = rowsForSubject(subject.slug);

                            const SubjectIcon = SubjectIconMap[
                                subject.icon_name || 'default'
                            ] as React.ElementType;

                            return (
                                <motion.div
                                    variants={fadeInUp}
                                    key={subject.id}
                                >
                                    <Card className="rounded-none relative overflow-hidden flex flex-col h-full py-0 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl border border-slate-200/80 dark:border-zinc-800/80 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                                        <CardHeader className="relative flex flex-row items-start space-x-3 p-5">
                                            <div
                                                className={`p-3 border border-white/10 shrink-0 ${getBackgroundColor(
                                                    subject.theme_color
                                                )}`}
                                            >
                                                {SubjectIcon && (
                                                    <SubjectIcon className="h-6 w-6" />
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start gap-2">
                                                    <CardTitle className="font-semibold text-base leading-snug truncate">
                                                        {subject.name}
                                                    </CardTitle>
                                                    <Badge
                                                        variant="secondary"
                                                        className={`rounded-none shrink-0 px-2 py-0.5 text-[10px] font-medium border border-white/20 backdrop-blur-md ${
                                                            subject.difficulty ===
                                                            'Easy'
                                                                ? 'bg-green-500/15 text-green-700 dark:text-green-300'
                                                                : subject.difficulty ===
                                                                    'Medium'
                                                                  ? 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-300'
                                                                  : 'bg-red-500/15 text-red-700 dark:text-red-300'
                                                        }`}
                                                    >
                                                        {subject.difficulty}
                                                    </Badge>
                                                </div>

                                                {/* Per-exam stat rows */}
                                                <div
                                                    className="mt-4 grid grid-flow-col gap-3 overflow-x-auto no-scrollbar"
                                                    style={{
                                                        gridAutoColumns:
                                                            'minmax(120px, 1fr)',
                                                    }}
                                                >
                                                    {rows.length > 0 ? (
                                                        rows.map(
                                                            ({
                                                                exam,
                                                                stat,
                                                            }) => (
                                                                <ExamStatTile
                                                                    key={exam}
                                                                    exam={exam}
                                                                    stat={stat}
                                                                />
                                                            )
                                                        )
                                                    ) : (
                                                        <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-mono">
                                                            Not started
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </CardHeader>

                                        <CardFooter
                                            className="mt-2 p-5 pt-0"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleSubjectSelect(
                                                    subject.slug
                                                );
                                            }}
                                        >
                                            <Button className="w-full text-xs font-medium group rounded-none">
                                                Start Practice
                                                <span className="ml-1.5 group-hover:translate-x-1 transition-transform">
                                                    →
                                                </span>
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Practice;
