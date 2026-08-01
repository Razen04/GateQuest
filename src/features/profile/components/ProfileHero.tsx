import type { ProfileData } from '../types/profile';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import { TargetIcon } from '@phosphor-icons/react';

interface ProfileHeroProps {
    profile: ProfileData['profile'];
}

const ProfileHero = ({ profile }: ProfileHeroProps) => {
    const displayName = profile.name || 'Anonymous User';
    const displayUsername = profile.username || 'user';
    const displayInitials = displayName.substring(0, 2).toUpperCase();

    return (
        <div className="bg-gradient-to-r from-slate-900 via-blue-700 to-slate-900 pb-12 pt-8 px-8 sm:px-6">
            <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-end gap-4">
                {/* Avatar */}
                <Avatar className="h-20 w-20 shrink-0 border-4 border-white/10 shadow-xl">
                    {profile.avatar && (
                        <AvatarImage
                            src={profile.avatar}
                            alt={displayName}
                            className="object-cover"
                        />
                    )}
                    <AvatarFallback className="bg-slate-800 text-white text-xl font-semibold">
                        {displayInitials}
                    </AvatarFallback>
                </Avatar>

                {/* Identity */}
                <div className="flex-1 min-w-0">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                        {displayName}
                    </h1>

                    <p className="mt-1 text-sm text-slate-300">@{displayUsername}</p>
                </div>

                {/* Goal Badge */}
                <Badge
                    variant="secondary"
                    className="w-fit gap-2 bg-white/10 text-white border border-white/10 backdrop-blur-sm px-3 py-1.5"
                >
                    <TargetIcon size={14} />
                    GATE {profile.targetYear || '2027'}
                </Badge>
            </div>
        </div>
    );
};

export default ProfileHero;
