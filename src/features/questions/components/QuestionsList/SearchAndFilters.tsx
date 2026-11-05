import {
    ArrowCounterClockwiseIcon,
    CaretDown,
    Funnel,
    MagnifyingGlass,
} from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'framer-motion';
import React from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
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
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@/shared/components/ui/select';
import useGoal from '@/shared/hooks/useGoal';

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
    branches: string[];
    branchFilter: string[];
    setBranchFilter: React.Dispatch<React.SetStateAction<string[]>>;
    showBranchFilter: boolean;
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
    branches,
    branchFilter,
    setBranchFilter,
    showBranchFilter,
}: SearchAndFiltersProps) => {
    const { subject } = useParams();
    const { getPracticeSubjects } = useGoal();

    const currentSubject = getPracticeSubjects().find(
        (s) => s.slug === subject
    );

    const displayExams = currentSubject?.is_universal
        ? ['GATE', 'ISRO']
        : availableExams;
    const difficulties = ['Easy', 'Medium', 'Hard'];

    const glass = 'border border-border bg-card/70 backdrop-blur-xl shadow-sm';

    const inputGlass =
        'border border-input bg-background/70 text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 transition-all';

    const hasActiveFilters =
        searchQuery.trim() !== '' ||
        difficultyFilter.length > 0 ||
        yearFilter.length > 0 ||
        topicFilter.length > 0 ||
        examFilter.length > 0 ||
        tagFilter.length > 0 ||
        branchFilter.length > 0 ||
        attemptFilter !== 'unattempted';

    const handleClearFilters = () => {
        setSearchQuery('');
        setDifficultyFilter([]);
        setYearFilter([]);
        setTopicFilter([]);
        setExamFilter([]);
        setTagFilter([]);
        setBranchFilter([]);
        setAttemptFilter('unattempted');
    };

    return (
        <div className={`mb-4 p-2 sm:mb-6 sm:p-4 ${glass}`}>
            {/* Search and Filter Toggle */}
            <div className="flex flex-col gap-2 sm:gap-4 md:flex-row">
                <div className="relative flex-1">
                    <MagnifyingGlass className="absolute left-3 top-2.5 text-muted-foreground" />

                    <Input
                        type="text"
                        placeholder="Search questions..."
                        className={`w-full rounded-none py-2 pl-10 pr-2 sm:pr-4 font-['Manrope'] ${inputGlass}`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        onClick={() => setShowFilters(!showFilters)}
                        className="relative w-fit rounded-none px-2 py-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground sm:px-4"
                    >
                        <Funnel
                            className="mr-2"
                            weight={showFilters ? 'fill' : 'duotone'}
                        />
                        <span>Filter</span>
                        {hasActiveFilters && (
                            <span className="ml-1.5 flex h-2 w-2 bg-primary" />
                        )}
                        <CaretDown
                            className={`ml-2 transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`}
                        />
                    </Button>
                </div>
            </div>

            {/* Expandable Filters */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-4 overflow-hidden border-t border-border pt-4"
                    >
                        <div className="mb-3 flex items-center justify-between px-1">
                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-['Sora']">
                                Active Filters
                            </span>

                            {hasActiveFilters && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleClearFilters}
                                    className="flex h-7 items-center gap-1 rounded-none px-2 text-xs text-destructive transition-colors hover:bg-destructive/10 hover:text-destructive"
                                >
                                    <ArrowCounterClockwiseIcon size={14} />
                                    Clear All
                                </Button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            {[
                                ...(showBranchFilter
                                    ? [
                                          {
                                              label: 'Branches',
                                              items: branches,
                                              value: branchFilter,
                                              setter: setBranchFilter,
                                              placeholder: 'Select branches',
                                              render: (v: string) =>
                                                  v.toUpperCase(),
                                          },
                                      ]
                                    : []),
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
                                    <Label className="mb-2 font-['Manrope'] text-sm font-semibold text-foreground">
                                        {filter.label}
                                    </Label>

                                    <Combobox
                                        items={filter.items}
                                        multiple
                                        value={filter.value}
                                        onValueChange={filter.setter}
                                    >
                                        <ComboboxChips className="rounded-none border-input bg-background/70">
                                            <ComboboxValue>
                                                {filter.value.map((item) => (
                                                    <ComboboxChip
                                                        key={item}
                                                        showRemove
                                                        className="max-w-[150px] truncate rounded-none border border-border bg-secondary text-secondary-foreground"
                                                    >
                                                        {filter.render(item)}
                                                    </ComboboxChip>
                                                ))}
                                            </ComboboxValue>

                                            <ComboboxChipsInput
                                                placeholder={filter.placeholder}
                                                className="rounded-none font-['Manrope'] text-foreground placeholder:text-muted-foreground"
                                            />
                                        </ComboboxChips>

                                        <ComboboxContent className="rounded-none border border-border bg-popover text-popover-foreground shadow-xl backdrop-blur-xl">
                                            <ComboboxEmpty className="text-muted-foreground">
                                                No {filter.label.toLowerCase()}{' '}
                                                found.
                                            </ComboboxEmpty>

                                            <ComboboxList className="rounded-none">
                                                {(item) => (
                                                    <ComboboxItem
                                                        key={item}
                                                        value={item}
                                                        className="rounded-none focus:bg-accent focus:text-accent-foreground"
                                                    >
                                                        {filter.render(item)}
                                                    </ComboboxItem>
                                                )}
                                            </ComboboxList>
                                        </ComboboxContent>
                                    </Combobox>
                                </div>
                            ))}

                            {/* Attempt Filter */}
                            <div className={`${glass} rounded-none p-3`}>
                                <Label className="mb-2 font-['Manrope'] text-sm font-semibold text-foreground">
                                    Type of questions
                                </Label>

                                <Select
                                    value={attemptFilter}
                                    onValueChange={setAttemptFilter}
                                >
                                    <SelectTrigger
                                        className={`${inputGlass} w-full rounded-none`}
                                    >
                                        <SelectValue placeholder="Select a type" />
                                    </SelectTrigger>

                                    <SelectContent className="rounded-none border border-border bg-popover text-popover-foreground shadow-xl backdrop-blur-xl">
                                        <SelectGroup>
                                            <SelectLabel className="text-muted-foreground">
                                                Type of question
                                            </SelectLabel>

                                            <SelectItem
                                                value="all"
                                                className="rounded-none focus:bg-accent focus:text-accent-foreground"
                                            >
                                                All
                                            </SelectItem>

                                            <SelectItem
                                                value="attempted"
                                                className="rounded-none focus:bg-accent focus:text-accent-foreground"
                                            >
                                                Attempted Questions
                                            </SelectItem>

                                            <SelectItem
                                                value="unattempted"
                                                className="rounded-none focus:bg-accent focus:text-accent-foreground"
                                            >
                                                Unattempted Questions
                                            </SelectItem>

                                            <SelectItem
                                                value="bookmarked"
                                                className="rounded-none focus:bg-accent focus:text-accent-foreground"
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
