import { useMemo } from 'react';
import { useGoalStore } from '@/app/stores/useGoalStore';
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
import { FormField } from './FormField';

type GoalSettingsProps = {
    branch: string;
    onBranchChange: (branch: string) => void;
    selectedExams: string[];
    onExamsChange: (exams: string[]) => void;
    additionalSubjects: string[];
    onAdditionalSubjectsChange: (subjects: string[]) => void;
    disabled: boolean;
};

export function GoalSettings({
    branch,
    onBranchChange,
    selectedExams,
    onExamsChange,
    additionalSubjects,
    onAdditionalSubjectsChange,
    disabled,
}: GoalSettingsProps) {
    const branches = useGoalStore((s) => s.branches);
    const allExams = useGoalStore((s) => s.exams);
    const branchExams = useGoalStore((s) => s.branchExams);
    const goalsLoading = useGoalStore((s) => s.loading);
    const { optionalSubjects } = useGoal();

    const availableExams = useMemo(() => {
        if (!branch) return [];
        const validExamIds = branchExams
            .filter((be) => be.branch_id === branch)
            .map((be) => be.exam_id);

        return allExams.filter((e) => validExamIds.includes(e.id));
    }, [branch, branchExams, allExams]);

    const isGateXL = branch === 'xl' && selectedExams.includes('gate');
    const maxReached = additionalSubjects.length >= 2;
    const formDisabled = disabled || goalsLoading;

    return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField label="Academic Branch" tag="// GOAL_BRANCH">
                <Select
                    value={branch}
                    onValueChange={onBranchChange}
                    disabled={formDisabled}
                >
                    <SelectTrigger className="rounded-none h-11 border-slate-900/10 bg-white/50 font-['Space_Grotesk',sans-serif] text-sm font-semibold dark:border-white/10 dark:bg-white/[0.03] dark:text-white">
                        <SelectValue
                            placeholder={
                                goalsLoading
                                    ? 'Loading branches...'
                                    : 'Select engineering branch'
                            }
                        />
                    </SelectTrigger>
                    <SelectContent className="rounded-none border-slate-900/10 bg-white/90 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/90">
                        <SelectGroup>
                            <SelectLabel className="rounded-none font-['JetBrains_Mono',monospace] text-[10px] uppercase text-slate-400">
                                Engineering Branches
                            </SelectLabel>
                            {branches.map((b) => (
                                <SelectItem key={b.id} value={b.id}>
                                    {b.name}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </FormField>

            <div className="flex flex-col gap-2">
                <FormField label="Target Examinations" tag="// MULTI_SELECT">
                    <Combobox
                        items={availableExams}
                        multiple
                        value={selectedExams}
                        onValueChange={onExamsChange}
                        disabled={formDisabled}
                    >
                        <ComboboxChips className="min-h-11 rounded-none border-slate-900/10 bg-white/50 p-1.5 dark:border-white/10 dark:bg-white/[0.03]">
                            <ComboboxValue>
                                {selectedExams.map((id) => {
                                    const exam = allExams.find(
                                        (e) => e.id === id
                                    );
                                    if (!exam) return null;

                                    return (
                                        <ComboboxChip
                                            key={exam.id}
                                            showRemove
                                            className="bg-[#2A5CFF]/10 rounded-none font-['JetBrains_Mono',monospace] text-xs font-bold text-[#2A5CFF] dark:bg-[#2A5CFF]/20 dark:text-blue-300"
                                        >
                                            {exam.short_name}
                                        </ComboboxChip>
                                    );
                                })}
                            </ComboboxValue>

                            <ComboboxChipsInput
                                placeholder={
                                    selectedExams.length === 0
                                        ? 'Select target exams...'
                                        : ''
                                }
                                className="font-['Space_Grotesk',sans-serif] rounded-none text-xs text-slate-700 dark:text-slate-300"
                            />
                        </ComboboxChips>

                        <ComboboxContent className="border-slate-900/10 bg-white/90 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/90">
                            <ComboboxEmpty className="p-3 font-['Fraunces',serif] text-xs text-slate-500">
                                No matching exams found. Select a branch first.
                            </ComboboxEmpty>
                            <ComboboxList>
                                {(exam) => (
                                    <ComboboxItem
                                        key={exam.id}
                                        value={exam.id}
                                        className="font-['Space_Grotesk',sans-serif] text-xs"
                                    >
                                        {exam.short_name}
                                    </ComboboxItem>
                                )}
                            </ComboboxList>
                        </ComboboxContent>
                    </Combobox>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Selecting multiple exams automatically merges relevant
                        syllabi into your custom practice modules.
                    </p>
                </FormField>

                {isGateXL && (
                    <FormField label="Optional Subjects" tag="// MULTI_SELECT">
                        <Combobox
                            items={optionalSubjects}
                            multiple
                            value={additionalSubjects}
                            onValueChange={(values) => {
                                if (values.length <= 2) {
                                    onAdditionalSubjectsChange(values);
                                }
                            }}
                            disabled={formDisabled}
                        >
                            <ComboboxChips className="min-h-11 rounded-none border-slate-900/10 bg-white/50 p-1.5 dark:border-white/10 dark:bg-white/[0.03]">
                                <ComboboxValue>
                                    {(values) =>
                                        values.map((id) => {
                                            const subject =
                                                optionalSubjects.find(
                                                    (s) => s.id === id
                                                );
                                            if (!subject) return null;

                                            return (
                                                <ComboboxChip
                                                    key={id}
                                                    showRemove
                                                    className="rounded-none bg-[#2A5CFF]/10 font-['JetBrains_Mono',monospace] text-xs font-bold text-[#2A5CFF] dark:bg-[#2A5CFF]/20 dark:text-blue-300"
                                                >
                                                    {subject.name}
                                                </ComboboxChip>
                                            );
                                        })
                                    }
                                </ComboboxValue>

                                <ComboboxChipsInput
                                    placeholder={
                                        maxReached ? '' : 'Select 2 subjects...'
                                    }
                                    className="rounded-none font-['Space_Grotesk',sans-serif] text-xs text-slate-700 dark:text-slate-300"
                                />
                            </ComboboxChips>

                            <ComboboxContent className="border-slate-900/10 bg-white/90 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/90">
                                <ComboboxEmpty className="p-3 font-['Fraunces',serif] text-xs text-slate-500">
                                    No optional subjects found.
                                </ComboboxEmpty>

                                <ComboboxList>
                                    {(subject) => {
                                        const isSelected =
                                            additionalSubjects.includes(
                                                subject.id
                                            );

                                        return (
                                            <ComboboxItem
                                                key={subject.id}
                                                value={subject.id}
                                                disabled={
                                                    !isSelected && maxReached
                                                }
                                                className="font-['Space_Grotesk',sans-serif] text-xs"
                                            >
                                                {subject.name}
                                            </ComboboxItem>
                                        );
                                    }}
                                </ComboboxList>
                            </ComboboxContent>
                        </Combobox>

                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Choose exactly 2 subjects.
                        </p>
                    </FormField>
                )}
            </div>
        </div>
    );
}
