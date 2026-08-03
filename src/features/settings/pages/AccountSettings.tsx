import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
    CircleNotch,
    User,
    UserGear,
    GraduationCap,
    Check,
    FloppyDisk,
    IdentificationCard,
    Info,
} from '@phosphor-icons/react';

import useAuth from '@/shared/hooks/useAuth';
import { useGoals } from '@/shared/hooks/useGoals';
import { getSocialSettingsValue } from '../api/social-settings';
import { getUserProfile, syncUserToSupabase, updateUserProfile } from '@/shared/utils/helper';

import SocialSettingsForm from '../components/SocialSettingsForm';
import SocialLinksDisplay from '../components/SocialLinksDisplay';

import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
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
import type { Settings } from '@/shared/types/Settings';

type FormFieldProps = {
    label: string;
    tag?: string;
    children: React.ReactNode;
    className?: string;
};

const FormField = ({ label, tag, children, className }: FormFieldProps) => (
    <div className={`group relative space-y-2 ${className || ''}`}>
        <div className="flex items-center justify-between">
            <Label className="font-['Space_Grotesk',sans-serif] text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                {label}
            </Label>
            {tag && (
                <span className="font-['JetBrains_Mono',monospace] text-[10px] font-medium text-slate-400">
                    {tag}
                </span>
            )}
        </div>
        {children}
    </div>
);

