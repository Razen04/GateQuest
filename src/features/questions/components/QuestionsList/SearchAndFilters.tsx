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

    const currentSubject = getPracticeSubjects().find((s) => s.slug === subject);

    const displayExams = currentSubject?.is_universal ? ['GATE', 'ISRO'] : availableExams;

    const difficulties = ['Easy', 'Medium', 'Hard'];
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
                                <Label className="mb-2">Exams</Label>
                                <Combobox
                                    items={displayExams}
                                    multiple
                                    value={examFilter}
                                    onValueChange={setExamFilter}
                                >
                                    <ComboboxChips>
                                        <ComboboxValue>
                                            {examFilter.map((e) => (
                                                <ComboboxChip key={e} showRemove>
                                                    {e.toUpperCase()}
                                                </ComboboxChip>
                                            ))}
                                        </ComboboxValue>
                                        <ComboboxChipsInput placeholder="Select exams" />
                                    </ComboboxChips>
                                    <ComboboxContent>
                                        <ComboboxEmpty>No exams found.</ComboboxEmpty>
                                        <ComboboxList>
                                            {(exam) => (
                                                <ComboboxItem key={exam} value={exam}>
                                                    {exam.toUpperCase()}
                                                </ComboboxItem>
                                            )}
                                        </ComboboxList>
                                    </ComboboxContent>
                                </Combobox>
                            </div>

                            <div>
                                <Label className="mb-2">Difficulty</Label>
                                <Combobox
                                    items={difficulties}
                                    multiple
                                    value={difficultyFilter}
                                    onValueChange={setDifficultyFilter}
                                >
                                    <ComboboxChips>
                                        <ComboboxValue>
                                            {difficultyFilter.map((d) => (
                                                <ComboboxChip key={d} showRemove>
                                                    {d}
                                                </ComboboxChip>
                                            ))}
                                        </ComboboxValue>
                                        <ComboboxChipsInput placeholder="Select difficulties" />
                                    </ComboboxChips>
                                    <ComboboxContent>
                                        <ComboboxEmpty>No difficulties found.</ComboboxEmpty>
                                        <ComboboxList>
                                            {(diff) => (
                                                <ComboboxItem key={diff} value={diff}>
                                                    {diff}
                                                </ComboboxItem>
                                            )}
                                        </ComboboxList>
                                    </ComboboxContent>
                                </Combobox>
                            </div>

                            <div>
                                <Label className="mb-2">Years</Label>
                                <Combobox
                                    items={years}
                                    multiple
                                    value={yearFilter}
                                    onValueChange={setYearFilter}
                                >
                                    <ComboboxChips>
                                        <ComboboxValue>
                                            {yearFilter.map((y) => (
                                                <ComboboxChip key={y} showRemove>
                                                    {y}
                                                </ComboboxChip>
                                            ))}
                                        </ComboboxValue>
                                        <ComboboxChipsInput placeholder="Select years" />
                                    </ComboboxChips>
                                    <ComboboxContent>
                                        <ComboboxEmpty>No years found.</ComboboxEmpty>
                                        <ComboboxList>
                                            {(year) => (
                                                <ComboboxItem key={year} value={year}>
                                                    {year}
                                                </ComboboxItem>
                                            )}
                                        </ComboboxList>
                                    </ComboboxContent>
                                </Combobox>
                            </div>

                            <div>
                                <Label className="mb-2">Topics</Label>
                                <Combobox
                                    items={topics}
                                    multiple
                                    value={topicFilter}
                                    onValueChange={setTopicFilter}
                                >
                                    <ComboboxChips>
                                        <ComboboxValue>
                                            {topicFilter.map((t) => (
                                                <ComboboxChip
                                                    key={t}
                                                    showRemove
                                                    className="max-w-[150px] truncate"
                                                >
                                                    {t}
                                                </ComboboxChip>
                                            ))}
                                        </ComboboxValue>
                                        <ComboboxChipsInput placeholder="Select topics" />
                                    </ComboboxChips>
                                    <ComboboxContent>
                                        <ComboboxEmpty>No topics found.</ComboboxEmpty>
                                        <ComboboxList>
                                            {(topic) => (
                                                <ComboboxItem key={topic} value={topic}>
                                                    {topic}
                                                </ComboboxItem>
                                            )}
                                        </ComboboxList>
                                    </ComboboxContent>
                                </Combobox>
                            </div>

                            <div>
                                <Label className="mb-2">Tags</Label>
                                <Combobox
                                    items={tags}
                                    multiple
                                    value={tagFilter}
                                    onValueChange={setTagFilter}
                                >
                                    <ComboboxChips>
                                        <ComboboxValue>
                                            {tagFilter.map((t) => (
                                                <ComboboxChip
                                                    key={t}
                                                    showRemove
                                                    className="max-w-[150px] truncate"
                                                >
                                                    {t}
                                                </ComboboxChip>
                                            ))}
                                        </ComboboxValue>
                                        <ComboboxChipsInput placeholder="Select tags" />
                                    </ComboboxChips>
                                    <ComboboxContent>
                                        <ComboboxEmpty>No tag found.</ComboboxEmpty>
                                        <ComboboxList>
                                            {(tags) => (
                                                <ComboboxItem key={tags} value={tags}>
                                                    {tags}
                                                </ComboboxItem>
                                            )}
                                        </ComboboxList>
                                    </ComboboxContent>
                                </Combobox>
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
