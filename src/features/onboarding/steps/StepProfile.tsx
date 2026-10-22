import { useState } from 'react';
import { FormField } from '@/features/settings/components/FormField';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { StepFooter } from '../components/StepFooter';
import { SOCIAL_PLATFORMS, VISIBLE_SOCIAL_COUNT } from '../constants';
import type { ProfileFormData } from '../types';
import {
    validateAbout,
    validateCollege,
    validateFullName,
    validateSocials,
    validateUsername,
} from '../utils/validators';

type StepProfileProps = {
    defaultValue: ProfileFormData;
    onNext: (data: ProfileFormData) => void;
    onBack: () => void;
    isFirst: boolean;
    isLast: boolean;
};

export function StepProfile({
    defaultValue,
    onNext,
    onBack,
    isFirst,
}: StepProfileProps) {
    const [form, setForm] = useState<ProfileFormData>(defaultValue);
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [showAllSocials, setShowAllSocials] = useState(false);

    const usernameError = validateUsername(form.username);
    const fullNameError = validateFullName(form.fullName);
    const collegeError = validateCollege(form.college);
    const aboutError = validateAbout(form.about);
    const socialsError = validateSocials(form.socials);

    const isValid =
        !usernameError &&
        !fullNameError &&
        !collegeError &&
        !aboutError &&
        !socialsError;

    const update = <K extends keyof ProfileFormData>(
        key: K,
        value: ProfileFormData[K]
    ) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const updateSocial = (key: string, value: string) => {
        setForm((prev) => ({
            ...prev,
            socials: { ...prev.socials, [key]: value },
        }));
    };

    const touch = (key: string) =>
        setTouched((prev) => ({ ...prev, [key]: true }));

    const handleNext = () => {
        if (!isValid) return;
        onNext(form);
    };

    const visiblePlatforms = showAllSocials
        ? SOCIAL_PLATFORMS
        : SOCIAL_PLATFORMS.slice(0, VISIBLE_SOCIAL_COUNT);

    const hasMorePlatforms =
        SOCIAL_PLATFORMS.length > VISIBLE_SOCIAL_COUNT && !showAllSocials;

    return (
        <>
            <div className="space-y-6 md:space-y-8">
                {/* Row 1 — Identity: Username + Full Name */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                        <FormField
                            label="Username"
                            tag="// REQUIRED"
                            htmlFor="onboarding-username"
                        >
                            <Input
                                id="onboarding-username"
                                value={form.username}
                                onChange={(e) =>
                                    update('username', e.target.value)
                                }
                                onBlur={() => touch('username')}
                                placeholder="your_handle"
                                autoComplete="off"
                                className="h-11 rounded-none border-slate-900/10 bg-white/50 font-['JetBrains_Mono',monospace] text-sm font-bold dark:border-white/10 dark:bg-white/[0.03] dark:text-white"
                            />
                        </FormField>
                        <p className="mt-1.5 text-xs text-slate-500 dark:text-zinc-400">
                            This is how other users see you. Can't be changed
                            later.
                        </p>
                        {touched.username && usernameError && (
                            <p className="mt-1 text-xs text-red-500">
                                {usernameError}
                            </p>
                        )}
                    </div>

                    <div>
                        <FormField
                            label="Full Name"
                            tag="// REQUIRED"
                            htmlFor="onboarding-name"
                        >
                            <Input
                                id="onboarding-name"
                                value={form.fullName}
                                onChange={(e) =>
                                    update('fullName', e.target.value)
                                }
                                onBlur={() => touch('fullName')}
                                placeholder="Your full name"
                                className="h-11 rounded-none border-slate-900/10 bg-white/50 font-['Space_Grotesk',sans-serif] text-sm font-semibold dark:border-white/10 dark:bg-white/[0.03] dark:text-white"
                            />
                        </FormField>
                        <p className="mt-1.5 text-xs text-slate-500 dark:text-zinc-400">
                            Shown on your profile. You can change this later.
                        </p>
                        {touched.fullName && fullNameError && (
                            <p className="mt-1 text-xs text-red-500">
                                {fullNameError}
                            </p>
                        )}
                    </div>
                </div>

                {/* Row 2 — Contact: Email + College */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <FormField
                        label="Email"
                        tag="// VERIFIED"
                        htmlFor="onboarding-email"
                    >
                        <Input
                            id="onboarding-email"
                            type="email"
                            value={form.email}
                            readOnly
                            disabled
                            className="h-11 cursor-not-allowed rounded-none border-slate-900/10 bg-slate-100/50 font-['JetBrains_Mono',monospace] text-xs text-slate-500 dark:border-white/5 dark:bg-white/[0.02] dark:text-slate-400"
                        />
                    </FormField>

                    <div>
                        <FormField
                            label="College"
                            tag="// OPTIONAL"
                            htmlFor="onboarding-college"
                        >
                            <Input
                                id="onboarding-college"
                                value={form.college}
                                onChange={(e) =>
                                    update('college', e.target.value)
                                }
                                onBlur={() => touch('college')}
                                placeholder="Your institution"
                                className="h-11 rounded-none border-slate-900/10 bg-white/50 font-['Space_Grotesk',sans-serif] text-sm font-semibold dark:border-white/10 dark:bg-white/[0.03] dark:text-white"
                            />
                        </FormField>
                        <p className="mt-1.5 text-xs text-slate-500 dark:text-zinc-400">
                            Optional. Shows on your profile.
                        </p>
                        {touched.college && collegeError && (
                            <p className="mt-1 text-xs text-red-500">
                                {collegeError}
                            </p>
                        )}
                    </div>
                </div>

                {/* Row 3 — About: full width */}
                <div>
                    <FormField
                        label="About"
                        tag="// REQUIRED"
                        htmlFor="onboarding-about"
                    >
                        <Textarea
                            id="onboarding-about"
                            value={form.about}
                            onChange={(e) => update('about', e.target.value)}
                            onBlur={() => touch('about')}
                            maxLength={100}
                            rows={3}
                            placeholder="A short intro about yourself..."
                            className="resize-none rounded-none border-slate-900/10 bg-white/50 font-['Space_Grotesk',sans-serif] text-sm dark:border-white/10 dark:bg-white/[0.03] dark:text-white"
                        />
                    </FormField>
                    <div className="mt-1.5 flex justify-between text-xs text-slate-500 dark:text-zinc-400">
                        <span>A short intro shown on your profile.</span>
                        <span className="tabular-nums">
                            {form.about.length}/100
                        </span>
                    </div>
                    {touched.about && aboutError && (
                        <p className="mt-1 text-xs text-red-500">
                            {aboutError}
                        </p>
                    )}
                </div>

                {/* Row 4 — Socials in 2 columns on desktop */}
                <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2 dark:border-zinc-800">
                        <p className="font-['Space_Grotesk',sans-serif] text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Social Links
                        </p>
                        <span className="text-[10px] font-bold uppercase text-slate-400">
                            Optional
                        </span>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {visiblePlatforms.map((platform) => (
                            <FormField
                                key={platform.key}
                                label={platform.label}
                                htmlFor={`onboarding-social-${platform.key}`}
                                Icon={platform.Icon}
                            >
                                <Input
                                    id={`onboarding-social-${platform.key}`}
                                    value={form.socials[platform.key] ?? ''}
                                    onChange={(e) =>
                                        updateSocial(
                                            platform.key,
                                            e.target.value
                                        )
                                    }
                                    placeholder={platform.placeholder}
                                    className="h-10 rounded-none border-slate-900/10 bg-white/50 font-['JetBrains_Mono',monospace] text-xs dark:border-white/10 dark:bg-white/[0.03] dark:text-white"
                                />
                            </FormField>
                        ))}
                    </div>

                    {hasMorePlatforms && (
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setShowAllSocials(true)}
                            className="w-full rounded-none text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white"
                        >
                            Show more platforms ▾
                        </Button>
                    )}

                    {socialsError && (
                        <p className="text-xs text-red-500">{socialsError}</p>
                    )}
                </div>
            </div>

            <StepFooter
                onBack={isFirst ? undefined : onBack}
                onNext={handleNext}
                isNextDisabled={!isValid}
            />
        </>
    );
}
