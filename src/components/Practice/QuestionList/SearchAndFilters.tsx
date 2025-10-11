import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CaretDown, Funnel, MagnifyingGlass } from '@phosphor-icons/react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../Dropdown.tsx';

type SearchAndFiltersProps = {
    searchQuery: string;
    setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
    showFilters: boolean;
    setShowFilters: React.Dispatch<React.SetStateAction<boolean>>;
    difficultyFilter: string;
    setDifficultyFilter: React.Dispatch<React.SetStateAction<string>>;
    yearFilter: string;
    setYearFilter: React.Dispatch<React.SetStateAction<string>>;
    topicFilter: string;
    setTopicFilter: React.Dispatch<React.SetStateAction<string>>;
    attemptFilter: string;
    setAttemptFilter: React.Dispatch<React.SetStateAction<string>>;
    years: number[];
    topics: (string | undefined)[];
};

const SearchAndFilters = ({
    searchQuery,
    setSearchQuery,
    showFilters,
    setShowFilters,
    difficultyFilter,
    setDifficultyFilter,
    yearFilter,
    setYearFilter,
    topicFilter,
    setTopicFilter,
    attemptFilter,
    setAttemptFilter,
    years,
    topics,
}: SearchAndFiltersProps) => {
    return (
        <div className="rounded-xl p-2 sm:p-4 mb-4 sm:mb-6 border border-border-primary dark:border-border-primary-dark">
            <div className="flex flex-col md:flex-row gap-2 sm:gap-4">
                <div className="flex-1 relative">
                    <MagnifyingGlass className="absolute left-3 top-3 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search questions..."
                        className="w-full pl-10 pr-2 sm:pr-4 py-2 border border-border-primary dark:border-border-primary-dark rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center px-2 sm:px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer w-full md:w-auto"
                >
                    <Funnel className="mr-2" weight={`${showFilters ? 'fill' : 'duotone'}`} />
                    <span>Filter</span>
                    <CaretDown
                        className={`ml-2 transition-transform ${showFilters ? 'transform rotate-180 duration-500' : 'duration-500'}`}
                    />
                </button>
            </div>

            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-2 sm:mt-4 pt-2 sm:pt-4 border-t border-gray-100 dark:border-zinc-700 overflow-hidden overflow-y-scroll"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4">
                            <div>
                                <label className="block font-medium mb-2">Difficulty</label>

                                <Select
                                    onValueChange={(value) => setDifficultyFilter(value)}
                                    value={difficultyFilter}
                                >
                                    <SelectTrigger
                                        className="w-full p-2 border border-gray-200 dark:border-zinc-800 rounded-lg"
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            {
                                                [
                                                    { label: "All Difficulties", value: "all" },
                                                    { label: "Easy", value: "Easy" },
                                                    { label: "Medium", value: "Medium" },
                                                    { label: "Hard", value: "Hard" },
                                                ].map((option, index) => (
                                                    <SelectItem
                                                        key={index}
                                                        value={option.value}
                                                    >{option.label}</SelectItem>
                                                ))
                                            }
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>

                            </div>

                            <div>
                                <label className="block font-medium mb-2">Year</label>

                                <Select
                                    onValueChange={(value) => setYearFilter(value)}
                                    value={yearFilter}
                                >
                                    <SelectTrigger
                                        className="w-full p-2 border border-gray-200 dark:border-zinc-800 rounded-lg"
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectItem
                                                value={"all"}
                                            >All Years</SelectItem>

                                            {
                                                years.map((year) => (
                                                    <SelectItem
                                                        key={year}
                                                        value={year.toString()}
                                                    >{year}</SelectItem>
                                                ))
                                            }
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>

                            </div>

                            <div>
                                <label className="block font-medium mb-2">Topic</label>

                                <Select
                                    onValueChange={(value) => setTopicFilter(value)}
                                    value={topicFilter}
                                >
                                    <SelectTrigger
                                        className="w-full p-2 border border-gray-200 dark:border-zinc-800 rounded-lg"
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectItem
                                                value={"all"}
                                            >All Topics</SelectItem>

                                            {
                                                topics.map((topic) => (
                                                    <SelectItem
                                                        key={topic}
                                                        value={topic || ""}
                                                    >{topic}</SelectItem>
                                                ))
                                            }
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>

                            </div>

                            <div>
                                <label className="block font-medium mb-2">Attempts</label>

                                <Select
                                    onValueChange={(value) => setAttemptFilter(value)}
                                    value={attemptFilter}
                                >
                                    <SelectTrigger
                                        className="w-full p-2 border border-gray-200 dark:border-zinc-800 rounded-lg"
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>

                                            {
                                                [
                                                    {label: "All", value: "all"},
                                                    {label: "Attempted Questions", value: "attempted"},
                                                    {label: "Unattempted Questions", value: "unattempted"},
                                                ].map((attempt) => (
                                                    <SelectItem
                                                        key={attempt.value}
                                                        value={attempt.value}
                                                    >{attempt.label}</SelectItem>
                                                ))
                                            }
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>

                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SearchAndFilters;
