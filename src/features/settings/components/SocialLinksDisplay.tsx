import {
    DiscordLogoIcon,
    FediverseLogoIcon,
    GithubLogoIcon,
    LinkedinLogoIcon,
    MastodonLogoIcon,
    RedditLogoIcon,
    SpotifyLogoIcon,
    XLogoIcon,
    YoutubeLogoIcon,
} from '@phosphor-icons/react';
import { toast } from 'sonner';

interface SocialLinksDisplayProps {
    links: Record<string, string>;
}

export default function SocialLinksDisplay({ links }: SocialLinksDisplayProps) {
    if (Object.keys(links).length === 0) return null;

    return (
        <div className="flex items-center gap-3 mt-3 text-gray-500 dark:text-gray-400">
            {links.github_url && (
                <a
                    href={links.github_url}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-blue-500"
                >
                    <GithubLogoIcon size={20} />
                </a>
            )}
            {links.linkedin_url && (
                <a
                    href={links.linkedin_url}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-blue-500"
                >
                    <LinkedinLogoIcon size={20} />
                </a>
            )}
            {links.x_url && (
                <a
                    href={links.x_url}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-blue-500"
                >
                    <XLogoIcon size={20} />
                </a>
            )}
            {links.youtube_url && (
                <a
                    href={links.youtube_url}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-red-500"
                >
                    <YoutubeLogoIcon size={20} />
                </a>
            )}
            {links.reddit_url && (
                <a
                    href={links.reddit_url}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-orange-500"
                >
                    <RedditLogoIcon size={20} />
                </a>
            )}
            {links.spotify_url && (
                <a
                    href={links.spotify_url}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-green-500"
                >
                    <SpotifyLogoIcon size={20} />
                </a>
            )}
            {links.mastodon_url && (
                <a
                    href={links.mastodon_url}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-purple-500"
                >
                    <MastodonLogoIcon size={20} />
                </a>
            )}
            {links.discord_url && (
                <button
                    onClick={() => {
                        navigator.clipboard.writeText(links.discord_url || '');
                        toast.success('Discord username copied!');
                    }}
                    title={`Copy Discord Username: ${links.discord_url}`}
                    className="hover:text-indigo-500 transition-colors"
                >
                    <DiscordLogoIcon size={20} />
                </button>
            )}
            {links.lemmy_url && (
                <button
                    onClick={() => {
                        navigator.clipboard.writeText(links.lemmy_url || '');
                        toast.success('Lemmy handle copied!');
                    }}
                    title={`Copy Lemmy Handle: ${links.lemmy_url}`}
                    className="hover:text-blue-400 transition-colors"
                >
                    <FediverseLogoIcon size={20} />
                </button>
            )}
        </div>
    );
}
