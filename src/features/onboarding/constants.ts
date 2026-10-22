import type { OnboardingStep } from './types';

export const STEP_TITLES: Record<OnboardingStep, string> = {
    profile: 'Set up your profile',
    goal: 'Tell us your target',
    xl: 'Choose your XL optionals',
    finish: "You're all set",
};

export const STEP_SUBTITLES: Partial<Record<OnboardingStep, string>> = {
    profile:
        'This information appears on your profile and helps peers find you.',
    goal: 'We use this to filter subjects, questions, and your study plan.',
    xl: 'GATE XL requires exactly two optional subjects.',
    finish: "Here's a summary of what you've set up.",
};

import {
    Code,
    DiscordLogo,
    GithubLogo,
    Globe,
    LinkedinLogo,
    RedditLogo,
    SpotifyLogo,
    Terminal,
    XLogo,
    YoutubeLogo,
} from '@phosphor-icons/react';

export const SOCIAL_PLATFORMS = [
    {
        key: 'github_url',
        label: 'GitHub',
        placeholder: 'github.com/yourhandle',
        Icon: GithubLogo,
    },
    {
        key: 'x_url',
        label: 'X (Formerly Twitter)',
        placeholder: 'x.com/yourhandle',
        Icon: XLogo,
    },
    {
        key: 'linkedin_url',
        label: 'LinkedIn',
        placeholder: 'linkedin.com/in/you',
        Icon: LinkedinLogo,
    },
    {
        key: 'reddit_url',
        label: 'Reddit',
        placeholder: 'reddit.com/u/you',
        Icon: RedditLogo,
    },
    {
        key: 'youtube_url',
        label: 'YouTube',
        placeholder: 'youtube.com/@you',
        Icon: YoutubeLogo,
    },
    {
        key: 'mastodon_url',
        label: 'Mastodon',
        placeholder: 'mastodon.social/@you',
        Icon: Globe,
    },
    {
        key: 'discord_url',
        label: 'Discord',
        placeholder: 'discord.gg/invite',
        Icon: DiscordLogo,
    },
    {
        key: 'spotify_url',
        label: 'Spotify',
        placeholder: 'open.spotify.com/user/you',
        Icon: SpotifyLogo,
    },
    {
        key: 'lemmy_url',
        label: 'Lemmy',
        placeholder: 'lemmy.world/u/you',
        Icon: Globe,
    },
    {
        key: 'leetcode_url',
        label: 'LeetCode',
        placeholder: 'leetcode.com/you',
        Icon: Code,
    },
    {
        key: 'codeforces_url',
        label: 'Codeforces',
        placeholder: 'codeforces.com/profile/you',
        Icon: Terminal,
    },
] as const;

export const VISIBLE_SOCIAL_COUNT = 2;

export const DEFAULT_TARGET_YEAR = new Date().getFullYear() + 1;
