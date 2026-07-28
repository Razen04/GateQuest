import React, { useEffect, useState } from 'react';
import useAuth from '@/shared/hooks/useAuth';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import {
    GithubLogoIcon,
    LinkedinLogoIcon,
    RedditLogoIcon,
    SpotifyLogoIcon,
    DiscordLogoIcon,
    XLogoIcon,
    MastodonLogoIcon,
    FediverseLogoIcon,
    YoutubeLogoIcon,
} from '@phosphor-icons/react';
import { getSocialSettingsValue, handleUpdateSocialSettings } from '../api/social-settings';

interface SocialSettingsFormProps {
    onSuccess?: () => void;
}

export default function SocialSettingsForm({ onSuccess }: SocialSettingsFormProps) {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [socials, setSocials] = useState({
        github_url: '',
        x_url: '',
        linkedin_url: '',
        reddit_url: '',
        spotify_url: '',
        discord_url: '',
        mastodon_url: '',
        youtube_url: '',
        lemmy_url: '',
    });

    useEffect(() => {
        const fetchSocials = async () => {
            if (!user?.id) return;

            const data = await getSocialSettingsValue(user);

            if (data) {
                setSocials({
                    github_url: data.github_url || '',
                    x_url: data.x_url || '',
                    linkedin_url: data.linkedin_url || '',
                    reddit_url: data.reddit_url || '',
                    spotify_url: data.spotify_url || '',
                    discord_url: data.discord_url || '',
                    mastodon_url: data.mastodon_url || '',
                    youtube_url: data.youtube_url || '',
                    lemmy_url: data.lemmy_url || '',
                });
            }
            setIsLoading(false);
        };
        fetchSocials();
    }, [user]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user) return;
        setIsSaving(true);

        const formData = new FormData(e.currentTarget);

        const error = await handleUpdateSocialSettings(formData, user);
        if (error) {
            toast.error('Failed to save social links.');
        } else {
            toast.success('Social links updated successfully!');
            onSuccess?.();
        }
        setIsSaving(false);
    };

    if (isLoading) return <div className="text-sm text-slate-500">Loading socials...</div>;

    // ... inside SocialSettingsForm

    const socialFields = [
        {
            name: 'github_url',
            label: 'GitHub URL',
            icon: <GithubLogoIcon size={18} />,
            value: socials.github_url,
        },
        {
            name: 'linkedin_url',
            label: 'LinkedIn URL',
            icon: <LinkedinLogoIcon size={18} />,
            value: socials.linkedin_url,
        },
        {
            name: 'x_url',
            label: 'X URL',
            icon: <XLogoIcon size={18} />,
            value: socials.x_url,
        },
        {
            name: 'reddit_url',
            label: 'Reddit URL',
            icon: <RedditLogoIcon size={18} />,
            value: socials.reddit_url,
        },
        {
            name: 'spotify_url',
            label: 'Spotify URL',
            icon: <SpotifyLogoIcon size={18} />,
            value: socials.spotify_url,
        },
        {
            name: 'mastodon_url',
            label: 'Mastodon URL',
            icon: <MastodonLogoIcon size={18} />,
            value: socials.mastodon_url,
        },
        {
            name: 'youtube_url',
            label: 'Youtube URL',
            icon: <YoutubeLogoIcon size={18} />,
            value: socials.youtube_url,
        },
        {
            name: 'discord_url',
            label: 'Discord Username',
            inputType: 'text', // Bypasses URL validation
            placeholder: 'e.g., your_username',
            icon: <DiscordLogoIcon size={18} />,
            value: socials.discord_url,
        },
        {
            name: 'lemmy_url',
            label: 'Lemmy Handle / URL',
            inputType: 'text', // Bypasses URL validation
            placeholder: 'e.g., user@lemmy.world',
            icon: <FediverseLogoIcon size={18} />,
            value: socials.lemmy_url,
        },
    ] as const;

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                {socialFields.map((field) => (
                    <div key={field.name} className="space-y-2">
                        <Label htmlFor={field.name} className="flex items-center gap-2">
                            {field.icon} {field.label}
                        </Label>
                        <Input
                            id={field.name}
                            name={field.name}
                            type={'inputType' in field ? field.inputType : 'url'}
                            defaultValue={field.value}
                            placeholder={'placeholder' in field ? field.placeholder : 'https://'}
                        />
                    </div>
                ))}
            </div>

            <div className="pt-4 border-t flex justify-end">
                <Button type="submit" disabled={isSaving} className="w-full sm:w-auto">
                    {isSaving ? 'Saving...' : 'Save Socials'}
                </Button>
            </div>
        </form>
    );
}
