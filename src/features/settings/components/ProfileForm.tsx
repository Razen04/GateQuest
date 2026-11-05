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
}: ProfileFormProps) {
    return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField label="Full Name" tag="// IDENTITY">
                <Input
                    value={name}
                    onChange={(e) => onNameChange(e.target.value)}
                    disabled={disabled}
                    className="h-11 border-border bg-card/50 font-['Space_Grotesk',sans-serif] text-sm font-semibold rounded-none transition text-foreground placeholder:text-muted-foreground focus:border-chart-1 focus:ring-1 focus:ring-chart-1"
                />
            </FormField>

            <FormField label="Email Address" tag="// VERIFIED">
                <Input
                    type="email"
                    value={email}
                    placeholder="your.email@example.com"
                    disabled
                    className="h-11 cursor-not-allowed border-border bg-muted/50 font-['JetBrains_Mono',monospace] rounded-none text-xs text-muted-foreground"
                />
            </FormField>

            <FormField label="College / University" tag="// ACADEMIC_INST">
                <Input
                    type="text"
                    value={college}
                    onChange={(e) => onCollegeChange(e.target.value)}
                    placeholder="Your Institution"
                    disabled={disabled}
                    className="h-11 border-border bg-card/50 font-['Space_Grotesk',sans-serif] rounded-none text-sm font-semibold text-foreground placeholder:text-muted-foreground transition focus:border-chart-1 focus:ring-1 focus:ring-chart-1"
                />
            </FormField>

            <FormField label="Target Exam Year" tag="// TIMELINE">
                <Select
                    onValueChange={(e) => onTargetYearChange(Number(e))}
                    value={String(targetYear)}
                    disabled={disabled}
                >
                    <SelectTrigger className="rounded-none h-11 border-border bg-card/50 font-['JetBrains_Mono',monospace] text-sm font-bold text-foreground">
                        <SelectValue placeholder="Select target year" />
                    </SelectTrigger>
                    <SelectContent className="border-border bg-popover/90 rounded-none backdrop-blur-xl">
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
                    className="resize-none border-border bg-card/50 font-['Space_Grotesk',sans-serif] rounded-none text-sm text-foreground placeholder:text-muted-foreground transition focus:border-chart-1 focus:ring-1 focus:ring-chart-1"
                />
                <div className="flex justify-end text-xs text-muted-foreground">
                    {about.length}/100
                </div>
            </FormField>
        </div>
    );
}
