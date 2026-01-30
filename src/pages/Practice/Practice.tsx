import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import subjects from '../../data/subjects.ts';
import { getBackgroundColor } from '../../helper.ts';
import { useNavigate } from 'react-router-dom';
import { fadeInUp, stagger } from '../../utils/motionVariants.ts';
import type { SubjectStat } from '../../types/Stats.ts';
import { Button } from '@/components/ui/button.tsx';
import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Progress } from '@/components/ui/progress.tsx';
import PageHeader from '@/components/ui/PageHeader.tsx';
import AnimatedTabs from '@/components/ui/AnimatedTabs.tsx';

const Practice = () => {
    const navigate = useNavigate();
    const [activeFilter, setActiveFilter] = useState('all');
    const [subjectStats, setSubjectStats] = useState<SubjectStat[]>([]);

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
            label: 'Core CS',
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
    const filteredSubjects =
        activeFilter === 'all'
            ? subjects.filter((subject) => subject.category !== 'bookmarked')
            : subjects.filter((subject) => subject.category === activeFilter);

    // Handle subject selection
    const handleSubjectSelect = (subjectId: number) => {
        const subject = subjects.find((s) => s.id === subjectId);

        if (subject) {
            const isBookmarked = activeFilter === 'bookmarked';
            navigate(`${subject.apiName}?bookmarked=${isBookmarked}`);
        }
    };

    return (
        <div className="flex flex-col">
            <div className="p-6 shrink-0">
                <div className="max-w-6xl">
                    {/* Header */}
                    <PageHeader
                        primaryTitle="Practice by"
                        secondaryTitle="Subject"
                        caption="Select a subject and start practicing."
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
                        const stat = subjectStats.find((s) => s.subject === subject.apiName);
                        const progress = stat ? stat.progress : 0;

                        return (
                            <motion.div variants={fadeInUp} key={subject.id}>
                                <Card
                                    onClick={() => handleSubjectSelect(subject.id)}
                                    className="rounded-md flex flex-col h-full"
                                >
                                    <CardHeader className="flex items-start rounded-md">
                                        <div
                                            className={`p-3 shadow-sm ${getBackgroundColor(subject.color)} mr-3`}
                                        >
                                            {<subject.icon className="h-6 w-6" />}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center w-full">
                                                <CardTitle className="font-medium">
                                                    {subject.name}
                                                </CardTitle>
                                                <Badge
                                                    className={`rounded-sm ${
                                                        subject.difficulty === 'Easy'
                                                            ? 'bg-green-500 dark:text-white'
                                                            : subject.difficulty === 'Medium'
                                                              ? 'bg-yellow-500 dark:text-white'
                                                              : 'bg-red-500 dark:text-white'
                                                    }
                                                      `}
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
                                                    Progress: {progress.toFixed(0)}% | Total
                                                    Questions: {subject.questions}
                                                </h4>
                                            </div>
                                        </div>
                                    </CardHeader>

                                    <CardFooter className="mt-auto">
                                        <Button
                                            className="w-full"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleSubjectSelect(subject.id);
                                            }}
                                        >
                                            Practice
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
