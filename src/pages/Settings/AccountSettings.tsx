import { useEffect, useMemo, useState } from 'react';
import { getUserProfile, syncUserToSupabase, updateUserProfile } from '../../helper.ts';
import { User } from '@phosphor-icons/react';
import useAuth from '../../hooks/useAuth.ts';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select.tsx';
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
} from '@/components/ui/combobox';
import { toast } from 'sonner';
import { useGoals } from '@/hooks/useGoals.ts';
import { CircleNotchIcon } from '@phosphor-icons/react';

const AccountSettings = () => {
    const user = getUserProfile();
    const { isLogin } = useAuth();

    const [name, setName] = useState(user?.name || '');
    const [college, setCollege] = useState(user?.college || '');
    const [targetYear, setTargetYear] = useState(user?.targetYear ?? 2026);

    // Branches and Exams data
    const {
        userGoal,
        branches,
        exams,
        branchExams,
        setInitialGoal,
        loading: goalsLoading,
    } = useGoals();

    const [tempBranch, setTempBranch] = useState<string>('');
    const [tempExams, setTempExams] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    const availableExams = useMemo(() => {
        if (!tempBranch) return [];

        const validExamIds = branchExams
            .filter((be) => be.branch_id === tempBranch)
            .map((be) => be.exam_id);

        return exams.filter((e) => validExamIds.includes(e.id));
    }, [tempBranch, branchExams, exams]);

    const handleBranchChange = (newBranch: string) => {
        setTempBranch(newBranch);
        setTempExams([]);
    };

    useEffect(() => {
        if (userGoal) {
            setTempBranch(userGoal.branch_id);
            setTempExams((userGoal?.target_exams as string[]) || []);
        }
    }, [userGoal]);

    const handleSaveButton = async () => {
        if (!user) return;
        if (tempExams.length == 0) {
            toast.error('Select atleast 1 exam.');
            return;
        }
        setIsSaving(true);

        try {
            const updated = { ...user, name, college, targetYear };
            updateUserProfile(updated);

            if (tempBranch) {
                await setInitialGoal(tempBranch, tempExams, true);
            }
            await syncUserToSupabase(isLogin);
        } catch (err) {
            console.error('Unable to save profile: ', err);
            toast.error('Unable to save profile.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="pb-20 px-4">
            <div className="space-y-6">
                <div className="flex items-center">
                    <div className="h-12 w-12 flex items-center justify-center p-1 mr-5 bg-gray-100 dark:bg-gray-800">
                        {user?.avatar ? (
                            <img src={user?.avatar} alt="User avatar" className="w-full" />
                        ) : (
                            <User className="text-gray-600 dark:text-gray-300" />
                        )}
                    </div>
                    <div>
                        <h3 className="font-medium">
                            {user?.name ? user.name : 'Anonymous User'}{' '}
                            <span className="text-gray-500">• v{user?.version_number}</span>
                        </h3>
                        <p className="text-sm text-gray-500">{user?.targetYear} Aspirant</p>
                        <p className="text-sm text-gray-500">{user?.college}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                        <Label>Your Name</Label>
                        <Input
                            type="text"
                            placeholder="Your name"
                            onChange={(e) => setName(e.target.value)}
                            value={name}
                            disabled={isSaving}
                        />
                    </div>

                    {user?.email ? (
                        <div className="flex flex-col gap-2">
                            <Label>Email Address</Label>
                            <Input type="email" defaultValue={user.email} disabled />
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            <Label>Email Address</Label>
                            <Input
                                type="email"
                                placeholder="your.email@example.com"
                                disabled={isSaving}
                            />
                        </div>
                    )}
                    <div className="flex flex-col gap-2">
                        <Label>College/University</Label>
                        <Input
                            type="text"
                            placeholder="Your Institution"
                            onChange={(e) => setCollege(e.target.value)}
                            value={college}
                            disabled={isSaving}
                        />
                    </div>

                    <div>
                        <Label className="block text-sm font-medium mb-1">Target Year</Label>
                        <Select
                            onValueChange={(e) => setTargetYear(Number(e))}
                            value={String(targetYear)}
                            disabled={isSaving}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select a year" />
                            </SelectTrigger>
                            <SelectContent>
                                {[2027, 2028, 2029].map((year) => (
                                    <SelectItem key={year} value={String(year)}>
                                        {year}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Subject Selection and Exams */}
                    <div>
                        <Label className="block text-sm font-medium mb-1">Branch</Label>
                        <Select
                            value={tempBranch}
                            onValueChange={handleBranchChange}
                            disabled={goalsLoading || isSaving}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue
                                    placeholder={
                                        goalsLoading ? 'Loading branches...' : 'Select branch'
                                    }
                                />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>Branches</SelectLabel>
                                    {branches.map((b) => (
                                        <SelectItem key={b.id} value={b.id}>
                                            {b.name}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label className="block text-sm font-medium mb-1">Exams</Label>
                        <Combobox
                            items={availableExams}
                            multiple
                            value={tempExams}
                            onValueChange={setTempExams}
                            disabled={goalsLoading || isSaving}
                        >
                            <ComboboxChips>
                                <ComboboxValue>
                                    {tempExams.map((id) => {
                                        const exam = exams.find((e) => e.id === id);
                                        if (!exam) return null;

                                        return (
                                            <ComboboxChip key={exam.id} showRemove>
                                                {exam.short_name}
                                            </ComboboxChip>
                                        );
                                    })}
                                </ComboboxValue>
                                <ComboboxChipsInput placeholder="Add exams" />
                            </ComboboxChips>
                            <ComboboxContent>
                                <ComboboxEmpty>No items found.</ComboboxEmpty>
                                <ComboboxList>
                                    {(exam) => (
                                        <ComboboxItem key={exam.id} value={exam.id}>
                                            {exam.short_name}
                                        </ComboboxItem>
                                    )}
                                </ComboboxList>
                            </ComboboxContent>
                        </Combobox>
                        <p className="text-xs text-muted-foreground mt-1">
                            Selecting multiple exams will merge their subjects in your practice tab.
                        </p>
                    </div>
                </div>

                <Button
                    onClick={handleSaveButton}
                    className="w-full md:w-auto min-w-[150px]"
                    disabled={isSaving || goalsLoading}
                >
                    {isSaving ? (
                        <>
                            <CircleNotchIcon className="mr-2 animate-spin" size={18} />
                            Saving...
                        </>
                    ) : (
                        'Save all changes'
                    )}
                </Button>
            </div>
        </div>
    );
};

export default AccountSettings;
