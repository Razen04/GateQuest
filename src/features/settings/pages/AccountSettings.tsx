import React, { useEffect, useMemo, useState } from 'react';

import { toast } from 'sonner';
import { CircleNotchIcon, User, UserGearIcon } from '@phosphor-icons/react';

import useAuth from '@/shared/hooks/useAuth';
import { useGoals } from '@/shared/hooks/useGoals';

import { getSocialSettingsValue } from '../api/social-settings';

import { getUserProfile, syncUserToSupabase, updateUserProfile } from '@/shared/utils/helper';

import SocialSettingsForm from '../components/SocialSettingsForm';

import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/shared/components/ui/dialog';
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
import SocialLinksDisplay from '../components/SocialLinksDisplay';

type FormFieldProps = {
    label: string;
    children: React.ReactNode;
};

const FormField = ({ label, children }: FormFieldProps) => (
    <div className="flex flex-col gap-2">
        <Label>{label}</Label>
        {children}
    </div>
);

const AccountSettings = () => {
    const { isLogin, user, setUser } = useAuth();

    const localUser = getUserProfile();

    const [name, setName] = useState(localUser?.name || '');
    const [college, setCollege] = useState(localUser?.college || '');
    const [targetYear, setTargetYear] = useState(localUser?.targetYear ?? 2027);
    const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});

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

    const [openSocialSettings, setOpenSocialSettings] = useState(false);

    useEffect(() => {
        const fetchSocialLinks = async () => {
            if (!user?.id) return;

            const data = await getSocialSettingsValue(user);
            if (data) {
                const activeLinks = Object.fromEntries(
                    Object.entries(data).filter(([, value]) => value !== null && value !== ''),
                ) as Record<string, string>;
                setSocialLinks(activeLinks);
            }
        };
        fetchSocialLinks();
    }, [user, openSocialSettings]);

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
            setUser(updated);

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
                <div className="flex justify-between items-center">
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
                            <p className="text-base text-blue-300">@{user?.username}</p>
                            <p className="text-sm text-gray-500">{user?.targetYear} Aspirant</p>
                            <p className="text-sm text-gray-500">{user?.college}</p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2 rounded-full p-2"
                        onClick={() => setOpenSocialSettings(true)}
                    >
                        <UserGearIcon weight="fill" />
                        <span className="hidden md:block">Edit Social Links</span>
                    </Button>
                </div>

                {/* Social Links Display */}
                <SocialLinksDisplay links={socialLinks} />

                <Dialog open={openSocialSettings} onOpenChange={setOpenSocialSettings}>
                    <DialogContent className="p-4">
                        <DialogHeader>
                            <DialogTitle>Social Account Links</DialogTitle>{' '}
                            <DialogDescription>
                                Add your social media account, if you wwant people to reach out to
                                you.
                            </DialogDescription>
                        </DialogHeader>
                        <SocialSettingsForm />
                    </DialogContent>
                </Dialog>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField label="Your Name">
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={isSaving}
                        />
                    </FormField>
                    <FormField label="Email Address">
                        <Input
                            type="email"
                            value={user?.email ?? ''}
                            placeholder="your.email@example.com"
                            disabled
                        />
                    </FormField>
                    <FormField label="College/University">
                        <Input
                            type="text"
                            value={college}
                            onChange={(e) => setCollege(e.target.value)}
                            placeholder="Your Institution"
                            disabled={isSaving}
                        />
                    </FormField>

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
                    {isSaving && <CircleNotchIcon className="mr-2 animate-spin" size={18} />}
                    {isSaving ? 'Saving...' : 'Save all changes'}
                </Button>
            </div>
        </div>
    );
};

export default AccountSettings;
