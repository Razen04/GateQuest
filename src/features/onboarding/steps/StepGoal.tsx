import { useMemo, useState } from 'react';
import { useGoalStore } from '@/app/stores/useGoalStore';
import { FormField } from '@/features/settings/components/FormField';
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
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/shared/components/ui/select';
import { StepFooter } from '../components/StepFooter';
import { DEFAULT_TARGET_YEAR } from '../constants';
import type { GoalFormData } from '../types';
import { validateBranch, validateExams } from '../utils/validators';

type StepGoalProps = {
    defaultValue: GoalFormData;
    onNext: (data: GoalFormData) => void;
    onBack: () => void;
    isFirst: boolean;
    isLast: boolean;
};

const YEAR_SPAN = 4;

export function StepGoal({
    defaultValue,
    onNext,
    onBack,
    isFirst,
}: StepGoalProps) {
    const branches = useGoalStore((s) => s.branches);
    const exams = useGoalStore((s) => s.exams);
    const branchExams = useGoalStore((s) => s.branchExams);

    const currentYear = new Date().getFullYear();
    const years = useMemo(
        () => Array.from({ length: YEAR_SPAN }, (_, i) => currentYear + i + 1),
        [currentYear]
    );

    const [form, setForm] = useState<GoalFormData>({
        branchId: defaultValue.branchId,
        targetExams: defaultValue.targetExams,
        targetYear: defaultValue.targetYear ?? DEFAULT_TARGET_YEAR,
    });

    const availableExams = useMemo(() => {
        if (!form.branchId) return [];
        const validExamIds = branchExams
            .filter((be) => be.branch_id === form.branchId)
            .map((be) => be.exam_id);
        return exams.filter((e) => validExamIds.includes(e.id));
    }, [form.branchId, branchExams, exams]);

    const branchError = validateBranch(form.branchId);
    const examsError = validateExams(form.targetExams);
    const isValid = !branchError && !examsError;

    const handleBranchChange = (newBranch: string) => {
        const validExamIds = branchExams
            .filter((be) => be.branch_id === newBranch)
            .map((be) => be.exam_id);
        const filteredExams = form.targetExams.filter((id) =>
            validExamIds.includes(id)
        );
        setForm((prev) => ({
            ...prev,
            branchId: newBranch,
            targetExams: filteredExams,
        }));
    };

    const handleNext = () => {
        if (!isValid) return;
        onNext(form);
    };

    return (
        <>
            <div className="space-y-6">
                {/* Branch */}
                <FormField
                    label="Branch"
                    tag="// REQUIRED"
                    htmlFor="onboarding-branch"
                >
                    <Select
                        value={form.branchId}
                        onValueChange={handleBranchChange}
                    >
                        <SelectTrigger
                            id="onboarding-branch"
                            aria-label="Branch"
                            className="h-11 rounded-none border-slate-900/10 bg-white/50 font-['Space_Grotesk',sans-serif] text-sm font-semibold dark:border-white/10 dark:bg-white/[0.03] dark:text-white"
                        >
                            <SelectValue placeholder="Select branch" />
                        </SelectTrigger>
                        <SelectContent className="rounded-none border-slate-900/10 bg-white/95 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/95">
                            {branches.map((b) => (
                                <SelectItem key={b.id} value={b.id}>
                                    {b.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </FormField>
                <p className="-mt-4 text-xs text-slate-500 dark:text-zinc-400">
                    We use this to show the right subjects and questions.
                </p>

                {/* Target Exams */}
                <FormField
                    label="Target Exams"
                    tag="// REQUIRED"
                    htmlFor="onboarding-exams"
                >
                    <Combobox
                        items={availableExams}
                        multiple
                        value={form.targetExams}
                        onValueChange={(values) =>
                            setForm((prev) => ({
                                ...prev,
                                targetExams: values,
                            }))
                        }
                        disabled={!form.branchId}
                    >
                        <ComboboxChips className="min-h-11 rounded-none border-slate-900/10 bg-white/50 p-1.5 dark:border-white/10 dark:bg-white/[0.03]">
                            <ComboboxValue>
                                {form.targetExams.map((id) => {
                                    const exam = exams.find((e) => e.id === id);
                                    if (!exam) return null;
                                    return (
                                        <ComboboxChip
                                            key={exam.id}
                                            showRemove
                                            className="rounded-none bg-[#2A5CFF]/10 font-['JetBrains_Mono',monospace] text-xs font-bold text-[#2A5CFF] dark:bg-[#2A5CFF]/20 dark:text-blue-300"
                                        >
                                            {exam.short_name}
                                        </ComboboxChip>
                                    );
                                })}
                            </ComboboxValue>
                            <ComboboxChipsInput
                                id="onboarding-exams"
                                aria-label="Target Exams"
                                placeholder={
                                    !form.branchId
                                        ? 'Select branch first'
                                        : form.targetExams.length === 0
                                          ? 'Select exams...'
                                          : ''
                                }
                                className="rounded-none font-['Space_Grotesk',sans-serif] text-xs"
                            />
                        </ComboboxChips>
                        <ComboboxContent className="border-slate-900/10 bg-white/95 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/95">
                            <ComboboxEmpty className="p-3 text-xs text-slate-500">
                                No exams available for this branch.
                            </ComboboxEmpty>
                            <ComboboxList>
                                {(exam) => (
                                    <ComboboxItem
                                        key={exam.id}
                                        value={exam.id}
                                        className="text-xs"
                                    >
                                        {exam.short_name}
                                    </ComboboxItem>
                                )}
                            </ComboboxList>
                        </ComboboxContent>
                    </Combobox>
                </FormField>
                <p className="-mt-4 text-xs text-slate-500 dark:text-zinc-400">
                    Practice sessions are tailored to these exams.
                </p>

                {/* Target Year — native select for form semantics */}
                <FormField
                    label="Target Year"
                    tag="// REQUIRED"
                    htmlFor="onboarding-year"
                >
                    <select
                        id="onboarding-year"
                        value={form.targetYear ?? DEFAULT_TARGET_YEAR}
                        onChange={(e) =>
                            setForm((prev) => ({
                                ...prev,
                                targetYear: Number(e.target.value),
                            }))
                        }
                        className="h-11 w-full rounded-none border border-slate-900/10 bg-white/50 px-3 font-['JetBrains_Mono',monospace] text-sm font-bold dark:border-white/10 dark:bg-white/[0.03] dark:text-white"
                    >
                        {years.map((y) => (
                            <option key={y} value={y}>
                                {y}
                            </option>
                        ))}
                    </select>
                </FormField>
                <p className="-mt-4 text-xs text-slate-500 dark:text-zinc-400">
                    Sets the timeline for your study plan and daily targets.
                </p>
            </div>

            <StepFooter
                onBack={isFirst ? undefined : onBack}
                onNext={handleNext}
                isNextDisabled={!isValid}
            />
        </>
    );
}
