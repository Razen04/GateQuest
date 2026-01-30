import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CaretDown, Funnel, MagnifyingGlass } from '@phosphor-icons/react';

import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '../ui/select';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

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
    years: string[];
    topics: string[];
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
        <div className="p-2 sm:p-4 mb-4 sm:mb-6 border border-border-primary dark:border-border-primary-dark">
            <div className="flex flex-col md:flex-row gap-2 sm:gap-4">
                <div className="flex-1 relative">
                    <MagnifyingGlass className="absolute left-3 top-2.5 text-gray-400" />
                    <Input
                        type="text"
                        placeholder="Search questions..."
                        className="w-full pl-10 rounded-md pr-2 sm:pr-4 py-2 border border-border-primary dark:border-border-primary-dark focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <Button
                    variant="ghost"
                    onClick={() => setShowFilters(!showFilters)}
                    className="px-2 sm:px-4 py-2 w-fit"
                >
                    <Funnel className="mr-2" weight={`${showFilters ? 'fill' : 'duotone'}`} />
                    <span>Filter</span>
                    <CaretDown
                        className={`ml-2 transition-transform ${showFilters ? 'transform rotate-180 duration-500' : 'duration-500'}`}
                    />
                </Button>
            </div>

            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-2 sm:mt-4 pt-2 sm:pt-4 border-t border-gray-100 dark:border-zinc-700 overflow-hidden overflow-y-scroll"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div>
                                <Label className="mb-2">Difficulty</Label>
                                <Select
                                    value={difficultyFilter}
                                    onValueChange={(e) => setDifficultyFilter(e)}
                                >
                                    <SelectTrigger className="w-full rounded-md">
                                        <SelectValue placeholder="Select a difficulty" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectLabel>Difficulties</SelectLabel>
                                            <SelectItem value="all">All</SelectItem>
                                            <SelectItem value="Easy">Easy</SelectItem>
                                            <SelectItem value="Medium">Medium</SelectItem>
                                            <SelectItem value="Hard">Hard</SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label className="mb-2">Years</Label>
                                <Select value={yearFilter} onValueChange={(e) => setYearFilter(e)}>
                                    <SelectTrigger className="w-full rounded-md">
                                        <SelectValue placeholder="Select a year" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectLabel>Years</SelectLabel>
                                            <SelectItem value="all">All</SelectItem>
                                            {years.map((year) => (
                                                <SelectItem key={year} value={year}>
                                                    {year}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label className="mb-2">Topics</Label>
                                <Select
                                    value={topicFilter}
                                    onValueChange={(e) => setTopicFilter(e)}
                                >
                                    <SelectTrigger className="w-full rounded-md">
                                        <SelectValue placeholder="Select a topic" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectLabel>Topics</SelectLabel>
                                            <SelectItem value="all">All</SelectItem>
                                            {topics.map((topic) => (
                                                <SelectItem key={topic} value={topic}>
                                                    {topic}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label className="mb-2">Type of questions</Label>
                                <Select
                                    value={attemptFilter}
                                    onValueChange={(e) => setAttemptFilter(e)}
                                >
                                    <SelectTrigger className="w-full rounded-md">
                                        <SelectValue placeholder="Select a type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectLabel>Type of question</SelectLabel>
                                            <SelectItem value="all">All</SelectItem>
                                            <SelectItem value="attempted">
                                                Attempted Questions
                                            </SelectItem>
                                            <SelectItem value="unattempted">
                                                Unattempted Questions
                                            </SelectItem>
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
