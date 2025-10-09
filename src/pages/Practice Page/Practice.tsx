import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import subjects from '../../data/subjects.ts';
import { getBackgroundColor } from '../../helper.ts';
import { useNavigate } from 'react-router-dom';
import Buttons from '../../components/Buttons.tsx';
import {
    containerVariants,
    fadeInUp,
    navItemVariants,
    stagger,
} from '../../utils/motionVariants.ts';
import type { SubjectStat } from '../../types/Stats.ts';

type FilterTabsType = {
    label: string;
    type: string;
    activeFilter: string;
    setActiveFilter: React.Dispatch<React.SetStateAction<string>>;
    reference: (el: HTMLButtonElement | null) => void;
};

const FilterTabs = ({ label, type, activeFilter, setActiveFilter, reference }: FilterTabsType) => {
    return (
        <button
            className={`px-4 py-2 whitespace-nowrap cursor-pointer transition-all duration-300 rounded-lg text-sm font-medium focus:outline-none active:scale-95
                ${
                    activeFilter === type
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'border border-border-primary dark:border-border-primary-dark hover:bg-blue-500 hover:text-white'
                }
            `}
            onClick={() => setActiveFilter(type)}
            ref={reference}
        >
            {label}
        </button>
    );
};

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
            type: 'all',
        },
        {
            label: 'Core CS',
            type: 'core',
        },
        {
            label: 'Mathematics',
            type: 'math',
        },
        {
            label: 'Aptitude',
            type: 'aptitude',
        },
        {
            label: 'Bookmarked Questions',
            type: 'bookmarked',
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
        <div className="flex flex-col h-[100dvh] bg-primary dark:bg-primary-dark text-text-primary dark:text-text-primary-dark">
            <div className="p-6 shrink-0">
                <div className="max-w-6xl">
                    {/* Header */}
                    <motion.div
                        variants={containerVariants}
                        initial="initial"
                        animate="animate"
                        className="mb-6"
                    >
                        <h1 className="text-3xl font-bold ">
                            Practice by{' '}
                            <span
                                className="
                            bg-gradient-to-br from-blue-400 to-blue-600 bg-clip-text text-transparent"
                            >
                                Subject
                            </span>
                        </h1>
                        <p>Select a subject to start practicing</p>
                    </motion.div>

                    {/* Filter Tabs */}
                    <div className="">
                        <motion.div
                            variants={navItemVariants}
                            initial="initial"
                            animate="animate"
                            className="flex overflow-x-scroll gap-2"
                        >
                            {filterTabs.map((tab) => {
                                return (
                                    <FilterTabs
                                        key={tab.type}
                                        label={tab.label}
                                        type={tab.type}
                                        activeFilter={activeFilter}
                                        setActiveFilter={setActiveFilter}
                                        reference={(el: HTMLButtonElement | null) => {
                                            if (el) filterRefs.current[tab.type] = el;
                                        }}
                                    />
                                );
                            })}
                        </motion.div>
                    </div>
                </div>
            </div>
            <motion.div
                initial="initial"
                animate="animate"
                variants={stagger}
                viewport={{ once: true, amount: 0.2 }}
                className="flex-1 overflow-y-auto px-6 rounded-xl mb-[env(safe-area-inset-bottom)]"
            >
                {/* Subject Grid - Simplified */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-40">
                    {filteredSubjects.map((subject) => {
                        const stat = subjectStats.find((s) => s.subject === subject.apiName);
                        const progress = stat ? stat.progress : 0;

                        return (
                            <motion.div
                                variants={fadeInUp}
                                key={subject.id}
                                className="flex flex-col justify-between h-full rounded-lg shadow-sm border border-border-primary dark:border-border-primary-dark overflow-hidden hover:shadow-md transition-shadow"
                            >
                                <div
                                    onClick={() => handleSubjectSelect(subject.id)}
                                    className="p-4"
                                >
                                    <div className="flex items-start gap-2 mb-4">
                                        <div
                                            className={`p-3 rounded-lg shadow-sm ${getBackgroundColor(subject.color)} mr-3`}
                                        >
                                            {<subject.icon className="h-6 w-6" />}
                                        </div>
                                        <div className="w-full">
                                            <div className="flex justify-between items-center w-full">
                                                <h3 className="font-medium">{subject.name}</h3>
                                                <h3
                                                    className={`font-medium text-xs px-2 py-0.5 rounded-full text-white ${
                                                        subject.difficulty === 'Easy'
                                                            ? 'bg-green-500'
                                                            : subject.difficulty === 'Medium'
                                                              ? 'bg-yellow-500'
                                                              : 'bg-red-500'
                                                    }`}
                                                >
                                                    {subject.difficulty}
                                                </h3>
                                            </div>
                                            {/* ✅ Animated Progress Bar */}
                                            <div className="mt-2">
                                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className="h-full transition-all duration-700 ease-out rounded-full"
                                                        style={{
                                                            width: `${progress}%`,
                                                            background: `linear-gradient(
                                                      90deg,
                                                      ${progress < 30 ? '#ef4444' : progress < 70 ? '#facc15' : '#22c55e'},
                                                      ${progress < 30 ? '#f87171' : progress < 70 ? '#fde047' : '#4ade80'}
                                                    )`,
                                                        }}
                                                    ></div>
                                                </div>

                                                <h4 className="text-xs text-gray-500 mt-1">
                                                    Progress: {progress.toFixed(0)}% | Total
                                                    Questions: {subject.questions}
                                                </h4>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <Buttons
                                        children="Practice"
                                        active={true}
                                        className="w-full"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleSubjectSelect(subject.id);
                                        }}
                                    />
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </motion.div>
        </div>
    );
};

export default Practice;
