import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { getBackgroundColor, getUserProfile, SubjectIconMap } from '../../helper.ts';
import { useNavigate } from 'react-router-dom';
import { fadeInUp, stagger } from '../../utils/motionVariants.ts';
import type { SubjectStat } from '../../types/Stats.ts';
import { Button } from '@/components/ui/button.tsx';
import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Progress } from '@/components/ui/progress.tsx';
import PageHeader from '@/components/ui/PageHeader.tsx';
import AnimatedTabs from '@/components/ui/AnimatedTabs.tsx';
import { useGoals } from '@/hooks/useGoals.ts';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const Practice = () => {
    const navigate = useNavigate();
    const [activeFilter, setActiveFilter] = useState('all');
    const [subjectStats, setSubjectStats] = useState<SubjectStat[]>([]);

    // User profile
    const user = getUserProfile();

    // get the subjects of the branch and exams selected by the user
    const { userGoal, getPracticeSubjects, loading } = useGoals();
    const [showGoalAlert, setShowGoalAlert] = useState(user === null ? true : false);

    let subjects = getPracticeSubjects();

    useEffect(() => {
        if (!loading && subjects.length === 0) {
            setShowGoalAlert(true);
        }
    }, [loading, subjects]);

    // Tab Reference
    const filterRefs = useRef<Record<string, HTMLButtonElement>>({});

    // This brings the active tab in view
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

    // Filter Tabs
    const filterTabs = [
        {
            label: 'All Subjects',
            id: 'all',
        },
        {
            label: `Core ${userGoal?.branch_id.toUpperCase()}`,
            id: 'core',
        },
        {
            label: 'Mathematics',
            id: 'math',
        },
        {
            label: 'Aptitude',
            id: 'aptitude',
        },
        {
            label: 'Bookmarked Questions',
            id: 'bookmarked',
        },
    ];

    // Getting stats on mount of this component
    useEffect(() => {
        const storedStats = localStorage.getItem('subjectStats');
        if (storedStats) {
            setSubjectStats(JSON.parse(storedStats));
        }
    }, []);

    // Filter subjects based on active filter
    const filteredSubjects = subjects.filter((subject) => {
        if (activeFilter === 'all' || activeFilter === 'bookmarked') return true;
        return subject.category === activeFilter;
    });

    // Handle subject selection
    const handleSubjectSelect = (slug: string) => {
        const isBookmarked = activeFilter === 'bookmarked';
        navigate(`${slug}?bookmarked=${isBookmarked}`);
    };

    return (
        <div className="flex flex-col">
            <AlertDialog open={showGoalAlert} onOpenChange={setShowGoalAlert}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Set your goal first.</AlertDialogTitle>
                        <AlertDialogDescription>
                            {user === null
                                ? 'You need to login first.'
                                : 'You need to have a goal that is branch and exam you are targetting to view the relevant subjects in the Account Settings page.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        {user === null ? (
                            <AlertDialogAction onClick={() => navigate('/dashboard')}>
                                Go to the Dashboard Page to login first.
                            </AlertDialogAction>
                        ) : (
                            <AlertDialogAction onClick={() => navigate('/settings/account')}>
                                Go To Account Settings Page
                            </AlertDialogAction>
                        )}
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="p-6 shrink-0">
                <div className="max-w-6xl">
                    {/* Header */}
                    <PageHeader
                        primaryTitle={activeFilter === 'bookmarked' ? 'Your' : 'Practice by'}
                        secondaryTitle={activeFilter === 'bookmarked' ? 'Bookmarks' : 'Subject'}
                        caption={
                            activeFilter === 'bookmarked'
                                ? 'Select a subject to view your saved questions.'
                                : 'Select a subject and start practicing.'
                        }
                    />

                    {/* Filter Tabs */}
                    <AnimatedTabs
                        tabs={filterTabs}
                        activeTab={activeFilter}
                        onChange={setActiveFilter}
                    />
                </div>
            </div>
            <motion.div
                initial="initial"
                animate="animate"
                variants={stagger}
                viewport={{ once: true, amount: 0.2 }}
                className="flex-1 px-6"
            >
                {/* Subject Grid - Simplified */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-40">
                    {filteredSubjects.map((subject) => {
                        const stat = subjectStats.find((s) => s.subject === subject.slug);
                        const progress = stat ? stat.progress : 0;
                        const SubjectIcon = SubjectIconMap[
                            subject.icon_name || 'default'
                        ] as React.ElementType;

                        return (
                            <motion.div variants={fadeInUp} key={subject.id}>
                                <Card className="rounded-md flex flex-col h-full">
                                    <CardHeader className="flex items-start rounded-md">
                                        <div
                                            className={`p-3 shadow-sm ${getBackgroundColor(subject.theme_color)} mr-3`}
                                        >
                                            <SubjectIcon className="h-6 w-6" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center w-full">
                                                <CardTitle className="font-medium">
                                                    {subject.name}
                                                </CardTitle>
                                                <Badge
                                                    variant="secondary"
                                                    className={`text-[10px] font-bold ${subject.difficulty === 'Easy' ? 'bg-green-100 text-green-800' : subject.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}
                                                >
                                                    {subject.difficulty}
                                                </Badge>
                                            </div>

                                            <div className="mt-2">
                                                <Progress
                                                    value={progress}
                                                    className="h-2 rounded-sm"
                                                />

                                                <h4 className="text-xs text-gray-500 mt-1">
                                                    Progress: {progress.toFixed(0)}%
                                                </h4>
                                            </div>
                                        </div>
                                    </CardHeader>

                                    <CardFooter
                                        className="mt-auto"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleSubjectSelect(subject.slug);
                                        }}
                                    >
                                        <Button className="w-full text-xs group">
                                            {activeFilter === 'bookmarked'
                                                ? 'View Bookmarks'
                                                : 'Start Practice'}
                                            <span className="ml-2 group-hover:translate-x-1 transition-transform">
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
    );
};

export default Practice;
