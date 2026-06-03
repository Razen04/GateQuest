import {
    CalendarBlank,
    GithubLogo,
    LinkedinLogo,
    Globe,
    XLogoIcon,
    GraduationCap,
    Target,
    DiscordLogo,
    RedditLogo,
    SpotifyLogo,
    YoutubeLogo,
    ArrowUpRight,
    FediverseLogoIcon,
    MastodonLogoIcon,
} from '@phosphor-icons/react';
import type { ProfileData } from '../types/profile';
import type { JSX } from 'react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';

// Moved from the main page to keep this file self-contained
const SOCIAL_ICONS: Record<string, JSX.Element> = {
    github: <GithubLogo size={13} />,
    linkedin: <LinkedinLogo size={13} />,
    x: <XLogoIcon size={13} />,
    discord: <DiscordLogo size={13} />,
    reddit: <RedditLogo size={13} />,
    spotify: <SpotifyLogo size={13} />,
    youtube: <YoutubeLogo size={13} />,
    lemmy: <FediverseLogoIcon size={13} />,
    mastodon: <MastodonLogoIcon size={13} />,
};

interface ProfileSidePanelProps {
    profile: ProfileData['profile'];
    globalStats: ProfileData['global_stats'];
}

export default function ProfileSidePanel({ profile, globalStats }: ProfileSidePanelProps) {
    const activeSocials = Object.entries(profile.socials || {}).filter(
        ([, val]) => val !== null && val !== '',
    );

    const getFixedType = (type: string) => {
        if (type === 'multiple-choice') return 'MCQ';
        else if (type === 'numerical') return 'NAT';
        else return 'MSQ';
    };

    return (
        <aside className="flex flex-col gap-4">
            {/* ── Card 1: Bio & Links ── */}
            <Card className="rounded-md">
                <CardContent className="p-5">
                    {profile.about && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                            {profile.about}
                        </p>
                    )}
                    {/* Metadata: College & Join Date */}
                    <div className="flex flex-col gap-2.5 text-xs text-slate-500 dark:text-slate-400 mb-4">
                        {profile.college && (
                            <span className="flex items-center gap-2">
                                <GraduationCap
                                    size={13}
                                    className="text-slate-400 dark:text-slate-500 shrink-0"
                                />
                                {profile.college}
                            </span>
                        )}
                        {profile.joined_at && (
                            <span className="flex items-center gap-2">
                                <CalendarBlank
                                    size={13}
                                    className="text-slate-400 dark:text-slate-500 shrink-0"
                                />
                                Joined{' '}
                                {new Date(profile.joined_at).toLocaleDateString('en-US', {
                                    month: 'short',
                                    year: 'numeric',
                                })}
                            </span>
                        )}
                    </div>
                    {/* Social Links */}
                    {activeSocials.length > 0 && (
                        <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
                            <p className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2.5">
                                Links
                            </p>
                            {activeSocials.map(([key, url]) => (
                                <a
                                    key={key}
                                    href={url?.startsWith('http') ? url : '#'}
                                    target={url?.startsWith('http') ? '_blank' : undefined}
                                    className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group py-1 capitalize"
                                >
                                    <span className="text-slate-400 dark:text-slate-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                                        {SOCIAL_ICONS[key] || <Globe size={13} />}
                                    </span>
                                    {key}
                                    <ArrowUpRight
                                        size={10}
                                        className="ml-auto opacity-0 group-hover:opacity-50 transition-opacity"
                                    />
                                </a>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
            {/* ── Card 2: Question Types Breakdown ── */}
            {globalStats.question_types.length > 0 && (
                <Card className="rounded-md">
                    <CardContent className="p-4">
                        <p className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">
                            Question Types
                        </p>
                        {globalStats.question_types.map((qt) => {
                            const pct =
                                globalStats.total_unique_solved > 0
                                    ? Math.round(
                                          (qt.solved / globalStats.total_unique_solved) * 100,
                                      )
                                    : 0;

                            const color =
                                qt.type === 'multiple-choice'
                                    ? 'bg-blue-500'
                                    : qt.type === 'numerical'
                                      ? 'bg-violet-500'
                                      : 'bg-amber-400';
                            return (
                                <div
                                    key={qt.type}
                                    className="flex items-center gap-2 mb-2.5 last:mb-0"
                                >
                                    <div className={`w-2 h-2 rounded-full shrink-0 ${color}`} />
                                    <span className="text-xs text-slate-500 dark:text-slate-400 w-8">
                                        {getFixedType(qt.type)}
                                    </span>
                                    <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${color} rounded-full`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300 w-8 text-right font-['JetBrains_Mono',monospace]">
                                        {qt.solved}
                                    </span>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>
            )}
        </aside>
    );
}
