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
                                className="h-11 rounded-none border-border bg-card/50 font-mono text-sm font-bold text-foreground"
                            />
                        </FormField>
                        <p className="mt-1.5 text-xs text-muted-foreground">
                            This is how other users see you. Can't be changed
                            later.
                        </p>
                        {touched.username && usernameError && (
                            <p className="mt-1 text-xs text-destructive">
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
                                className="h-11 rounded-none border-border bg-card/50 font-grotesk text-sm font-semibold text-foreground"
                            />
                        </FormField>
                        <p className="mt-1.5 text-xs text-muted-foreground">
                            Shown on your profile. You can change this later.
                        </p>
                        {touched.fullName && fullNameError && (
                            <p className="mt-1 text-xs text-destructive">
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
                            className="h-11 cursor-not-allowed rounded-none border-border bg-muted/50 font-mono text-xs text-muted-foreground"
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
                                className="h-11 rounded-none border-border bg-card/50 font-grotesk text-sm font-semibold text-foreground"
                            />
                        </FormField>
                        <p className="mt-1.5 text-xs text-muted-foreground">
                            Optional. Shows on your profile.
                        </p>
                        {touched.college && collegeError && (
                            <p className="mt-1 text-xs text-destructive">
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
                            className="resize-none rounded-none border-border bg-card/50 font-grotesk text-sm text-foreground"
                        />
                    </FormField>
                    <div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
                        <span>A short intro shown on your profile.</span>
                        <span className="tabular-nums">
                            {form.about.length}/100
                        </span>
                    </div>
                    {touched.about && aboutError && (
                        <p className="mt-1 text-xs text-destructive">
                            {aboutError}
                        </p>
                    )}
                </div>

                {/* Row 4 — Socials in 2 columns on desktop */}
                <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between border-b border-border pb-2">
                        <p className="font-grotesk text-xs font-bold uppercase tracking-wider text-foreground">
                            Social Links
                        </p>
                        <span className="text-[10px] font-bold uppercase text-muted-foreground/70">
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
                                    className="h-10 rounded-none border-border bg-card/50 font-mono text-xs text-foreground"
                                />
                            </FormField>
                        ))}
                    </div>

                    {hasMorePlatforms && (
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setShowAllSocials(true)}
                            className="w-full rounded-none text-xs text-muted-foreground hover:text-foreground"
                        >
                            Show more platforms ▾
                        </Button>
                    )}

                    {socialsError && (
                        <p className="text-xs text-destructive">
                            {socialsError}
                        </p>
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
