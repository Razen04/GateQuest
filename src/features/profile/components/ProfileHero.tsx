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
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from '@/shared/components/ui/avatar';
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
};

interface ProfileHeroProps {
    profile: ProfileData['profile'];
}

export default function ProfileHero({ profile }: ProfileHeroProps) {
    const displayName = profile.name || 'Anonymous User';
    const displayUsername = profile.username || 'user';
    const displayInitials = displayName.substring(0, 2).toUpperCase();

    const activeSocials = Object.entries(profile.socials || {}).filter(
        ([, val]) => val !== null && val !== ''
    );

    return (
        <div className={`${glassPanel} p-6 sm:p-7`}>
            <motion.div
                initial={{ x: '-120%', opacity: 0 }}
                animate={{ x: '120%', opacity: [0, 0.5, 0] }}
                transition={{ duration: 1.4, ease: 'easeInOut', delay: 0.15 }}
                className="pointer-events-none absolute inset-y-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent dark:via-white/[0.08]"
            />

            <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 bg-[#3E8EFF]/10 blur-3xl" />

            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-5">
                    {/* Signature: rotating lens ring around the avatar */}
                    <div className="relative h-20 w-20 shrink-0 sm:h-24 sm:w-24">
                        <Avatar className="absolute inset-[5px] h-[calc(100%-10px)] w-[calc(100%-10px)] border border-white/40 shadow-xl dark:border-white/10">
                            {profile.avatar && (
                                <AvatarImage
                                    src={profile.avatar}
                                    alt={displayName}
                                    className="object-cover"
                                />
                            )}
                            <AvatarFallback className="bg-slate-800 text-lg font-bold text-white dark:bg-slate-900">
                                {displayInitials}
                            </AvatarFallback>
                        </Avatar>
                    </div>

                    <div className="min-w-0">
                        <h1 className="truncate font-['Sora',sans-serif] text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                            {displayName}
                        </h1>

                        <p className="text-xs font-medium text-blue-500 dark:text-blue/50">
                            @{displayUsername}
                        </p>

                        <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-white/60">
                            {profile.college && (
                                <span className="inline-flex items-center gap-1.5">
                                    <GraduationCap
                                        size={15}
                                        className="text-[#3E8EFF]"
                                    />
                                    {profile.college}
                                </span>
                            )}
                            {profile.joined_at && (
                                <span className="inline-flex items-center gap-1.5">
                                    <CalendarBlank
                                        size={15}
                                        className="text-slate-400"
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
                            <>
                                <p className={`mt-3 mb-1 ${eyebrow}`}>About</p>
                                <p className="text-sm leading-relaxed text-slate-600 dark:text-white/65">
                                    {profile.about}
                                </p>
                            </>
                        )}

                        {/* Social links */}
                        {activeSocials.length > 0 && (
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                {activeSocials.map(([key, url]) => (
                                    <a
                                        key={key}
                                        href={
                                            url?.startsWith('http') ? url : '#'
                                        }
                                        target={
                                            url?.startsWith('http')
                                                ? '_blank'
                                                : undefined
                                        }
                                        rel="noreferrer"
                                        title={key}
                                        className="flex h-8 w-8 items-center justify-center border border-white/60 bg-white/50 text-slate-600 transition-all hover:-translate-y-0.5 hover:border-[#3E8EFF]/40 hover:text-[#3E8EFF] hover:shadow-md dark:border-white/10 dark:bg-white/[0.05] dark:text-white/60 dark:hover:text-[#8fbcff]"
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

                {/* Target chip — a live signal, not a static badge */}
                <div className="inline-flex shrink-0 items-center gap-2 self-start border border-[#3E8EFF]/25 bg-[#3E8EFF]/10 px-4 py-2 backdrop-blur-md">
                    <span className="font-['JetBrains_Mono',monospace] text-xs font-semibold text-[#1f5fcc] dark:text-[#8fbcff]">
                        GATE {profile.targetYear || '2027'}
                    </span>
                </div>
            </div>
        </div>
    );
}
