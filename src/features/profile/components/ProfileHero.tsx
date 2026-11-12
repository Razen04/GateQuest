import {
    CalendarBlank,
    DiscordLogo,
    FediverseLogoIcon,
    GithubLogo,
    Globe,
    GraduationCap,
    LinkedinLogo,
    MastodonLogoIcon,
    RedditLogo,
    SpotifyLogo,
    XLogoIcon,
    YoutubeLogo,
} from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import type { JSX } from 'react';
import CodeforcesIcon from '@/icons/codeforces.svg';
import LeetcodeIcon from '@/icons/leetcode.svg';
import { eyebrow, glassPanel } from '../styles/profileTheme';
import type { ProfileData } from '../types/profile';

const SOCIAL_ICONS: Record<string, JSX.Element> = {
    github: <GithubLogo size={15} />,
    linkedin: <LinkedinLogo size={15} />,
    x: <XLogoIcon size={15} />,
    discord: <DiscordLogo size={15} />,
    reddit: <RedditLogo size={15} />,
    spotify: <SpotifyLogo size={15} />,
    youtube: <YoutubeLogo size={15} />,
    lemmy: <FediverseLogoIcon size={15} />,
    mastodon: <MastodonLogoIcon size={15} />,
    codeforces: (
        <img
            src={CodeforcesIcon}
            className="w-3 h-3 dark:brightness-0 dark:invert"
        />
    ),
    leetcode: (
        <img
            src={LeetcodeIcon}
            className="w-3 h-3 dark:brightness-0 dark:invert"
        />
    ),
};

interface ProfileHeroProps {
    profile: ProfileData['profile'];
}

import { UserCircleIcon } from '@phosphor-icons/react';
import { Banner } from '@/shared/components/Banner';
import { TieredAvatar } from '@/shared/components/TieredAvatar';
import { TieredName } from '@/shared/components/TieredName';
import { getDonorTier } from '@/shared/types/donor';

export default function ProfileHero({ profile }: ProfileHeroProps) {
    const displayName = profile.name || 'Anonymous User';
    const displayUsername = profile.username || 'user';
    const displayTier = getDonorTier(profile.notification_tags);

    const activeSocials = Object.entries(profile.socials || {}).filter(
        ([, val]) => val !== null && val !== ''
    );

    const hasBanner = !!profile.banner;

    return (
        <div className={`${glassPanel} relative overflow-hidden`}>
            {/* Banner — full-card backdrop */}
            {hasBanner && (
                <>
                    <Banner
                        src={profile.banner}
                        alt={`${displayName}'s banner`}
                        priority
                        className="absolute inset-0 h-full w-full object-cover"
                    />
                    {/* Readability overlay — heaviest over content, lightest over empty space */}
                    <div className="absolute inset-0 bg-gradient-to-r from-card to-card/35" />
                </>
            )}

            <motion.div
                initial={{ x: '-120%', opacity: 0 }}
                animate={{ x: '120%', opacity: [0, 0.5, 0] }}
                transition={{ duration: 1.4, ease: 'easeInOut', delay: 0.15 }}
                className="pointer-events-none absolute inset-y-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent dark:via-white/[0.08]"
            />

            {/* Glow — only when no banner (banner already provides visual interest) */}
            {!hasBanner && (
                <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 bg-chart-1/10 blur-3xl" />
            )}

            {/* Content — always has its own padding */}
            <div className="relative p-8">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-10">
                        <TieredAvatar
                            src={profile.avatar}
                            alt={displayName}
                            tier={getDonorTier(profile.notification_tags)}
                            priority
                            className="h-20 w-20 shrink-0 sm:h-24 sm:w-24"
                            fallback={
                                <UserCircleIcon
                                    size={32}
                                    className="text-chart-1"
                                />
                            }
                        />

                        <div className="min-w-0 flex-1">
                            <h1 className="truncate font-['Sora',sans-serif] text-xl font-bold tracking-tight sm:text-2xl">
                                <TieredName
                                    name={displayName}
                                    tier={displayTier}
                                />
                            </h1>

                            <p className="text-xs font-medium text-chart-1">
                                @{displayUsername}
                            </p>

                            <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                {profile.college && (
                                    <span className="inline-flex items-center gap-1.5">
                                        <GraduationCap
                                            size={15}
                                            className="text-chart-1"
                                        />
                                        {profile.college}
                                    </span>
                                )}
                                {profile.joined_at && (
                                    <span className="inline-flex items-center gap-1.5">
                                        <CalendarBlank
                                            size={15}
                                            className="text-muted-foreground"
                                        />
                                        Joined{' '}
                                        {new Date(
                                            profile.joined_at
                                        ).toLocaleDateString('en-US', {
                                            month: 'short',
                                            year: 'numeric',
                                        })}
                                    </span>
                                )}
                            </div>

                            {/* About */}
                            {profile.about && (
                                <div className="mt-3">
                                    <p className={eyebrow}>About</p>
                                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                                        {profile.about}
                                    </p>
                                </div>
                            )}

                            {/* Social links */}
                            {activeSocials.length > 0 && (
                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                    {activeSocials.map(([key, url]) => (
                                        <a
                                            key={key}
                                            href={
                                                url?.startsWith('http')
                                                    ? url
                                                    : '#'
                                            }
                                            target={
                                                url?.startsWith('http')
                                                    ? '_blank'
                                                    : undefined
                                            }
                                            rel="noreferrer"
                                            title={key}
                                            className="flex h-8 w-8 items-center justify-center border border-border bg-card/60 text-muted-foreground backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-chart-1/40 hover:text-chart-1 hover:shadow-md"
                                        >
                                            {SOCIAL_ICONS[key] || (
                                                <Globe size={15} />
                                            )}
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Target chip */}
                    <div className="inline-flex shrink-0 items-center gap-2 self-start border border-chart-1/25 bg-chart-1/10 px-4 py-2 backdrop-blur-md">
                        <span className="font-['JetBrains_Mono',monospace] text-xs font-semibold text-primary dark:text-chart-1">
                            GATE {profile.targetYear || '2027'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
