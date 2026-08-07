import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CaretDown,
    Funnel,
    MagnifyingGlass,
    ArrowCounterClockwiseIcon,
} from '@phosphor-icons/react';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@/shared/components/ui/select';
import {
    Combobox,
    ComboboxChip,
    ComboboxChips,
    ComboboxChipsInput,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxItem,
    ComboboxList,
    ComboboxValue,
} from '@/shared/components/ui/combobox';
import { Label } from '@/shared/components/ui/label';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { useParams } from 'react-router-dom';
import { useGoals } from '@/shared/hooks/useGoals';

type SearchAndFiltersProps = {
    searchQuery: string;
    setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
    showFilters: boolean;
    setShowFilters: React.Dispatch<React.SetStateAction<boolean>>;
    difficultyFilter: string[];
    setDifficultyFilter: React.Dispatch<React.SetStateAction<string[]>>;
    yearFilter: string[];
    setYearFilter: React.Dispatch<React.SetStateAction<string[]>>;
    topicFilter: string[];
    setTopicFilter: React.Dispatch<React.SetStateAction<string[]>>;
    attemptFilter: string;
    setAttemptFilter: React.Dispatch<React.SetStateAction<string>>;
    years: string[];
    topics: string[];
    examFilter: string[];
    setExamFilter: React.Dispatch<React.SetStateAction<string[]>>;
    tags: string[];
    tagFilter: string[];
    setTagFilter: React.Dispatch<React.SetStateAction<string[]>>;
    availableExams: string[];
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
    examFilter,
    setExamFilter,
    tags,
    tagFilter,
    setTagFilter,
    availableExams,
}: SearchAndFiltersProps) => {
    const { subject } = useParams();
    const { getPracticeSubjects } = useGoals();

    const currentSubject = getPracticeSubjects().find(
        (s) => s.slug === subject
    );
    const displayExams = currentSubject?.is_universal
        ? ['GATE', 'ISRO']
        : availableExams;
    const difficulties = ['Easy', 'Medium', 'Hard'];

    const glass =
        'bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-lg shadow-black/5';

    const inputGlass =
        'bg-white/50 dark:bg-zinc-800/50 backdrop-blur-md border border-white/20 dark:border-white/10 focus:ring-2 focus:ring-blue-400 transition-all';

    const hasActiveFilters =
        searchQuery.trim() !== '' ||
        difficultyFilter.length > 0 ||
        yearFilter.length > 0 ||
        topicFilter.length > 0 ||
        examFilter.length > 0 ||
        tagFilter.length > 0 ||
        attemptFilter !== 'unattempted';

    // Reset all filter states back to default
    const handleClearFilters = () => {
        setSearchQuery('');
        setDifficultyFilter([]);
        setYearFilter([]);
        setTopicFilter([]);
        setExamFilter([]);
        setTagFilter([]);
        setAttemptFilter('unattempted');
    };

    return (
        <div className={`p-2 sm:p-4 mb-4 sm:mb-6 ${glass}`}>
            <div className="flex flex-col md:flex-row gap-2 sm:gap-4">
                <div className="flex-1 relative">
                    <MagnifyingGlass className="absolute left-3 top-2.5 text-gray-400" />

                    <Input
                        type="text"
                        placeholder="Search questions..."
                        className={`w-full pl-10 pr-2 sm:pr-4 py-2 rounded-none ${inputGlass}`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        onClick={() => setShowFilters(!showFilters)}
                        className="px-2 sm:px-4 py-2 w-fit hover:bg-white/30 dark:hover:bg-zinc-800/50 rounded-none relative"
                    >
                        <Funnel
                            className="mr-2"
                            weight={showFilters ? 'fill' : 'duotone'}
                        />
                        <span>Filter</span>
                        {hasActiveFilters && (
                            <span className="ml-1.5 flex h-2 w-2 rounded-full bg-blue-500" />
                        )}
                        <CaretDown
                            className={`ml-2 transition-transform duration-500 ${
                                showFilters ? 'rotate-180' : ''
                            }`}
                        />
                    </Button>
                </div>
            </div>

            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-4 pt-4 border-t border-white/20 dark:border-white/10 overflow-hidden"
                    >
                        <div className="flex items-center justify-between mb-3 px-1">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Active Filters
                            </span>

                            {hasActiveFilters && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleClearFilters}
                                    className="h-7 px-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-none flex items-center gap-1 transition-colors"
                                >
                                    <ArrowCounterClockwiseIcon size={14} />
                                    Clear All
                                </Button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {[
                                {
                                    label: 'Exams',
                                    items: displayExams,
                                    value: examFilter,
                                    setter: setExamFilter,
                                    placeholder: 'Select exams',
                                    render: (v: string) => v.toUpperCase(),
                                },
                                {
                                    label: 'Difficulty',
                                    items: difficulties,
                                    value: difficultyFilter,
                                    setter: setDifficultyFilter,
                                    placeholder: 'Select difficulties',
                                    render: (v: string) => v,
                                },
                                {
                                    label: 'Years',
                                    items: years,
                                    value: yearFilter,
                                    setter: setYearFilter,
                                    placeholder: 'Select years',
                                    render: (v: string) => v,
                                },
                                {
                                    label: 'Topics',
                                    items: topics,
                                    value: topicFilter,
                                    setter: setTopicFilter,
                                    placeholder: 'Select topics',
                                    render: (v: string) => v,
                                },
                                {
                                    label: 'Tags',
                                    items: tags,
                                    value: tagFilter,
                                    setter: setTagFilter,
                                    placeholder: 'Select tags',
                                    render: (v: string) => v,
                                },
                            ].map((filter) => (
                                <div
                                    key={filter.label}
                                    className={`${glass} p-3`}
                                >
                                    <Label className="mb-2">
                                        {filter.label}
                                    </Label>

                                    <Combobox
                                        items={filter.items}
                                        multiple
                                        value={filter.value}
                                        onValueChange={filter.setter}
                                    >
                                        <ComboboxChips className="rounded-none">
                                            <ComboboxValue>
                                                {filter.value.map((item) => (
                                                    <ComboboxChip
                                                        key={item}
                                                        showRemove
                                                        className="max-w-[150px] truncate rounded-none"
                                                    >
                                                        {filter.render(item)}
                                                    </ComboboxChip>
                                                ))}
                                            </ComboboxValue>

                                            <ComboboxChipsInput
                                                placeholder={filter.placeholder}
                                                className="rounded-none"
                                            />
                                        </ComboboxChips>

                                        <ComboboxContent className="backdrop-blur-xl bg-white/80 dark:bg-zinc-900/80 rounded-none border border-white/20">
                                            <ComboboxEmpty>
                                                No {filter.label.toLowerCase()}{' '}
                                                found.
                                            </ComboboxEmpty>

                                            <ComboboxList className="rounded-none">
                                                {(item) => (
                                                    <ComboboxItem
                                                        key={item}
                                                        value={item}
                                                        className="rounded-none"
                                                    >
                                                        {filter.render(item)}
                                                    </ComboboxItem>
                                                )}
                                            </ComboboxList>
                                        </ComboboxContent>
                                    </Combobox>
                                </div>
                            ))}

                            <div className={`${glass} p-3 rounded-none`}>
                                <Label className="mb-2">
                                    Type of questions
                                </Label>

                                <Select
                                    value={attemptFilter}
                                    onValueChange={setAttemptFilter}
                                >
                                    <SelectTrigger
                                        className={`${inputGlass} w-full rounded-none`}
                                    >
                                        <SelectValue
                                            placeholder="Select a type"
                                            className="rounded-none"
                                        />
                                    </SelectTrigger>

                                    <SelectContent className="backdrop-blur-xl bg-white/80 dark:bg-zinc-900/80 border border-white/20 rounded-none">
                                        <SelectGroup>
                                            <SelectLabel>
                                                Type of question
                                            </SelectLabel>

                                            <SelectItem
                                                value="all"
                                                className="rounded-none"
                                            >
                                                All
                                            </SelectItem>

                                            <SelectItem
                                                value="attempted"
                                                className="rounded-none"
                                            >
                                                Attempted Questions
                                            </SelectItem>

                                            <SelectItem
                                                value="unattempted"
                                                className="rounded-none"
                                            >
                                                Unattempted Questions
                                            </SelectItem>

                                            <SelectItem
                                                value="bookmarked"
                                                className="rounded-none"
                                            >
                                                Bookmarked Questions
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