const AccountSettings = () => {
    const { isLogin, user, setUser } = useAuth();
    const localUser = getUserProfile();

    const [name, setName] = useState(localUser?.name || '');
    const [college, setCollege] = useState(localUser?.college || '');
    const [about, setAbout] = useState(localUser?.about || '');
    const [targetYear, setTargetYear] = useState(localUser?.targetYear ?? 2027);
    const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});
    const userSettings = user?.settings as Settings | undefined;

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
    const [savedSuccess, setSavedSuccess] = useState(false);
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
        if (tempExams.length === 0) {
            toast.error('Select at least 1 target exam.');
            return;
        }
        setIsSaving(true);

        try {
            const updated = { ...user, name, college, about, targetYear };
            updateUserProfile(updated);
            setUser(updated);

            if (tempBranch) {
                await setInitialGoal(tempBranch, tempExams, true);
            }
            await syncUserToSupabase(isLogin);

            setSavedSuccess(true);
            setTimeout(() => setSavedSuccess(false), 3000);
        } catch (err) {
            console.error('Unable to save profile: ', err);
            toast.error('Unable to save profile changes.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-8 px-2 pb-20 pt-4">
            {/* Header Identity Card */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="relative overflow-hidden border border-slate-900/10 bg-gradient-to-b from-slate-50 to-white/60 p-6 shadow-xl backdrop-blur-2xl dark:border-white/10 dark:from-white/[0.04] dark:to-white/[0.01]"
            >
                <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 bg-[#2A5CFF]/10 blur-3xl" />

                <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-5">
                        {/* Avatar */}
                        <div className="relative shrink-0">
                            <div className="flex h-16 w-16 items-center justify-center overflow-hidden border border-slate-900/10 bg-white shadow-md transition-transform duration-300 hover:scale-105 dark:border-white/20 dark:bg-white/10">
                                {user?.avatar ? (
                                    <img
                                        src={user.avatar}
                                        alt="User avatar"
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <User className="h-7 w-7 text-slate-500 dark:text-slate-300" />
                                )}
                            </div>
                        </div>

                        {/* Info details */}
                        <div className="space-y-1">
                            <div className="flex items-center gap-2.5 flex-wrap">
                                <h3 className="font-['Space_Grotesk',sans-serif] text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                                    {user?.name || 'Anonymous Aspirant'}
                                </h3>
                                <span className="border border-slate-900/10 bg-slate-100 px-2.5 py-0.5 font-['JetBrains_Mono',monospace] text-[10px] font-bold text-slate-600 dark:border-white/15 dark:bg-white/10 dark:text-slate-300">
                                    v{user?.version_number ?? '1.0'}
                                </span>
                            </div>

                            {userSettings?.is_beta && (
                                <div className="flex items-center gap-2 font-['JetBrains_Mono',monospace] text-xs text-slate-500 dark:text-slate-400">
                                    <span className="text-[#2A5CFF]">
                                        @{user?.username || 'candidate'}
                                    </span>
                                    {user?.targetYear && (
                                        <>
                                            <span>&bull;</span>
                                            <span>Target {user.targetYear}</span>
                                        </>
                                    )}
                                </div>
                            )}

                            {user?.college && (
                                <p className="flex items-center gap-1.5 font-['Fraunces',serif] text-xs text-slate-500 dark:text-slate-400">
                                    <GraduationCap size={14} className="text-[#2A5CFF]" />
                                    {user.college}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Action button */}
                    {userSettings?.is_beta && (
                        <Button
                            onClick={() => setOpenSocialSettings(true)}
                            className="group rounded-none flex h-10 shrink-0 items-center gap-2 border border-slate-900/10 bg-white/80 px-4 font-['Space_Grotesk',sans-serif] text-xs font-bold text-slate-800 shadow-sm transition hover:bg-slate-100 hover:shadow-md dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                        >
                            <UserGear
                                size={16}
                                className="transition-transform group-hover:rotate-45"
                            />
                            <span>Manage Profiles</span>
                        </Button>
                    )}
                </div>

                {/* NOTE: This is currently in beta. */}
                {/* About Display */}
                {user?.about && user?.settings?.is_beta && (
                    <div className="mt-4 pt-3 border-t border-slate-900/5 dark:border-white/10">
                        <p className="flex items-start gap-2 font-['Space_Grotesk',sans-serif] text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            <Info size={16} className="mt-0.5 shrink-0 text-[#2A5CFF]" />
                            <span>{user.about}</span>
                        </p>
                    </div>
                )}

                {/* Social links row */}
                {userSettings?.is_beta && (
                    <>
                        <div className="my-4 h-px bg-slate-900/5 dark:bg-white/10" />
                        <div className="pt-1">
                            <SocialLinksDisplay links={socialLinks} />
                        </div>
                    </>
                )}
            </motion.div>

            {/* Social Settings Modal Dialog */}
            <Dialog open={openSocialSettings} onOpenChange={setOpenSocialSettings}>
                <DialogContent className="border-slate-900/10 bg-white/90 p-6 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/90 sm:max-w-md rounded-none">
                    <DialogHeader>
                        <DialogTitle className="font-['Space_Grotesk',sans-serif] text-lg font-bold rounded-none">
                            Social Media Presence
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 rounded-none">
                            Connect your profiles so peers and mentors can find your work.
                        </DialogDescription>
                    </DialogHeader>
                    <SocialSettingsForm onSuccess={() => setOpenSocialSettings(false)} />
                </DialogContent>
            </Dialog>

            {/* Form Fields Matrix */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="space-y-6"
            >
                <div className="flex items-center gap-2 border-b border-slate-900/10 pb-3 dark:border-white/10">
                    <IdentificationCard size={18} className="text-[#2A5CFF]" />
                    <h4 className="font-['Space_Grotesk',sans-serif] text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                        Personal Dossier Settings
                    </h4>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <FormField label="Full Name" tag="// IDENTITY">
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={isSaving}
                            className="h-11 border-slate-900/10 bg-white/50 font-['Space_Grotesk',sans-serif] text-sm font-semibold rounded-none transition focus:border-[#2A5CFF] focus:ring-1 focus:ring-[#2A5CFF] dark:border-white/10 dark:bg-white/[0.03] dark:text-white"
                        />
                    </FormField>

                    <FormField label="Email Address" tag="// VERIFIED">
                        <Input
                            type="email"
                            value={user?.email ?? ''}
                            placeholder="your.email@example.com"
                            disabled
                            className="h-11 cursor-not-allowed border-slate-900/10 bg-slate-100/50 font-['JetBrains_Mono',monospace] rounded-none text-xs text-slate-500 dark:border-white/5 dark:bg-white/[0.02] dark:text-slate-400"
                        />
                    </FormField>

                    <FormField label="College / University" tag="// ACADEMIC_INST">
                        <Input
                            type="text"
                            value={college}
                            onChange={(e) => setCollege(e.target.value)}
                            placeholder="Your Institution"
                            disabled={isSaving}
                            className="h-11 border-slate-900/10 bg-white/50 font-['Space_Grotesk',sans-serif] rounded-none text-sm font-semibold transition focus:border-[#2A5CFF] focus:ring-1 focus:ring-[#2A5CFF] dark:border-white/10 dark:bg-white/[0.03] dark:text-white"
                        />
                    </FormField>

                    <FormField label="Target Exam Year" tag="// TIMELINE">
                        <Select
                            onValueChange={(e) => setTargetYear(Number(e))}
                            value={String(targetYear)}
                            disabled={isSaving}
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

                    <FormField label="Academic Branch" tag="// GOAL_BRANCH">
                        <Select
                            value={tempBranch}
                            onValueChange={handleBranchChange}
                            disabled={goalsLoading || isSaving}
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

                    <FormField label="Target Examinations" tag="// MULTI_SELECT">
                        <Combobox
                            items={availableExams}
                            multiple
                            value={tempExams}
                            onValueChange={setTempExams}
                            disabled={goalsLoading || isSaving}
                        >
                            <ComboboxChips className="min-h-11 rounded-none border-slate-900/10 bg-white/50 p-1.5 dark:border-white/10 dark:bg-white/[0.03]">
                                <ComboboxValue>
                                    {tempExams.map((id) => {
                                        const exam = exams.find((e) => e.id === id);
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
                                        tempExams.length === 0 ? 'Select target exams...' : ''
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
                            Selecting multiple exams automatically merges relevant syllabi into your
                            custom practice modules.
                        </p>
                    </FormField>

                    {/* NOTE: This is currently in beta. */}
                    {/* About Section */}
                    {user?.settings?.is_beta && (
                        <FormField label="About / Bio" tag="// BIOGRAPHY" className="md:col-span-2">
                            <Textarea
                                value={about}
                                onChange={(e) => setAbout(e.target.value)}
                                maxLength={100}
                                placeholder="Write a brief intro about your background, interests, or study goals..."
                                disabled={isSaving}
                                rows={3}
                                className="resize-none border-slate-900/10 bg-white/50 font-['Space_Grotesk',sans-serif] rounded-none text-sm transition focus:border-[#2A5CFF] focus:ring-1 focus:ring-[#2A5CFF] dark:border-white/10 dark:bg-white/[0.03] dark:text-white"
                            />
                            <div className="flex justify-end text-xs text-slate-400">
                                {about.length}/100
                            </div>
                        </FormField>
                    )}
                </div>

                {/* Save CTA */}
                <div className="pt-4">
                    <Button
                        onClick={handleSaveButton}
                        disabled={isSaving || goalsLoading}
                        className={`rounded-none group relative flex h-12 w-full items-center justify-center gap-2 font-['Space_Grotesk',sans-serif] text-sm font-bold text-white transition-all md:w-auto md:min-w-[200px] ${
                            savedSuccess
                                ? 'bg-emerald-600 hover:bg-emerald-700'
                                : 'bg-[#2A5CFF] hover:bg-[#2A5CFF]/90 hover:shadow-lg hover:shadow-[#2A5CFF]/20 active:scale-[0.99]'
                        }`}
                    >
                        {isSaving ? (
                            <>
                                <CircleNotch className="animate-spin" size={18} />
                                <span>Syncing Changes...</span>
                            </>
                        ) : savedSuccess ? (
                            <>
                                <Check size={18} weight="bold" />
                                <span>Changes Saved</span>
                            </>
                        ) : (
                            <>
                                <FloppyDisk size={18} />
                                <span>Save Profile Changes</span>
                            </>
                        )}
                    </Button>
                </div>
            </motion.div>
        </div>
    );
};

export default AccountSettings;
