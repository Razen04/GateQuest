import { Input } from '@/shared/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/shared/components/ui/select';
import { Textarea } from '@/shared/components/ui/textarea';
import { FormField } from './FormField';

type ProfileFormProps = {
    name: string;
    onNameChange: (value: string) => void;
    email: string;
    college: string;
    onCollegeChange: (value: string) => void;
    targetYear: number;
    onTargetYearChange: (value: number) => void;
    about: string;
    onAboutChange: (value: string) => void;
    disabled: boolean;
    isBeta: boolean;
};

export function ProfileForm({
    name,
    onNameChange,
    email,
    college,
    onCollegeChange,
    targetYear,
    onTargetYearChange,
    about,
    onAboutChange,
    disabled,
    isBeta,
}: ProfileFormProps) {
    return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField label="Full Name" tag="// IDENTITY">
                <Input
                    value={name}
                    onChange={(e) => onNameChange(e.target.value)}
                    disabled={disabled}
                    className="h-11 border-slate-900/10 bg-white/50 font-['Space_Grotesk',sans-serif] text-sm font-semibold rounded-none transition focus:border-[#2A5CFF] focus:ring-1 focus:ring-[#2A5CFF] dark:border-white/10 dark:bg-white/[0.03] dark:text-white"
                />
            </FormField>

            <FormField label="Email Address" tag="// VERIFIED">
                <Input
                    type="email"
                    value={email}
                    placeholder="your.email@example.com"
                    disabled
                    className="h-11 cursor-not-allowed border-slate-900/10 bg-slate-100/50 font-['JetBrains_Mono',monospace] rounded-none text-xs text-slate-500 dark:border-white/5 dark:bg-white/[0.02] dark:text-slate-400"
                />
            </FormField>

            <FormField label="College / University" tag="// ACADEMIC_INST">
                <Input
                    type="text"
                    value={college}
                    onChange={(e) => onCollegeChange(e.target.value)}
                    placeholder="Your Institution"
                    disabled={disabled}
                    className="h-11 border-slate-900/10 bg-white/50 font-['Space_Grotesk',sans-serif] rounded-none text-sm font-semibold transition focus:border-[#2A5CFF] focus:ring-1 focus:ring-[#2A5CFF] dark:border-white/10 dark:bg-white/[0.03] dark:text-white"
                />
            </FormField>

            <FormField label="Target Exam Year" tag="// TIMELINE">
                <Select
                    onValueChange={(e) => onTargetYearChange(Number(e))}
                    value={String(targetYear)}
                    disabled={disabled}
                >
                    <SelectTrigger className="rounded-none h-11 border-slate-900/10 bg-white/50 font-['JetBrains_Mono',monospace] text-sm font-bold dark:border-white/10 dark:bg-white/[0.03] dark:text-white">
                        <SelectValue placeholder="Select target year" />
                    </SelectTrigger>
                    <SelectContent className="border-slate-900/10 bg-white/90 rounded-none backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/90">
                        {[2027, 2028, 2029, 2030].map((year) => (
                            <SelectItem
                                key={year}
                                value={String(year)}
                                className="font-['JetBrains_Mono',monospace] rounded-none"
                            >
                                {year} Batch
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </FormField>

            {isBeta && (
                <FormField
                    label="About / Bio"
                    tag="// BIOGRAPHY"
                    className="md:col-span-2"
                >
                    <Textarea
                        value={about}
                        onChange={(e) => onAboutChange(e.target.value)}
                        maxLength={100}
                        placeholder="Write a brief intro about your background, interests, or study goals..."
                        disabled={disabled}
                        rows={3}
                        className="resize-none border-slate-900/10 bg-white/50 font-['Space_Grotesk',sans-serif] rounded-none text-sm transition focus:border-[#2A5CFF] focus:ring-1 focus:ring-[#2A5CFF] dark:border-white/10 dark:bg-white/[0.03] dark:text-white"
                    />
                    <div className="flex justify-end text-xs text-slate-400">
                        {about.length}/100
                    </div>
                </FormField>
            )}
        </div>
    );
}
