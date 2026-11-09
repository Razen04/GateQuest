import {
    GraduationCap,
    IdentificationCard,
    Info,
    UserGear,
} from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { useGoalStore } from '@/app/stores/useGoalStore';
import { useStatsStore } from '@/app/stores/useStatsStore';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { AvatarUploadButton } from '@/shared/components/AvatarUploadButton';
import { BannerUploadButton } from '@/shared/components/BannerUploadButton';
import { Button } from '@/shared/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/shared/components/ui/dialog';
import { getDonorTier } from '@/shared/types/donor';
import { syncUserToSupabase } from '@/shared/utils/helper';
import { getSocialSettingsValue } from '../api/social-settings';
import { GoalSettings } from '../components/GoalSettings';
import { ProfileForm } from '../components/ProfileForm';
import { SaveButton } from '../components/SaveButton';
import SocialLinksDisplay from '../components/SocialLinksDisplay';
import SocialSettingsForm from '../components/SocialSettingsForm';

const AccountSettings = () => {
    const isLogin = useAuthStore((s) => s.user !== null && s.user.id !== '1');
    const user = useAuthStore((s) => s.user);
    const setUser = useAuthStore((s) => s.setUser);
    const { invalidateCache } = useProfile(user?.username);

    const userGoal = useGoalStore((s) => s.userGoal);
    const setInitialGoal = useGoalStore((s) => s.setInitialGoal);
    const goalsLoading = useGoalStore((s) => s.loading);

    // Profile state
    const [name, setName] = useState(user?.name || '');
    const [college, setCollege] = useState(user?.college || '');
    const [about, setAbout] = useState(user?.about || '');
    const [targetYear, setTargetYear] = useState(user?.targetYear ?? 2027);

    // Goal state
    const [tempBranch, setTempBranch] = useState('');
    const [tempExams, setTempExams] = useState<string[]>([]);
    const [tempAdditionalSubjects, setTempAdditionalSubjects] = useState<
        string[]
    >([]);

    // Save / UI state
    const [isSaving, setIsSaving] = useState(false);
    const [savedSuccess, setSavedSuccess] = useState(false);
    const [openSocialSettings, setOpenSocialSettings] = useState(false);
    const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});

    // Sync goal state from the store
    useEffect(() => {
        if (!userGoal) return;
        setTempBranch(userGoal.branch_id);
        setTempExams((userGoal.target_exams as string[]) || []);
        setTempAdditionalSubjects(
            (userGoal.additional_subjects as string[] | null) ?? []
        );
    }, [userGoal]);

    // Fetch social links
    useEffect(() => {
        const fetchSocialLinks = async () => {
            if (!user?.id || user.id === '1') return;
            const data = await getSocialSettingsValue(user);
            if (data) {
                const activeLinks = Object.fromEntries(
                    Object.entries(data).filter(
                        ([, value]) => value !== null && value !== ''
                    )
                ) as Record<string, string>;
                setSocialLinks(activeLinks);
            }
        };
        fetchSocialLinks();
    }, [user, openSocialSettings]);

    const handleBranchChange = (newBranch: string) => {
        setTempBranch(newBranch);
        setTempExams([]);
    };

    const handleSaveButton = async () => {
        if (!user) return;
        if (user.id === '1') {
            toast.info('Login to customize and change settings.');
            return;
        }

        if (tempExams.length === 0) {
            toast.error('Select at least 1 target exam.');
            return;
        }

        const isGateXL = tempBranch === 'xl' && tempExams.includes('gate');

        if (isGateXL && tempAdditionalSubjects.length !== 2) {
            toast.error('Select exactly 2 optional subjects for GATE XL.');
            return;
        }

        setIsSaving(true);

        try {
            const updated = {
                ...user,
                name,
                college,
                about,
                targetYear,
            };

            setUser(updated);
            useStatsStore.getState().markStatsStale();

            if (tempBranch) {
                await setInitialGoal(
                    tempBranch,
                    tempExams,
                    isGateXL ? tempAdditionalSubjects : [],
                    true
                );
            }

            await syncUserToSupabase(isLogin);

            setSavedSuccess(true);
            setTimeout(() => setSavedSuccess(false), 3000);
            invalidateCache();
        } catch (err) {
            console.error('Unable to save profile: ', err);
            toast.error('Unable to save profile changes.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="px-1 pb-20">
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="relative overflow-hidden border border-border bg-gradient-to-b from-card to-card/60 shadow-xl backdrop-blur-2xl"
            >
                {/* Banner */}
                <BannerUploadButton
                    className="h-32 w-full"
                    pencilPosition="top-right"
                />

                <div className="px-6 pb-6">
                    {/* ─── Identity row ─────────────────────────── */}
                    <div className="flex items-start gap-4">
                        {/* Avatar — half-overlaps banner */}
                        <div className="-mt-14 shrink-0 rounded-full ring-4 ring-card">
                            <AvatarUploadButton
                                size="md"
                                tier={getDonorTier(
                                    user?.notification_tags ?? []
                                )}
                            />
                        </div>

                        <div className="flex-1 min-w-0 space-y-1 pt-1">
                            <div className="flex items-center gap-2.5 flex-wrap">
                                <h3 className="font-['Space_Grotesk',sans-serif] text-xl font-bold tracking-tight text-foreground">
                                    {user?.name || 'Anonymous Aspirant'}
                                </h3>
                                <span className="border border-border bg-muted px-2.5 py-0.5 font-['JetBrains_Mono',monospace] text-[10px] font-bold text-muted-foreground">
                                    v{user?.version_number ?? '1.0'}
                                </span>
                            </div>

                            <div className="flex items-center gap-2 font-['JetBrains_Mono',monospace] text-xs text-muted-foreground">
                                <span className="text-chart-1">
                                    @{user?.username || 'candidate'}
                                </span>
                                {user?.targetYear && (
                                    <>
                                        <span>&bull;</span>
                                        <span>Target {user.targetYear}</span>
                                    </>
                                )}
                            </div>

                            {user?.college && (
                                <p className="flex items-center gap-1.5 font-['Fraunces',serif] text-xs text-muted-foreground">
                                    <GraduationCap
                                        size={14}
                                        className="text-chart-1"
                                    />
                                    {user.college}
                                </p>
                            )}
                        </div>
                    </div>

                    {user?.about && (
                        <div className="mt-5">
                            <p className="flex items-start gap-2 font-['Space_Grotesk',sans-serif] text-xs leading-relaxed text-muted-foreground">
                                <Info
                                    size={14}
                                    className="mt-0.5 shrink-0 text-chart-1"
                                />
                                <span>{user.about}</span>
                            </p>
                        </div>
                    )}

                    {Object.keys(socialLinks).length > 0 && (
                        <div className="mt-5 flex items-start justify-between gap-3">
                            <SocialLinksDisplay links={socialLinks} />
                            <button
                                onClick={() => setOpenSocialSettings(true)}
                                title="Manage socials"
                                aria-label="Manage social links"
                                className="group mt-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-card/90 text-muted-foreground shadow-sm opacity-70 transition-all duration-200 hover:scale-105 hover:bg-accent hover:text-accent-foreground hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                <UserGear size={14} weight="bold" />
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>
            {/* Social Settings Modal */}
            <Dialog
                open={openSocialSettings}
                onOpenChange={setOpenSocialSettings}
            >
                <DialogContent className="border-border bg-popover/90 p-6 backdrop-blur-2xl sm:max-w-md rounded-none">
                    <DialogHeader>
                        <DialogTitle className="font-['Space_Grotesk',sans-serif] text-lg font-bold rounded-none">
                            Social Media Presence
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground rounded-none">
                            Connect your profiles so peers can find your work.
                        </DialogDescription>
                    </DialogHeader>
                    <SocialSettingsForm
                        onSuccess={() => setOpenSocialSettings(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Form Sections */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="mt-8"
            >
                <section className="space-y-6">
                    <div className="flex items-center gap-2 border-b border-border pb-3">
                        <IdentificationCard
                            size={18}
                            className="text-chart-1"
                        />
                        <h4 className="font-['Space_Grotesk',sans-serif] text-sm font-bold uppercase tracking-wider text-foreground">
                            Profile Settings
                        </h4>
                    </div>

                    <ProfileForm
                        name={name}
                        onNameChange={setName}
                        email={user?.email ?? ''}
                        college={college}
                        onCollegeChange={setCollege}
                        targetYear={targetYear}
                        onTargetYearChange={setTargetYear}
                        about={about}
                        onAboutChange={setAbout}
                        disabled={isSaving}
                    />
                </section>

                <section className="space-y-6">
                    <div className="flex items-center gap-2 border-b border-border pb-3">
                        <IdentificationCard
                            size={18}
                            className="text-chart-1"
                        />
                        <h4 className="font-['Space_Grotesk',sans-serif] text-sm font-bold uppercase tracking-wider text-foreground">
                            Goal Configuration
                        </h4>
                    </div>

                    <GoalSettings
                        branch={tempBranch}
                        onBranchChange={handleBranchChange}
                        selectedExams={tempExams}
                        onExamsChange={setTempExams}
                        additionalSubjects={tempAdditionalSubjects}
                        onAdditionalSubjectsChange={setTempAdditionalSubjects}
                        disabled={isSaving}
                    />
                </section>

                <SaveButton
                    isSaving={isSaving}
                    savedSuccess={savedSuccess}
                    disabled={isSaving || goalsLoading}
                    onClick={handleSaveButton}
                />
            </motion.div>
        </div>
    );
};

export default AccountSettings;
