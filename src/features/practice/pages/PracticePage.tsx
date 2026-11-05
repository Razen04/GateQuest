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
        <div className="flex min-w-0 flex-col gap-1.5 font-['Manrope']">
            <div className="flex items-baseline justify-between gap-1 font-mono text-[10px] tabular-nums">
                <span className="text-[11px] font-bold text-card-foreground">
                    {progress}%
                </span>
                <span className="truncate text-muted-foreground">
                    {attempted}/{total}
                </span>
            </div>

            <Progress value={progress} className="h-1 w-full rounded-none" />

            <div className="flex items-baseline justify-between gap-1 font-mono text-[9px]">
                <span className="font-bold uppercase tracking-wider text-muted-foreground">
                    {exam}
                </span>
                <span className="tabular-nums text-muted-foreground">
                    {accuracy}% accuracy
                </span>
            </div>
        </div>
    );
};

const difficultyStyles: Record<string, string> = {
    Easy: 'border-chart-2/30 bg-chart-2/10 text-chart-2',
    Medium: 'border-chart-4/30 bg-chart-4/10 text-chart-4',
    Hard: 'border-destructive/30 bg-destructive/10 text-destructive',
};

const Practice = () => {
    const navigate = useNavigate();
    const [activeFilter, setActiveFilter] = useState('all');

    const user = useAuthStore((s) => s.user);

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

    const filterRefs = useRef<Record<string, HTMLButtonElement>>({});

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

    const filteredSubjects = subjects.filter((subject) => {
        if (activeFilter === 'all') return true;
        return subject.category === activeFilter;
    });

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
                (
                    row
                ): row is {
                    exam: string;
                    stat: SubjectStat;
                } => row.stat !== undefined
            );

    return (
        <div className="relative flex min-h-dvh select-none flex-col bg-background text-foreground font-['Manrope']">
            {/* Goal Modal */}
            <AlertDialog open={showGoalAlert} onOpenChange={setShowGoalAlert}>
                <AlertDialogContent className="rounded-none border border-border bg-popover text-popover-foreground shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="font-['Sora']">
                            Set your goal first.
                        </AlertDialogTitle>

                        <AlertDialogDescription className="text-muted-foreground">
                            {user === null
                                ? 'You need to login first.'
                                : 'You need to select a branch and target exam to view relevant subjects for your practice session.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-none border-border bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground">
                            Cancel
                        </AlertDialogCancel>

                        {user === null ? (
                            <AlertDialogAction
                                onClick={() => navigate('/dashboard')}
                                className="rounded-none bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                                Go to Dashboard
                            </AlertDialogAction>
                        ) : (
                            <AlertDialogAction
                                onClick={() => navigate('/settings/account')}
                                className="rounded-none bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                                Account Settings
                            </AlertDialogAction>
                        )}
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Main Content */}
            <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 pb-24 pt-6 sm:px-8">
                {/* Header */}
                <PageHeader
                    primaryTitle="Practice by"
                    secondaryTitle="Subject"
                    caption="Select a subject and start practicing."
                />

                {/* Filter Tabs */}
                <div className="top-14">
                    <AnimatedTabs
                        tabs={filterTabs}
                        activeTab={activeFilter}
                        onChange={setActiveFilter}
                    />
                </div>

                {/* Subject Grid */}
                <motion.div
                    initial="initial"
                    animate="animate"
                    variants={stagger}
                    viewport={{ once: true, amount: 0.2 }}
                    className="mt-4 flex-1"
                >
                    <div className="grid grid-cols-1 gap-4 pb-16 md:grid-cols-2 lg:grid-cols-3">
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
                                    <Card className="relative flex h-full flex-col overflow-hidden rounded-none border border-border bg-card/70 py-0 text-card-foreground shadow-sm backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                                        <CardHeader className="relative flex flex-row items-start space-x-3 p-5">
                                            <div
                                                className={`shrink-0 border border-border p-3 ${getBackgroundColor(
                                                    subject.theme_color
                                                )}`}
                                            >
                                                {SubjectIcon && (
                                                    <SubjectIcon className="h-6 w-6" />
                                                )}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-start justify-between gap-2">
                                                    <CardTitle className="truncate font-['Sora'] text-base font-semibold leading-snug">
                                                        {subject.name}
                                                    </CardTitle>

                                                    <Badge
                                                        variant="secondary"
                                                        className={`shrink-0 rounded-none border px-2 py-0.5 text-[10px] font-semibold backdrop-blur-md ${
                                                            difficultyStyles[
                                                                subject
                                                                    .difficulty
                                                            ] ??
                                                            'border-border bg-muted text-muted-foreground'
                                                        }`}
                                                    >
                                                        {subject.difficulty}
                                                    </Badge>
                                                </div>

                                                {/* Exam Statistics */}
                                                <div
                                                    className="mt-4 grid md:grid-flow-col gap-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
                                                        <p className="font-mono text-[11px] text-muted-foreground">
                                                            Not started
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </CardHeader>

                                        {/* Card Footer */}
                                        <CardFooter
                                            className="mt-2 p-5 pt-0"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleSubjectSelect(
                                                    subject.slug
                                                );
                                            }}
                                        >
                                            <Button className="group w-full rounded-none bg-primary text-xs font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring">
                                                Start Practice
                                                <span className="ml-1.5 transition-transform group-hover:translate-x-1">
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
